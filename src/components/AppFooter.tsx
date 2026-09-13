export default function AppFooter() {
  return (
    <footer className="border-t border-white/10 bg-preto-soft py-8 text-sm text-neutral-400">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 text-center">
        <img src="/logo.jpg" alt="J.E Alimentos e Destilados" className="h-10 w-10 rounded-full object-cover" />
        <p className="font-display text-dourado">J.E Alimentos e Destilados</p>
        <p>Cervejas, refrigerantes, energéticos, whiskies e muito mais — no seu WhatsApp ou aqui no site.</p>
        <p className="text-neutral-500">© {new Date().getFullYear()} J.E Alimentos e Destilados. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
