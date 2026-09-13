import { MessageCircle } from "lucide-react";

const numeroWhatsapp = import.meta.env.VITE_WHATSAPP_NUMERO ?? "";

export default function Contato() {
  const link = numeroWhatsapp
    ? `https://wa.me/${numeroWhatsapp}?text=${encodeURIComponent("Olá! Vim do site e gostaria de fazer um pedido.")}`
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-center">
      <h1 className="mb-4 font-display text-2xl text-dourado">Fale com a gente</h1>
      <p className="mb-6 text-neutral-300">
        Prefere pedir pelo WhatsApp? É só chamar que a gente monta seu pedido por lá também.
      </p>
      {link ? (
        <a href={link} target="_blank" rel="noreferrer" className="btn-dourado inline-flex">
          <MessageCircle size={18} /> Chamar no WhatsApp
        </a>
      ) : (
        <p className="text-neutral-500">Número de WhatsApp ainda não configurado.</p>
      )}
    </div>
  );
}
