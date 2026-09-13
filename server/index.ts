import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./env.js";
import { supabaseAdmin } from "./supabaseServer.js";
import { gerarPixCopiaCola } from "./pix.js";
import { normalizarTelefone } from "./telefone.js";
import {
  verificarSenha,
  definirNovaSenha,
  gerarCodigoRecuperacao,
  verificarCodigoRecuperacao,
} from "./adminAuth.js";
import { enviarCodigoRecuperacao } from "./mailer.js";
import { ORDEM_CATEGORIAS } from "./categorias.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser(env.sessionSecret));

const SESSION_COOKIE = "je_admin_session";
const SESSION_COOKIE_PRECOS = "je_precos_session";

function exigirAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.signedCookies[SESSION_COOKIE] === "ok") {
    next();
    return;
  }
  res.status(401).json({ erro: "Sessão expirada. Faça login novamente." });
}

function exigirPrecos(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.signedCookies[SESSION_COOKIE_PRECOS] === "ok") {
    next();
    return;
  }
  res.status(401).json({ erro: "Sessão expirada. Faça login novamente." });
}

// ---------- Catálogo (público) ----------

app.get("/api/produtos", async (_req, res) => {
  const { data, error } = await supabaseAdmin.from("produtos").select("*").eq("ativo", true);

  if (error || !data) return res.status(500).json({ erro: "Não foi possível carregar o catálogo agora." });

  // Ordem fixa de categorias (bebidas primeiro, depois doces, cestas, kits...), não
  // alfabética — e dentro de cada categoria, alfabética pelo nome do produto.
  const produtos = [...data].sort((a, b) => {
    const posA = ORDEM_CATEGORIAS.indexOf(a.categoria as (typeof ORDEM_CATEGORIAS)[number]);
    const posB = ORDEM_CATEGORIAS.indexOf(b.categoria as (typeof ORDEM_CATEGORIAS)[number]);
    const ordemA = posA === -1 ? ORDEM_CATEGORIAS.length : posA;
    const ordemB = posB === -1 ? ORDEM_CATEGORIAS.length : posB;
    if (ordemA !== ordemB) return ordemA - ordemB;
    return a.nome.localeCompare(b.nome, "pt-BR");
  });

  res.json({ produtos });
});

// ---------- Clientes (identificação no checkout) ----------

app.post("/api/clientes/identificar", async (req, res) => {
  const telefone = normalizarTelefone(String(req.body?.telefone ?? ""));
  if (!telefone) return res.status(400).json({ erro: "Telefone inválido." });

  const { data, error } = await supabaseAdmin
    .from("clientes")
    .select("nome")
    .eq("telefone", telefone)
    .maybeSingle();

  if (error) return res.status(500).json({ erro: "Não foi possível verificar o telefone agora." });
  res.json({ existe: Boolean(data), nome: data?.nome });
});

app.post("/api/clientes", async (req, res) => {
  const telefone = normalizarTelefone(String(req.body?.telefone ?? ""));
  const nome = String(req.body?.nome ?? "").trim();

  if (!telefone) return res.status(400).json({ erro: "Telefone inválido." });
  if (nome.length < 2) return res.status(400).json({ erro: "Informe seu nome completo." });

  const { data, error } = await supabaseAdmin
    .from("clientes")
    .insert({ nome, telefone })
    .select("id, nome, telefone")
    .single();

  if (error) {
    if (error.code === "23505") {
      return res.status(409).json({ erro: "Esse telefone já está cadastrado." });
    }
    return res.status(500).json({ erro: "Não foi possível cadastrar seu contato agora." });
  }
  res.status(201).json(data);
});

// ---------- Pedidos ----------

app.post("/api/pedidos", async (req, res) => {
  const telefone = normalizarTelefone(String(req.body?.telefone ?? ""));
  const itensBrutos = Array.isArray(req.body?.itens) ? req.body.itens : [];

  if (!telefone) return res.status(400).json({ erro: "Telefone inválido." });
  if (itensBrutos.length === 0) return res.status(400).json({ erro: "O carrinho está vazio." });

  const { data: cliente, error: erroCliente } = await supabaseAdmin
    .from("clientes")
    .select("id")
    .eq("telefone", telefone)
    .maybeSingle();

  if (erroCliente || !cliente) {
    return res.status(400).json({ erro: "Cliente não encontrado. Cadastre-se antes de finalizar o pedido." });
  }

  const produtoIds: string[] = itensBrutos.map((i: { produto_id: string }) => i.produto_id);
  const { data: produtos, error: erroProdutos } = await supabaseAdmin
    .from("produtos")
    .select("id, nome, preco, estoque, ativo")
    .in("id", produtoIds);

  if (erroProdutos || !produtos) {
    return res.status(500).json({ erro: "Não foi possível validar os produtos do pedido." });
  }

  let total = 0;
  const itensParaInserir: { produto_id: string; quantidade: number; preco_unitario: number }[] = [];
  const descricaoItens: string[] = [];

  for (const item of itensBrutos as { produto_id: string; quantidade: number }[]) {
    const produto = produtos.find((p) => p.id === item.produto_id);
    const quantidade = Number(item.quantidade);
    if (!produto || !produto.ativo || !Number.isFinite(quantidade) || quantidade <= 0) {
      return res.status(400).json({ erro: "Um dos itens do carrinho não está mais disponível." });
    }
    if (produto.estoque < quantidade) {
      return res.status(409).json({ erro: "Um dos itens não tem estoque suficiente no momento." });
    }
    total += produto.preco * quantidade;
    itensParaInserir.push({
      produto_id: produto.id,
      quantidade,
      preco_unitario: produto.preco,
    });
    descricaoItens.push(`${quantidade}x ${produto.nome}`);
  }

  const { data: pedido, error: erroPedido } = await supabaseAdmin
    .from("pedidos")
    .insert({ cliente_id: cliente.id, total, status: "aguardando_pagamento", origem: "catalogo_web" })
    .select("id, total")
    .single();

  if (erroPedido || !pedido) {
    return res.status(500).json({ erro: "Não foi possível registrar o pedido agora." });
  }

  const { error: erroItens } = await supabaseAdmin
    .from("itens_pedido")
    .insert(itensParaInserir.map((i) => ({ ...i, pedido_id: pedido.id })));

  if (erroItens) {
    return res.status(500).json({ erro: "Não foi possível registrar os itens do pedido." });
  }

  const pixCopiaCola = gerarPixCopiaCola(pedido.total, pedido.id);
  await supabaseAdmin.from("pedidos").update({ pix_copia_cola: pixCopiaCola }).eq("id", pedido.id);

  // Coluna extra pedida pelo cliente: guarda no cadastro o(s) produto(s) do pedido mais recente.
  const { error: erroProdutoCliente } = await supabaseAdmin
    .from("clientes")
    .update({ produto: descricaoItens.join(", ") })
    .eq("id", cliente.id);
  if (erroProdutoCliente) {
    console.error(`Não foi possível atualizar a coluna "produto" do cliente: ${erroProdutoCliente.message}`);
  }

  res.status(201).json({
    id: pedido.id,
    total: pedido.total,
    pix_copia_cola: pixCopiaCola,
    pix_chave: env.pixKeyValue,
  });
});

// ---------- Admin ----------

app.post("/api/admin/login", async (req, res) => {
  const senha = String(req.body?.senha ?? "");
  try {
    const ok = await verificarSenha(senha);
    if (!ok) return res.status(401).json({ erro: "Senha incorreta." });

    res.cookie(SESSION_COOKIE, "ok", {
      httpOnly: true,
      signed: true,
      sameSite: "lax",
      secure: env.isProd,
      // sem maxAge: cookie de sessão, expira ao fechar o navegador
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ erro: (e as Error).message });
  }
});

app.post("/api/admin/logout", (_req, res) => {
  res.clearCookie(SESSION_COOKIE);
  res.json({ ok: true });
});

app.post("/api/admin/esqueci-senha", async (_req, res) => {
  try {
    const codigo = await gerarCodigoRecuperacao();
    await enviarCodigoRecuperacao(codigo);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ erro: (e as Error).message });
  }
});

app.post("/api/admin/redefinir-senha", async (req, res) => {
  const codigo = String(req.body?.codigo ?? "");
  const novaSenha = String(req.body?.novaSenha ?? "");

  if (novaSenha.length < 8) {
    return res.status(400).json({ erro: "A nova senha precisa ter pelo menos 8 caracteres." });
  }

  try {
    const verificacao = await verificarCodigoRecuperacao(codigo);
    if (!verificacao.ok) return res.status(400).json({ erro: verificacao.motivo });

    await definirNovaSenha(novaSenha);
    res.cookie(SESSION_COOKIE, "ok", {
      httpOnly: true,
      signed: true,
      sameSite: "lax",
      secure: env.isProd,
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ erro: (e as Error).message });
  }
});

app.get("/api/admin/clientes", exigirAdmin, async (_req, res) => {
  const { data: clientes, error } = await supabaseAdmin
    .from("clientes")
    .select("id, numero, nome, telefone, produto, criado_em")
    .order("numero", { ascending: true });

  if (error || !clientes) return res.status(500).json({ erro: "Não foi possível carregar os clientes." });

  const { data: pedidos } = await supabaseAdmin.from("pedidos").select("cliente_id");
  const contagem = new Map<string, number>();
  for (const p of pedidos ?? []) {
    contagem.set(p.cliente_id, (contagem.get(p.cliente_id) ?? 0) + 1);
  }

  res.json({
    clientes: clientes.map((c) => ({ ...c, total_pedidos: contagem.get(c.id) ?? 0 })),
  });
});

app.get("/api/admin/pedidos", exigirAdmin, async (req, res) => {
  const apenasPendentes = req.query.status !== "todos";

  let query = supabaseAdmin
    .from("pedidos")
    .select("id, total, status, origem, pix_copia_cola, criado_em, confirmado_em, clientes(nome, telefone)")
    .order("criado_em", { ascending: false });

  if (apenasPendentes) query = query.eq("status", "aguardando_pagamento");

  const { data, error } = await query;
  if (error) return res.status(500).json({ erro: "Não foi possível carregar os pedidos." });
  res.json({ pedidos: data });
});

app.post("/api/admin/pedidos/:id/confirmar-pagamento", exigirAdmin, async (req, res) => {
  const { id } = req.params;

  const { data: pedido, error: erroPedido } = await supabaseAdmin
    .from("pedidos")
    .select("id, status, cliente_id, total, clientes(nome, telefone)")
    .eq("id", id)
    .maybeSingle();

  if (erroPedido || !pedido) return res.status(404).json({ erro: "Pedido não encontrado." });
  if (pedido.status !== "aguardando_pagamento") {
    return res.status(409).json({ erro: "Este pedido já foi processado." });
  }

  const { data: itens, error: erroItens } = await supabaseAdmin
    .from("itens_pedido")
    .select("produto_id, quantidade")
    .eq("pedido_id", id);

  if (erroItens || !itens) return res.status(500).json({ erro: "Não foi possível carregar os itens do pedido." });

  for (const item of itens) {
    const { error: erroBaixa } = await supabaseAdmin.rpc("baixar_estoque", {
      p_produto_id: item.produto_id,
      p_quantidade: item.quantidade,
    });
    if (erroBaixa) {
      return res.status(500).json({ erro: `Falha ao dar baixa no estoque: ${erroBaixa.message}` });
    }
  }

  const { error: erroStatus } = await supabaseAdmin
    .from("pedidos")
    .update({ status: "pago", confirmado_em: new Date().toISOString() })
    .eq("id", id);

  if (erroStatus) return res.status(500).json({ erro: "Estoque baixado, mas falhou ao atualizar o status do pedido." });

  if (env.n8nConfirmacaoWebhookUrl) {
    try {
      const clienteInfo = Array.isArray(pedido.clientes) ? pedido.clientes[0] : pedido.clientes;
      await fetch(env.n8nConfirmacaoWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(env.n8nWebhookSecret ? { "x-webhook-secret": env.n8nWebhookSecret } : {}),
        },
        body: JSON.stringify({
          pedido_id: id,
          total: pedido.total,
          telefone: clienteInfo?.telefone,
          nome: clienteInfo?.nome,
        }),
      });
    } catch {
      // Não falha a confirmação por causa do aviso ao n8n — só loga.
      console.error(`Não foi possível notificar o n8n sobre o pedido ${id}.`);
    }
  }

  res.json({ ok: true });
});

// ---------- Painel de preços (separado do admin, login usuário+senha fixos) ----------

app.post("/api/precos/login", (req, res) => {
  const usuario = String(req.body?.usuario ?? "").replace(/\D/g, "");
  const senha = String(req.body?.senha ?? "");

  const usuarioValido = env.precosUsuario.replace(/\D/g, "");
  if (!usuarioValido || !env.precosSenha) {
    return res.status(500).json({ erro: "Painel de preços não configurado (PRECOS_USUARIO/PRECOS_SENHA)." });
  }

  if (usuario !== usuarioValido || senha !== env.precosSenha) {
    return res.status(401).json({ erro: "Usuário ou senha incorretos." });
  }

  res.cookie(SESSION_COOKIE_PRECOS, "ok", {
    httpOnly: true,
    signed: true,
    sameSite: "lax",
    secure: env.isProd,
  });
  res.json({ ok: true });
});

app.post("/api/precos/logout", (_req, res) => {
  res.clearCookie(SESSION_COOKIE_PRECOS);
  res.json({ ok: true });
});

app.get("/api/precos/produtos", exigirPrecos, async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from("produtos")
    .select("id, nome, categoria, preco, ativo")
    .order("nome", { ascending: true });

  if (error || !data) return res.status(500).json({ erro: "Não foi possível carregar os produtos." });
  res.json({ produtos: data });
});

app.put("/api/precos/produtos/:id", exigirPrecos, async (req, res) => {
  const { id } = req.params;
  const preco = Number(req.body?.preco);

  if (!Number.isFinite(preco) || preco < 0) {
    return res.status(400).json({ erro: "Preço inválido." });
  }

  const { error } = await supabaseAdmin
    .from("produtos")
    .update({ preco, atualizado_em: new Date().toISOString() })
    .eq("id", id);

  if (error) return res.status(500).json({ erro: "Não foi possível salvar o novo preço." });
  res.json({ ok: true });
});

// ---------- Estático (produção) ----------

if (env.isProd) {
  const distDir = path.resolve(__dirname, "../dist");
  app.use(express.static(distDir));
  app.get("*", (_req, res) => res.sendFile(path.join(distDir, "index.html")));
}

app.listen(env.port, () => {
  console.log(`Servidor J.E Alimentos e Destilados rodando na porta ${env.port}`);
});
