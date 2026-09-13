import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { redefinirSenha } from "@/lib/adminApi";

export default function AdminRedefinirSenha() {
  const [codigo, setCodigo] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (novaSenha.length < 8) {
      setErro("A nova senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não conferem.");
      return;
    }
    setCarregando(true);
    try {
      await redefinirSenha(codigo, novaSenha);
      navigate("/admin/pedidos");
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-preto px-4">
      <form onSubmit={enviar} className="card w-full max-w-sm p-8">
        <h1 className="mb-2 font-display text-xl text-dourado">Definir nova senha</h1>
        <p className="mb-4 text-sm text-neutral-400">
          Digite o código temporário recebido por e-mail e escolha sua nova senha. O código só
          pode ser usado uma vez.
        </p>
        <label className="mb-1 block text-sm text-neutral-400">Código recebido por e-mail</label>
        <input className="input mb-3" value={codigo} onChange={(e) => setCodigo(e.target.value)} autoFocus />
        <label className="mb-1 block text-sm text-neutral-400">Nova senha</label>
        <input
          type="password"
          className="input mb-3"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
        />
        <label className="mb-1 block text-sm text-neutral-400">Confirmar nova senha</label>
        <input
          type="password"
          className="input mb-4"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
        />
        {erro && <p className="mb-4 text-sm text-red-400">{erro}</p>}
        <button className="btn-dourado w-full" disabled={carregando}>
          {carregando ? "Salvando..." : "Salvar nova senha"}
        </button>
      </form>
    </div>
  );
}
