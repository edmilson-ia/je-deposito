const STORAGE_KEY = "je_cliente_v1";

export interface ClienteLocal {
  id: string;
  nome: string;
  telefone: string;
}

export function obterClienteLocal(): ClienteLocal | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ClienteLocal) : null;
  } catch {
    return null;
  }
}

export function salvarClienteLocal(cliente: ClienteLocal) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cliente));
  } catch {
    // sem localStorage disponível — o cliente só não terá o dispositivo lembrado
  }
}

export function limparClienteLocal() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}
