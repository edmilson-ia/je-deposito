import { Link, useNavigate } from "react-router-dom";
import { ClipboardCheck, Users, LogOut } from "lucide-react";
import { logout } from "@/lib/adminApi";

export default function AdminHome() {
  const navigate = useNavigate();

  async function sair() {
    await logout();
    navigate("/admin/login");
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-preto px-4 py-10">
      <img src="/logo.jpg" alt="J.E Alimentos e Destilados" className="mb-4 h-16 w-16 rounded-full" />
      <h1 className="mb-8 text-center font-display text-xl text-dourado">Painel Administrativo</h1>

      <div className="flex w-full max-w-sm flex-col gap-4">
        <Link
          to="/admin/pedidos"
          className="card flex items-center gap-4 p-5 transition hover:border-dourado/40"
        >
          <ClipboardCheck className="shrink-0 text-dourado" size={32} />
          <div>
            <p className="font-semibold">Pedidos</p>
            <p className="text-sm text-neutral-400">Confirmar pagamentos recebidos via Pix</p>
          </div>
        </Link>

        <Link
          to="/admin/clientes"
          className="card flex items-center gap-4 p-5 transition hover:border-dourado/40"
        >
          <Users className="shrink-0 text-dourado" size={32} />
          <div>
            <p className="font-semibold">Clientes</p>
            <p className="text-sm text-neutral-400">Ver cadastro e histórico de clientes</p>
          </div>
        </Link>
      </div>

      <button onClick={sair} className="btn-outline mt-8">
        <LogOut size={16} /> Sair
      </button>
    </div>
  );
}
