export interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  preco: number;
  unidade: string | null;
  estoque: number;
  imagem_url: string | null;
  ativo: boolean;
}

export interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
}

export interface PedidoResumo {
  id: string;
  total: number;
  status: string;
  pix_copia_cola?: string | null;
}
