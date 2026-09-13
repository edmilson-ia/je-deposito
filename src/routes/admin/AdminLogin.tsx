import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "@/lib/adminApi";

export default function AdminLogin() {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      await login(senha);
      navigate("/admin");
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-preto px-4">
      <form onSubmit={enviar} className="card w-full max-w-sm p-8">
        <img src="/logo.jpg" alt="J.E Alimentos e Destilados" className="mx-auto mb-4 h-16 w-16 rounded-full" />
        <h1 className="mb-6 text-center font-display text-xl text-dourado">Painel Administrativo</h1>
        <label className="mb-1 block text-sm text-neutral-400">Senha de acesso</label>
        <input
          type="password"
          className="input mb-4"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoFocus
        />
        {erro && <p className="mb-4 text-sm text-red-400">{erro}</p>}
        <button className="btn-dourado w-full" disabled={carregando}>
          {carregando ? "Entrando..." : "Entrar"}
        </button>
        <Link
          to="/admin/esqueci-senha"
          className="mt-4 block text-center text-sm text-neutral-400 hover:text-dourado"
        >
          Esqueci minha senha
        </Link>
      </form>
    </div>
  );
}
