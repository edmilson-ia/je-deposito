import { NavLink, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { logout } from "@/lib/adminApi";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-1.5 text-sm font-medium rounded-md transition ${
    isActive ? "bg-dourado/15 text-dourado" : "text-neutral-400 hover:text-dourado"
  }`;

export default function AdminNav() {
  const navigate = useNavigate();

  async function sair() {
    await logout();
    navigate("/admin/login");
  }

  return (
    <div className="mb-6 flex items-center justify-between">
      <nav className="flex gap-1">
        <NavLink to="/admin" end className={linkClass}>
          Início
        </NavLink>
        <NavLink to="/admin/pedidos" className={linkClass}>
          Pedidos
        </NavLink>
        <NavLink to="/admin/clientes" className={linkClass}>
          Clientes
        </NavLink>
      </nav>
      <button onClick={sair} className="btn-outline">
        <LogOut size={16} /> Sair
      </button>
    </div>
  );
}
