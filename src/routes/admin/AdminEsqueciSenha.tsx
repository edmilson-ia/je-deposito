import { useState } from "react";
import { Link } from "react-router-dom";
import { esqueciSenha } from "@/lib/adminApi";

export default function AdminEsqueciSenha() {
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function enviar() {
    setErro(null);
    setCarregando(true);
    try {
      await esqueciSenha();
      setEnviado(true);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-preto px-4">
      <div className="card w-full max-w-sm p-8 text-center">
        <h1 className="mb-4 font-display text-xl text-dourado">Recuperar senha</h1>
        {enviado ? (
          <>
            <p className="mb-4 text-neutral-300">
              Enviamos um código temporário por e-mail. Use-o na tela de redefinição de senha.
            </p>
            <Link to="/admin/redefinir-senha" className="btn-dourado inline-flex w-full">
              Já tenho o código
            </Link>
          </>
        ) : (
          <>
            <p className="mb-4 text-neutral-400">
              Vamos enviar um código temporário de acesso por e-mail para o administrador cadastrado.
            </p>
            {erro && <p className="mb-4 text-sm text-red-400">{erro}</p>}
            <button className="btn-dourado w-full" onClick={enviar} disabled={carregando}>
              {carregando ? "Enviando..." : "Enviar código por e-mail"}
            </button>
          </>
        )}
        <Link to="/admin/login" className="mt-4 block text-sm text-neutral-500 hover:text-dourado">
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}
