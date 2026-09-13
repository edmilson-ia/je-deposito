interface ProdutoPreco {
  id: string;
  nome: string;
  categoria: string | null;
  preco: number;
  ativo: boolean;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/precos${path}`, {
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

export function loginPrecos(usuario: string, senha: string) {
  return api<{ ok: true }>("/login", {
    method: "POST",
    body: JSON.stringify({ usuario, senha }),
  });
}

export function logoutPrecos() {
  return api<{ ok: true }>("/logout", { method: "POST" });
}

export function listarProdutosPrecos() {
  return api<{ produtos: ProdutoPreco[] }>("/produtos");
}

export function atualizarPreco(produtoId: string, preco: number) {
  return api<{ ok: true }>(`/produtos/${produtoId}`, {
    method: "PUT",
    body: JSON.stringify({ preco }),
  });
}

export type { ProdutoPreco };
