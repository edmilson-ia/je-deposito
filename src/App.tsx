import { Routes, Route } from "react-router-dom";
import AppHeader from "./components/AppHeader";
import AppFooter from "./components/AppFooter";
import CartSheet from "./components/CartSheet";
import FloatingWhatsApp from "./components/FloatingWhatsApp";
import Index from "./routes/Index";
import Catalogo from "./routes/Catalogo";
import Empresa from "./routes/Empresa";
import Contato from "./routes/Contato";
import AdminLogin from "./routes/admin/AdminLogin";
import AdminHome from "./routes/admin/AdminHome";
import AdminClientes from "./routes/admin/AdminClientes";
import AdminPedidos from "./routes/admin/AdminPedidos";
import AdminEsqueciSenha from "./routes/admin/AdminEsqueciSenha";
import AdminRedefinirSenha from "./routes/admin/AdminRedefinirSenha";
import PrecosLogin from "./routes/precos/PrecosLogin";
import PrecosPainel from "./routes/precos/PrecosPainel";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminHome />} />
        <Route path="/admin/esqueci-senha" element={<AdminEsqueciSenha />} />
        <Route path="/admin/redefinir-senha" element={<AdminRedefinirSenha />} />
        <Route path="/admin/clientes" element={<AdminClientes />} />
        <Route path="/admin/pedidos" element={<AdminPedidos />} />
        <Route path="/precos/login" element={<PrecosLogin />} />
        <Route path="/precos" element={<PrecosPainel />} />
        <Route
          path="*"
          element={
            <>
              <AppHeader />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/catalogo" element={<Catalogo />} />
                  <Route path="/empresa" element={<Empresa />} />
                  <Route path="/contato" element={<Contato />} />
                </Routes>
              </main>
              <AppFooter />
              <CartSheet />
              <FloatingWhatsApp />
            </>
          }
        />
      </Routes>
    </div>
  );
}
