import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginPrecos } from "@/lib/precosApi";
import { normalizarTelefone } from "@/lib/format";

export default function PrecosLogin() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      await loginPrecos(usuario, senha);
      navigate("/precos");
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCarregando(false);
    }
  }

  function esqueciSenha() {
    const normalizado = normalizarTelefone(usuario);
    if (!normalizado) {
      setErro("Digite seu telefone no campo de usuário antes de clicar em \"Esqueci a senha\".");
      return;
    }
    const mensagem = encodeURIComponent("Esqueci a senha do painel de preços, preciso alterar usuário/senha.");
    window.location.href = `https://wa.me/${normalizado}?text=${mensagem}`;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-preto px-4">
      <form onSubmit={enviar} className="card w-full max-w-sm p-8">
        <img
          src="/logo.jpg"
          alt="J.E Alimentos e Destilados"
          className="mx-auto mb-4 h-16 w-16 rounded-full object-cover"
        />
        <h1 className="mb-6 text-center font-display text-xl text-dourado">Painel de Preços</h1>

        <label className="mb-1 block text-sm text-neutral-400">Usuário</label>
        <p className="mb-1 text-xs text-neutral-500">digite seu telefone</p>
        <input
          className="input mb-4"
          inputMode="numeric"
          placeholder="(21) 98765-4321"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          autoFocus
        />

        <label className="mb-1 block text-sm text-neutral-400">Senha</label>
        <input
          type="password"
          className="input mb-4"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />

        {erro && <p className="mb-4 text-sm text-red-400">{erro}</p>}

        <button className="btn-dourado w-full" disabled={carregando}>
          {carregando ? "Entrando..." : "Entrar"}
        </button>

        <button
          type="button"
          onClick={esqueciSenha}
          className="mt-4 block w-full text-center text-sm text-neutral-400 hover:text-dourado"
        >
          Esqueci a senha
        </button>
      </form>
    </div>
  );
}
