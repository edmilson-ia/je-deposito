import type { Produto } from "@/data/types";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.erro ?? "Ocorreu um erro inesperado. Tente novamente.");
  }
  return data as T;
}

export function listarProdutos() {
  return api<{ produtos: Produto[] }>("/produtos");
}

export function identificarCliente(telefone: string) {
  return api<{ existe: boolean; nome?: string }>("/clientes/identificar", {
    method: "POST",
    body: JSON.stringify({ telefone }),
  });
}

export function cadastrarCliente(nome: string, telefone: string) {
  return api<{ id: string; nome: string; telefone: string }>("/clientes", {
    method: "POST",
    body: JSON.stringify({ nome, telefone }),
  });
}

export function criarPedido(payload: {
  telefone: string;
  itens: { produto_id: string; quantidade: number }[];
}) {
  return api<{
    id: string;
    total: number;
    pix_copia_cola: string;
    pix_chave: string;
  }>("/pedidos", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
