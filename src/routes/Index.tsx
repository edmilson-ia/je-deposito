import { Link } from "react-router-dom";
import { Beer, Truck, MessageCircle, Sparkles } from "lucide-react";

const linkGrupoPromocoes = import.meta.env.VITE_WHATSAPP_GRUPO_PROMOCOES ?? "";

export default function Index() {
  return (
    <div>
      <section className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center">
        <img src="/logo.jpg" alt="J.E Alimentos e Destilados" className="h-28 w-28 rounded-full object-cover shadow-gold" />
        <h1 className="font-display text-3xl font-bold text-dourado md:text-5xl">
          J.E Alimentos e Destilados
        </h1>
        <p className="max-w-xl text-neutral-300">
          Cervejas, refrigerantes, energéticos e whiskies selecionados, com pedido rápido
          pelo site ou direto no WhatsApp.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to="/catalogo" className="btn-dourado">
            Ver catálogo
          </Link>
          <Link to="/contato" className="btn-outline">
            Falar no WhatsApp
          </Link>
          {linkGrupoPromocoes && (
            <a href={linkGrupoPromocoes} target="_blank" rel="noreferrer" className="relative inline-flex">
              <span className="absolute inset-0 rounded-lg bg-red-500 opacity-70 animate-ping" />
              <span className="relative inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-orange-500 px-5 py-2.5 font-bold text-white shadow-lg transition hover:scale-105">
                <Sparkles size={18} /> Promoções
              </span>
            </a>
          )}
        </div>
        <p className="text-xs text-neutral-500">Formas de pagamento: Avista, Pix e Cartão</p>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-16 md:grid-cols-3">
        <Link to="/catalogo" className="card flex flex-col items-center gap-2 p-6 text-center transition hover:border-dourado/40">
          <Beer className="text-dourado" size={28} />
          <h3 className="font-medium">Catálogo completo</h3>
          <p className="text-sm text-neutral-400">
            Cervejas, energéticos, refrigerantes e whiskies em um só lugar.
          </p>
        </Link>
        <Link to="/catalogo" className="card flex flex-col items-center gap-2 p-6 text-center transition hover:border-dourado/40">
          <MessageCircle className="text-dourado" size={28} />
          <h3 className="font-medium">Pedido fácil</h3>
          <p className="text-sm text-neutral-400">
            Monte seu pedido no site e finalize com Pix, sem complicação.
          </p>
        </Link>
        <Link to="/contato" className="card flex flex-col items-center gap-2 p-6 text-center transition hover:border-dourado/40">
          <Truck className="text-dourado" size={28} />
          <h3 className="font-medium">Entrega combinada</h3>
          <p className="text-sm text-neutral-400">Falamos com você no WhatsApp para combinar a entrega.</p>
        </Link>
      </section>
    </div>
  );
}
