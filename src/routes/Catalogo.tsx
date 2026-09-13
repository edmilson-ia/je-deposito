import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { listarProdutos } from "@/lib/api";
import type { Produto } from "@/data/types";
import { ORDEM_CATEGORIAS } from "@/data/categorias";

export default function Catalogo() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<string>("Todas");

  useEffect(() => {
    function buscar(mostrarCarregando: boolean) {
      if (mostrarCarregando) setCarregando(true);
      listarProdutos()
        .then((res) => {
          setProdutos(res.produtos);
          setErro(null);
        })
        .catch((e) => setErro((e as Error).message))
        .finally(() => setCarregando(false));
    }

    buscar(true);
    // Atualiza os preços/estoque sozinho a cada 30s (sem precisar recarregar a página),
    // já que o painel de preços pode alterar valores a qualquer momento.
    const intervalo = setInterval(() => buscar(false), 30000);
    return () => clearInterval(intervalo);
  }, []);

  const categorias = useMemo(() => {
    const presentes = new Set(produtos.map((p) => p.categoria ?? "Outros"));
    const emOrdem = ORDEM_CATEGORIAS.filter((c) => presentes.has(c));
    const extras = [...presentes].filter((c) => !(ORDEM_CATEGORIAS as readonly string[]).includes(c));
    return ["Todas", ...emOrdem, ...extras.sort()];
  }, [produtos]);

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((p) => {
      const bateCategoria = categoria === "Todas" || (p.categoria ?? "Outros") === categoria;
      const bateBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
      return bateCategoria && bateBusca;
    });
  }, [produtos, busca, categoria]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 font-display text-2xl text-dourado">Catálogo</h1>

      <div className="relative mb-4 w-full md:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
        <input
          className="input pl-9"
          placeholder="Buscar produto..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {categorias.map((c) => (
          <button
            key={c}
            onClick={() => setCategoria(c)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              categoria === c
                ? "border-dourado bg-dourado text-preto"
                : "border-white/15 text-neutral-300 hover:border-dourado/50 hover:text-dourado"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {carregando && <p className="text-neutral-400">Carregando produtos...</p>}
      {erro && <p className="text-red-400">{erro}</p>}
      {!carregando && !erro && produtosFiltrados.length === 0 && (
        <p className="text-neutral-400">Nenhum produto encontrado.</p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {produtosFiltrados.map((produto) => (
          <ProductCard key={produto.id} produto={produto} />
        ))}
      </div>
    </div>
  );
}
