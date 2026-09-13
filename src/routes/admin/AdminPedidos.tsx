import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { listarPedidos, confirmarPagamento, type PedidoAdmin } from "@/lib/adminApi";
import { formatarPreco, formatarTelefoneExibicao, formatarDataHoraBR } from "@/lib/format";
import AdminNav from "@/components/AdminNav";

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState<PedidoAdmin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const navigate = useNavigate();

  function carregar() {
    setCarregando(true);
    listarPedidos()
      .then((res) => setPedidos(res.pedidos))
      .catch(() => navigate("/admin/login"))
      .finally(() => setCarregando(false));
  }

  useEffect(carregar, [navigate]);

  async function confirmar(id: string) {
    setErro(null);
    setConfirmando(id);
    try {
      await confirmarPagamento(id);
      carregar();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setConfirmando(null);
    }
  }

  return (
    <div className="min-h-screen bg-preto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <AdminNav />
        <h1 className="mb-2 font-display text-2xl text-dourado">Pedidos aguardando pagamento</h1>
        <p className="mb-6 text-sm text-neutral-400">
          Confira o comprovante Pix recebido no WhatsApp e confirme aqui — isso dá baixa
          automática no estoque e (se configurado) avisa o cliente pelo WhatsApp.
        </p>

        {erro && <p className="mb-4 text-sm text-red-400">{erro}</p>}
        {carregando && <p className="text-neutral-400">Carregando...</p>}
        {!carregando && pedidos.length === 0 && (
          <p className="text-neutral-400">Nenhum pedido aguardando pagamento no momento.</p>
        )}

        <div className="flex flex-col gap-3">
          {pedidos.map((p) => (
            <div key={p.id} className="card flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">
                  #{p.id.slice(0, 8)} — {p.clientes?.nome ?? "Cliente"}
                </p>
                <p className="text-sm text-neutral-400">
                  {p.clientes ? formatarTelefoneExibicao(p.clientes.telefone) : ""} ·{" "}
                  {formatarDataHoraBR(p.criado_em)}
                </p>
                <p className="text-sm font-semibold text-dourado">{formatarPreco(p.total)}</p>
              </div>
              <button
                className="btn-dourado"
                disabled={confirmando === p.id}
                onClick={() => confirmar(p.id)}
              >
                <CheckCircle2 size={16} />
                {confirmando === p.id ? "Confirmando..." : "Confirmar pagamento"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
