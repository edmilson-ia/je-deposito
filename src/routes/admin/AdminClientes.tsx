import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listarClientes, type ClienteAdmin } from "@/lib/adminApi";
import { formatarTelefoneExibicao, formatarDataHoraBR } from "@/lib/format";
import AdminNav from "@/components/AdminNav";

export default function AdminClientes() {
  const [clientes, setClientes] = useState<ClienteAdmin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    listarClientes()
      .then((res) => setClientes(res.clientes))
      .catch(() => navigate("/admin/login"))
      .finally(() => setCarregando(false));
  }, [navigate]);

  return (
    <div className="min-h-screen bg-preto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <AdminNav />
        <h1 className="mb-6 font-display text-2xl text-dourado">Clientes cadastrados</h1>

        {carregando && <p className="text-neutral-400">Carregando...</p>}
        {erro && <p className="text-red-400">{erro}</p>}

        {!carregando && clientes.length === 0 && (
          <p className="text-neutral-400">Nenhum cliente cadastrado ainda.</p>
        )}

        {!carregando && clientes.length > 0 && (
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-neutral-400">
                  <th className="px-4 py-3">Nº</th>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Telefone</th>
                  <th className="px-4 py-3">Último produto</th>
                  <th className="px-4 py-3">Cadastrado em</th>
                  <th className="px-4 py-3">Pedidos</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3 text-neutral-400">{c.numero}</td>
                    <td className="px-4 py-3">{c.nome}</td>
                    <td className="px-4 py-3">{formatarTelefoneExibicao(c.telefone)}</td>
                    <td className="px-4 py-3 text-neutral-300">{c.produto ?? "—"}</td>
                    <td className="px-4 py-3">{formatarDataHoraBR(c.criado_em)}</td>
                    <td className="px-4 py-3">{c.total_pedidos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
