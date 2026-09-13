import { useState } from "react";
import { Plus, Minus, ImageOff } from "lucide-react";
import type { Produto } from "@/data/types";
import { formatarPreco } from "@/lib/format";
import { useCart } from "@/lib/cart";

export default function ProductCard({ produto }: { produto: Produto }) {
  const { adicionar } = useCart();
  const [quantidade, setQuantidade] = useState(1);
  const [imagemFalhou, setImagemFalhou] = useState(false);
  const semEstoque = produto.estoque <= 0;

  return (
    <div className="card flex flex-col overflow-hidden transition hover:border-dourado/40">
      <div className="flex aspect-square items-center justify-center bg-black/40">
        {produto.imagem_url && !imagemFalhou ? (
          <img
            src={produto.imagem_url}
            alt={produto.nome}
            loading="lazy"
            className="h-full w-full object-contain p-3"
            onError={() => setImagemFalhou(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-neutral-600">
            <ImageOff size={32} />
            <span className="text-xs">Sem foto</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 min-h-10 font-medium text-neutral-100">{produto.nome}</h3>
        {produto.descricao && (
          <p className="line-clamp-2 text-xs text-neutral-400">{produto.descricao}</p>
        )}
        <p className="mt-auto text-lg font-semibold text-dourado">{formatarPreco(produto.preco)}</p>

        {semEstoque ? (
          <span className="rounded-md bg-white/5 px-3 py-2 text-center text-xs font-medium text-neutral-500">
            Indisponível no momento
          </span>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-center gap-1 rounded-lg border border-white/15">
              <button
                className="px-2.5 py-1.5 text-neutral-300 hover:text-dourado"
                onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                aria-label="Diminuir quantidade"
              >
                <Minus size={14} />
              </button>
              <span className="w-6 text-center text-sm">{quantidade}</span>
              <button
                className="px-2.5 py-1.5 text-neutral-300 hover:text-dourado"
                onClick={() => setQuantidade((q) => q + 1)}
                aria-label="Aumentar quantidade"
              >
                <Plus size={14} />
              </button>
            </div>
            <button
              className="btn-dourado w-full py-1.5 text-sm"
              onClick={() => {
                adicionar(produto, quantidade);
                setQuantidade(1);
              }}
            >
              Adicionar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
