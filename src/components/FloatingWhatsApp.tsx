import { MessageCircle } from "lucide-react";

const numeroWhatsapp = import.meta.env.VITE_WHATSAPP_NUMERO ?? "";

export default function FloatingWhatsApp() {
  if (!numeroWhatsapp) return null;

  const link = `https://wa.me/${numeroWhatsapp}?text=${encodeURIComponent(
    "Olá! Vim do site e gostaria de fazer um pedido.",
  )}`;

  return (
    <a
      href={link}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 hover:shadow-xl"
    >
      <MessageCircle size={28} />
    </a>
  );
}
