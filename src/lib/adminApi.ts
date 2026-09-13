interface ClienteAdmin {
  id: string;
  numero: number;
  nome: string;
  telefone: string;
  produto: string | null;
  criado_em: string;
  total_pedidos: number;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/admin${path}`, {
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

export function login(senha: string) {
  return api<{ ok: true }>("/login", {
    method: "POST",
    body: JSON.stringify({ senha }),
  });
}

export function logout() {
  return api<{ ok: true }>("/logout", { method: "POST" });
}

export function listarClientes() {
  return api<{ clientes: ClienteAdmin[] }>("/clientes");
}

export function esqueciSenha() {
  return api<{ ok: true }>("/esqueci-senha", { method: "POST" });
}

export function redefinirSenha(codigo: string, novaSenha: string) {
  return api<{ ok: true }>("/redefinir-senha", {
    method: "POST",
    body: JSON.stringify({ codigo, novaSenha }),
  });
}

interface PedidoAdmin {
  id: string;
  total: number;
  status: string;
  origem: string;
  pix_copia_cola: string | null;
  criado_em: string;
  confirmado_em: string | null;
  clientes: { nome: string; telefone: string } | null;
}

export function listarPedidos() {
  return api<{ pedidos: PedidoAdmin[] }>("/pedidos");
}

export function confirmarPagamento(pedidoId: string) {
  return api<{ ok: true }>(`/pedidos/${pedidoId}/confirmar-pagamento`, { method: "POST" });
}

export type { ClienteAdmin, PedidoAdmin };
