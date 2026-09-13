/**
 * Ordem de exibição das categorias no catálogo (não é alfabética — é a ordem que faz
 * sentido pro cliente: bebidas primeiro, depois doces, cestas básicas, kits, etc.).
 * Usado tanto na sincronização (pra classificar o produto) quanto na API (pra ordenar).
 */
export const ORDEM_CATEGORIAS = [
  "Destilados",
  "Doces e Salgadinhos",
  "Cesta Básica",
  "Kits",
  "Descartáveis",
  "Outros",
] as const;

export function inferirCategoria(nomeProduto: string): string {
  const n = nomeProduto.toUpperCase();

  if (n.startsWith("CESTA BASICA")) return "Cesta Básica";
  if (n.startsWith("KIT ")) return "Kits";
  // Licores entram em "Destilados" mesmo quando o nome tem palavras de doce (ex: "LICOR 43 CHOCOLATE").
  if (n.startsWith("LICOR")) return "Destilados";
  // "Bananinha" e "Morango do Amor" são licores em dose (bebida), não doce, apesar do nome.
  if (n.startsWith("BANANINHA") || n.startsWith("MORANGO DO AMOR")) return "Destilados";

  const regrasDescartaveis =
    /COPO|PRATO|GARFO|FACA|CANUDO|SACOLA|SACO DE LIXO|GUARDANAPO|QUENTINHA|CUMBUCA|COLHER/;
  if (regrasDescartaveis.test(n)) return "Descartáveis";

  const regrasDoces =
    /BALA|CHICLET|BOMBOM|PACOCA|PACOQUITA|CHOCOLATE|TRIDENT|HALLS|GRANULADO|BISCOITO|AMENDOIM|TORRESMO|SNICKERS|SONHO DE VALSA|OURO BRANCO|ROLLY|M&MS|M\\&MS|PIRULITO|GOMA |GOMETS|TORTUGUITA/;
  if (regrasDoces.test(n)) return "Doces e Salgadinhos";

  const regrasOutros =
    /ISQUEIRO|NARGUILE|TABACO|SEDA |CIGARRO|PAPEL HIGIENICO|VENTILADOR|CARVAO|DESFAZEDOR|DIFERENCA|DESCARGA|CHURRASQUEIRA|CARNE SECA|PAO DE QUEIJO|QUALY/;
  if (regrasOutros.test(n)) return "Outros";

  // Padrão: é um depósito de bebidas, então o que não caiu em nenhuma regra acima
  // (cerveja, whisky, vodka, gin, cachaça, rum, tequila, licor, vinho, água,
  // refrigerante, energético, chopp, coquetéis etc.) vira "Destilados".
  return "Destilados";
}
