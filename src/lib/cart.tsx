import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ItemCarrinho, Produto } from "@/data/types";

const STORAGE_KEY = "je_carrinho_v1";

interface CartContextValue {
  itens: ItemCarrinho[];
  aberto: boolean;
  abrirCarrinho: () => void;
  fecharCarrinho: () => void;
  adicionar: (produto: Produto, quantidade?: number) => void;
  remover: (produtoId: string) => void;
  atualizarQuantidade: (produtoId: string, quantidade: number) => void;
  limpar: () => void;
  total: number;
  quantidadeTotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as ItemCarrinho[]) : [];
    } catch {
      return [];
    }
  });
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(itens));
    } catch {
      // localStorage indisponível (modo privado etc.) — carrinho segue só em memória
    }
  }, [itens]);

  function adicionar(produto: Produto, quantidade = 1) {
    setItens((atual) => {
      const existente = atual.find((i) => i.produto.id === produto.id);
      if (existente) {
        return atual.map((i) =>
          i.produto.id === produto.id ? { ...i, quantidade: i.quantidade + quantidade } : i,
        );
      }
      return [...atual, { produto, quantidade }];
    });
    setAberto(true);
  }

  function remover(produtoId: string) {
    setItens((atual) => atual.filter((i) => i.produto.id !== produtoId));
  }

  function atualizarQuantidade(produtoId: string, quantidade: number) {
    if (quantidade <= 0) {
      remover(produtoId);
      return;
    }
    setItens((atual) =>
      atual.map((i) => (i.produto.id === produtoId ? { ...i, quantidade } : i)),
    );
  }

  function limpar() {
    setItens([]);
  }

  const total = useMemo(
    () => itens.reduce((soma, i) => soma + i.produto.preco * i.quantidade, 0),
    [itens],
  );
  const quantidadeTotal = useMemo(
    () => itens.reduce((soma, i) => soma + i.quantidade, 0),
    [itens],
  );

  return (
    <CartContext.Provider
      value={{
        itens,
        aberto,
        abrirCarrinho: () => setAberto(true),
        fecharCarrinho: () => setAberto(false),
        adicionar,
        remover,
        atualizarQuantidade,
        limpar,
        total,
        quantidadeTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa estar dentro de <CartProvider>");
  return ctx;
}
