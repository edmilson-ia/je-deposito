/**
 * Sincroniza a aba CATALOGO da planilha Google Sheets para a tabela `produtos` no Supabase.
 *
 * Fonte: export CSV público do Google Sheets (a planilha precisa estar como "Qualquer
 * pessoa com o link pode visualizar" — é o que já está configurado). Não depende de
 * credenciais Google, então também pode rodar dentro de um workflow do n8n via HTTP Request.
 *
 * Uso:
 *   npm run sync:catalogo            → sincroniza e mostra relatório
 *   npm run sync:catalogo -- --apply → aplica de fato (sem essa flag, roda em modo "dry run")
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { supabaseAdmin } from "../server/supabaseServer";
import { env } from "../server/env";
import { inferirCategoria } from "../server/categorias";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PASTA_FOTOS_MANUAIS = path.resolve(__dirname, "../public/produtos");
const EXTENSOES_SUPORTADAS = [".jpg", ".jpeg", ".png", ".webp"];

/** Procura uma foto salva manualmente em /public/produtos com o nome do produto. */
function buscarFotoManual(nomeProduto: string): string | null {
  for (const ext of EXTENSOES_SUPORTADAS) {
    const candidato = path.join(PASTA_FOTOS_MANUAIS, `${nomeProduto}${ext}`);
    if (fs.existsSync(candidato)) return `/produtos/${nomeProduto}${ext}`;
  }
  // procura ignorando maiúscula/minúscula
  if (!fs.existsSync(PASTA_FOTOS_MANUAIS)) return null;
  const alvo = nomeProduto.toLowerCase();
  for (const arquivo of fs.readdirSync(PASTA_FOTOS_MANUAIS)) {
    const ext = path.extname(arquivo).toLowerCase();
    if (!EXTENSOES_SUPORTADAS.includes(ext)) continue;
    const nomeArquivo = path.basename(arquivo, path.extname(arquivo)).toLowerCase();
    if (nomeArquivo === alvo) return `/produtos/${arquivo}`;
  }
  return null;
}

const SHEET_ID = process.env.GOOGLE_SHEETS_ID;
// Nome exato da aba, com o acento como está na planilha (confirmado nos nomes reais das
// abas: CATALAGO, cesta basica, Cópia de cesta basica, Cadastro cliente, ESTOQUE, VENDA).
// Esta aba tem os preços de VENDA (com margem aplicada) — é a fonte correta para o site.
const ABA = "Cópia de cesta basica";
const ABA_ESTOQUE = "ESTOQUE";
const ESTOQUE_PADRAO = 100; // valor usado pela própria planilha para quase todo produto

interface LinhaCatalogo {
  nome: string;
  descricao: string | null;
  preco: number;
  imagemUrl: string | null;
}

function parseCSV(texto: string): string[][] {
  const linhas: string[][] = [];
  let campo = "";
  let linha: string[] = [];
  let dentroDeAspas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    const proximo = texto[i + 1];

    if (dentroDeAspas) {
      if (c === '"' && proximo === '"') {
        campo += '"';
        i++;
      } else if (c === '"') {
        dentroDeAspas = false;
      } else {
        campo += c;
      }
    } else if (c === '"') {
      dentroDeAspas = true;
    } else if (c === ",") {
      linha.push(campo);
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && proximo === "\n") i++;
      linha.push(campo);
      linhas.push(linha);
      linha = [];
      campo = "";
    } else {
      campo += c;
    }
  }
  if (campo.length > 0 || linha.length > 0) {
    linha.push(campo);
    linhas.push(linha);
  }
  return linhas.filter((l) => l.some((c) => c.trim() !== ""));
}

function parsePreco(texto: string): number | null {
  const limpo = texto
    .replace("R$", "")
    .trim()
    .replace(/\./g, "")
    .replace(",", ".");
  const valor = Number(limpo);
  return Number.isFinite(valor) ? valor : null;
}

/**
 * Alguns links da coluna link_imagem não são links diretos de imagem — são URLs de
 * resultado de busca de imagens do Google (google.com/imgres?...), que abrem uma página
 * de busca, não a foto. Tratamos como "sem imagem" em vez de quebrar o <img> no site.
 */
function ehLinkDeImagemValido(url: string): boolean {
  if (!url) return false;
  if (url.includes("google.com/imgres")) return false;
  return /^https?:\/\//.test(url);
}

/**
 * O formato "drive.google.com/uc?export=view&id=..." usado na planilha é BLOQUEADO pelo
 * Chrome (net::ERR_BLOCKED_BY_ORB) quando usado direto num <img>, porque o Drive responde
 * com um redirect 303 (Content-Type: application/binary) antes de chegar na imagem de
 * verdade — o Chrome trata isso como resposta opaca suspeita e bloqueia silenciosamente
 * (confirmado testando no navegador real). O formato "thumbnail?id=...&sz=w1000" evita
 * esse redirect e funciona normalmente.
 */
function normalizarLinkImagem(url: string): string {
  const match = url.match(/[?&]id=([^&]+)/);
  if (!match) return url;
  return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
}

async function buscarLinhasDaPlanilha(): Promise<LinhaCatalogo[]> {
  if (!SHEET_ID) throw new Error("GOOGLE_SHEETS_ID não configurado no .env");

  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(ABA)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Não foi possível baixar a planilha (HTTP ${res.status}). Confirme que ela está ` +
        `compartilhada como "Qualquer pessoa com o link pode visualizar".`,
    );
  }
  const texto = await res.text();
  const linhas = parseCSV(texto);

  // Esta aba não tem linha de cabeçalho (a primeira linha já é um produto). Só tratamos
  // a primeira linha como cabeçalho se ela realmente parecer um cabeçalho.
  const primeiraLinhaEhCabecalho = linhas[0]?.[0]?.trim().toUpperCase() === "PRODUTO";

  let idxNome = 0;
  let idxDescricao = 1;
  let idxPreco = 2;
  let idxLinkImagem = 4;
  let linhasDeDados = linhas;

  if (primeiraLinhaEhCabecalho) {
    const [cabecalho, ...resto] = linhas;
    idxNome = cabecalho.findIndex((c) => c.trim().toUpperCase() === "PRODUTO");
    idxDescricao = cabecalho.findIndex((c) => c.trim().toUpperCase().startsWith("DESCRI"));
    idxPreco = cabecalho.findIndex((c) => c.trim().toUpperCase().startsWith("PRE"));
    idxLinkImagem = cabecalho.findIndex((c) => c.trim().toLowerCase() === "link_imagem");
    linhasDeDados = resto;

    if (idxNome === -1 || idxPreco === -1) {
      throw new Error(`Não encontrei as colunas PRODUTO/PREÇO na aba "${ABA}". A planilha mudou de layout?`);
    }
  }

  return linhasDeDados
    .map((linha): LinhaCatalogo | null => {
      const nome = linha[idxNome]?.trim();
      if (!nome) return null;
      const preco = parsePreco(linha[idxPreco] ?? "");
      if (preco === null) return null;
      const linkImagem = linha[idxLinkImagem]?.trim() ?? "";
      return {
        nome,
        descricao: linha[idxDescricao]?.trim() || null,
        preco,
        imagemUrl: ehLinkDeImagemValido(linkImagem) ? normalizarLinkImagem(linkImagem) : null,
      };
    })
    .filter((l): l is LinhaCatalogo => l !== null);
}

async function buscarEstoque(): Promise<Map<string, number>> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(ABA_ESTOQUE)}`;
  const res = await fetch(url);
  if (!res.ok) return new Map();

  const linhas = parseCSV(await res.text());
  const [cabecalho, ...resto] = linhas;
  const temCabecalho = cabecalho[0]?.trim().toUpperCase() === "PRODUTO";
  const dados = temCabecalho ? resto : linhas;

  const mapa = new Map<string, number>();
  for (const linha of dados) {
    const nome = linha[0]?.trim();
    const quantidade = Number(linha[1]?.trim());
    if (nome && Number.isFinite(quantidade)) mapa.set(nome, quantidade);
  }
  return mapa;
}

async function main() {
  const aplicar = process.argv.includes("--apply");
  const linhas = await buscarLinhasDaPlanilha();

  // Produtos sem foto válida na planilha: usa uma foto salva manualmente em
  // /public/produtos (veja o LEIA-ME.md lá dentro), se existir.
  for (const l of linhas) {
    if (!l.imagemUrl) {
      const fotoManual = buscarFotoManual(l.nome);
      if (fotoManual) l.imagemUrl = fotoManual;
    }
  }

  const semImagem = linhas.filter((l) => !l.imagemUrl);
  const semDescricao = linhas.filter((l) => !l.descricao);

  const contagemPorNome = new Map<string, number>();
  for (const l of linhas) contagemPorNome.set(l.nome, (contagemPorNome.get(l.nome) ?? 0) + 1);
  const duplicados = [...contagemPorNome.entries()].filter(([, qtd]) => qtd > 1);

  console.log(`Encontrados ${linhas.length} produtos na aba "${ABA}".`);
  console.log(`- ${semImagem.length} produto(s) SEM imagem (vazio ou link quebrado — ex: resultado de busca do Google).`);
  console.log(`- ${semDescricao.length} produto(s) sem descrição (normal para a maioria — só um alerta).`);
  console.log(`- ${duplicados.length} nome(s) de produto duplicado(s) na planilha.`);
  if (semImagem.length > 0) {
    console.log("\nProdutos sem imagem:");
    for (const p of semImagem) console.log(`  - ${p.nome}`);
  }
  if (duplicados.length > 0) {
    console.log("\nProdutos duplicados (a sincronização vai manter só o último preço encontrado):");
    for (const [nome, qtd] of duplicados) {
      const precos = linhas.filter((l) => l.nome === nome).map((l) => l.preco);
      console.log(`  - ${nome} (${qtd}x) — preços encontrados: ${precos.join(", ")}`);
    }
  }

  const mapaEstoque = await buscarEstoque();
  const semEstoqueCadastrado = linhas.filter((l) => !mapaEstoque.has(l.nome));
  console.log(
    `- ${semEstoqueCadastrado.length} produto(s) não encontrados na aba "${ABA_ESTOQUE}" pelo nome ` +
      `(vão receber estoque padrão de ${ESTOQUE_PADRAO} até você conferir).`,
  );

  if (!aplicar) {
    console.log("\nModo dry-run (nenhuma alteração foi feita). Rode com --apply para gravar no Supabase.");
    return;
  }

  const linhasParaGravar = linhas.map((l) => ({
    nome: l.nome,
    descricao: l.descricao,
    categoria: inferirCategoria(l.nome),
    preco: l.preco,
    imagem_url: l.imagemUrl,
    estoque: mapaEstoque.get(l.nome) ?? ESTOQUE_PADRAO,
    ativo: true,
  }));

  // upsert por nome (evita duplicar produto já sincronizado antes)
  for (const produto of linhasParaGravar) {
    const { error } = await supabaseAdmin
      .from("produtos")
      .upsert(produto, { onConflict: "nome", ignoreDuplicates: false });
    if (error) {
      console.error(`Falha ao gravar "${produto.nome}": ${error.message}`);
    }
  }

  console.log(`\n${linhasParaGravar.length} produtos sincronizados com o Supabase (${env.supabaseUrl}).`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
