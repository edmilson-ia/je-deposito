import { Link, NavLink } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 text-sm font-medium transition hover:text-dourado ${
    isActive ? "text-dourado" : "text-neutral-300"
  }`;

export default function AppHeader() {
  const { abrirCarrinho, quantidadeTotal } = useCart();

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-preto/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.jpg" alt="J.E Alimentos e Destilados" className="h-11 w-11 rounded-full object-cover" />
          <span className="font-display text-lg font-semibold text-dourado">
            J.E Alimentos<span className="text-neutral-200"> &amp; Destilados</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/" end className={linkClass}>
            Início
          </NavLink>
          <NavLink to="/catalogo" className={linkClass}>
            Catálogo
          </NavLink>
          <NavLink to="/empresa" className={linkClass}>
            Empresa
          </NavLink>
          <NavLink to="/contato" className={linkClass}>
            Contato
          </NavLink>
        </nav>

        <button
          onClick={abrirCarrinho}
          className="relative flex items-center gap-2 rounded-lg border border-dourado/50 px-3 py-2 text-dourado transition hover:bg-dourado/10"
          aria-label="Abrir carrinho"
        >
          <ShoppingCart size={20} />
          {quantidadeTotal > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-dourado px-1 text-xs font-bold text-preto">
              {quantidadeTotal}
            </span>
          )}
        </button>
      </div>
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-white/5 px-4 py-1.5 md:hidden">
        <NavLink to="/" end className={linkClass}>
          Início
        </NavLink>
        <NavLink to="/catalogo" className={linkClass}>
          Catálogo
        </NavLink>
        <NavLink to="/empresa" className={linkClass}>
          Empresa
        </NavLink>
        <NavLink to="/contato" className={linkClass}>
          Contato
        </NavLink>
      </nav>
    </header>
  );
}
