import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, LogOut, Check } from "lucide-react";
import { listarProdutosPrecos, atualizarPreco, logoutPrecos, type ProdutoPreco } from "@/lib/precosApi";

export default function PrecosPainel() {
  const [produtos, setProdutos] = useState<ProdutoPreco[]>([]);
  const [precosEditados, setPrecosEditados] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState<string | null>(null);
  const [salvo, setSalvo] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const navigate = useNavigate();

  function carregar() {
    listarProdutosPrecos()
      .then((res) => setProdutos(res.produtos))
      .catch(() => navigate("/precos/login"))
      .finally(() => setCarregando(false));
  }

  useEffect(carregar, [navigate]);

  const produtosFiltrados = useMemo(
    () => produtos.filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase())),
    [produtos, busca],
  );

  async function salvarPreco(produto: ProdutoPreco) {
    const valorDigitado = precosEditados[produto.id];
    const novoPreco = Number(valorDigitado?.replace(",", "."));
    if (!Number.isFinite(novoPreco) || novoPreco < 0) {
      setErro(`Preço inválido para ${produto.nome}.`);
      return;
    }
    setErro(null);
    setSalvando(produto.id);
    try {
      await atualizarPreco(produto.id, novoPreco);
      setProdutos((atual) => atual.map((p) => (p.id === produto.id ? { ...p, preco: novoPreco } : p)));
      setPrecosEditados((atual) => {
        const { [produto.id]: _removido, ...resto } = atual;
        return resto;
      });
      setSalvo(produto.id);
      setTimeout(() => setSalvo(null), 1500);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setSalvando(null);
    }
  }

  async function sair() {
    await logoutPrecos();
    navigate("/precos/login");
  }

  return (
    <div className="min-h-screen bg-preto px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-display text-xl text-dourado">Painel de Preços</h1>
          <button onClick={sair} className="btn-outline px-3 py-1.5 text-sm">
            <LogOut size={16} /> Sair
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
          <input
            className="input pl-9"
            placeholder="Buscar produto..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {erro && <p className="mb-3 text-sm text-red-400">{erro}</p>}
        {carregando && <p className="text-neutral-400">Carregando...</p>}

        <div className="flex flex-col gap-2">
          {produtosFiltrados.map((produto) => {
            const valorEditado = precosEditados[produto.id];
            const alterado = valorEditado !== undefined;
            return (
              <div key={produto.id} className="card flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{produto.nome}</p>
                  <p className="text-xs text-neutral-500">{produto.categoria ?? "—"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500">R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="input w-20 py-1.5 text-right"
                    value={valorEditado ?? produto.preco.toFixed(2).replace(".", ",")}
                    onChange={(e) =>
                      setPrecosEditados((atual) => ({ ...atual, [produto.id]: e.target.value }))
                    }
                  />
                  <button
                    onClick={() => salvarPreco(produto)}
                    disabled={!alterado || salvando === produto.id}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
                      salvo === produto.id
                        ? "bg-green-600 text-white"
                        : alterado
                          ? "bg-dourado text-preto hover:bg-dourado-light"
                          : "bg-white/5 text-neutral-600"
                    }`}
                    aria-label="Salvar novo preço"
                  >
                    <Check size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {!carregando && produtosFiltrados.length === 0 && (
          <p className="mt-6 text-center text-neutral-400">Nenhum produto encontrado.</p>
        )}
      </div>
    </div>
  );
}
