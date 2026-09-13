import { useState } from "react";
import { X, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatarPreco, normalizarTelefone } from "@/lib/format";
import { obterClienteLocal, salvarClienteLocal } from "@/lib/clienteLocal";
import { identificarCliente, cadastrarCliente, criarPedido } from "@/lib/api";

const numeroWhatsapp = import.meta.env.VITE_WHATSAPP_NUMERO ?? "";

type Etapa = "carrinho" | "cadastro" | "enviando";

export default function CartSheet() {
  const { itens, aberto, fecharCarrinho, remover, atualizarQuantidade, total, limpar } = useCart();
  const [etapa, setEtapa] = useState<Etapa>("carrinho");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  function fecharTudo() {
    fecharCarrinho();
    setTimeout(() => {
      setEtapa("carrinho");
      setErro(null);
    }, 300);
  }

  function irParaCadastroOuFinalizar() {
    setErro(null);
    const clienteLocal = obterClienteLocal();
    if (clienteLocal) {
      finalizarPedido(clienteLocal.telefone);
      return;
    }
    setEtapa("cadastro");
  }

  async function confirmarCadastroEFinalizar() {
    setErro(null);
    const normalizado = normalizarTelefone(telefone);
    if (!normalizado) {
      setErro("Informe um telefone válido com DDD, ex: (21) 98765-4321.");
      return;
    }
    if (nome.trim().length < 2) {
      setErro("Informe seu nome completo.");
      return;
    }
    setEtapa("enviando");
    try {
      const identificacao = await identificarCliente(normalizado);
      const nomeFinal = identificacao.existe ? (identificacao.nome ?? nome.trim()) : nome.trim();
      if (!identificacao.existe) {
        await cadastrarCliente(nome.trim(), normalizado);
      }
      salvarClienteLocal({ id: "", nome: nomeFinal, telefone: normalizado });
      await finalizarPedido(normalizado);
    } catch (e) {
      setErro((e as Error).message);
      setEtapa("cadastro");
    }
  }

  async function finalizarPedido(telefoneCliente: string) {
    setEtapa("enviando");
    setErro(null);
    try {
      const resultado = await criarPedido({
        telefone: telefoneCliente,
        itens: itens.map((i) => ({ produto_id: i.produto.id, quantidade: i.quantidade })),
      });

      const linhasItens = itens
        .map((i) => `• ${i.quantidade}x ${i.produto.nome} — ${formatarPreco(i.produto.preco * i.quantidade)}`)
        .join("\n");
      const mensagem =
        `Olá! Acabei de fazer o pedido #${resultado.id.slice(0, 8)} pelo site:\n\n` +
        `${linhasItens}\n\n` +
        `Total: ${formatarPreco(resultado.total)}\n\n` +
        `Pix Copia e Cola:\n${resultado.pix_copia_cola}\n\n` +
        `Vou realizar o pagamento e envio o comprovante por aqui.`;

      limpar();
      fecharTudo();

      if (numeroWhatsapp) {
        window.location.href = `https://wa.me/${numeroWhatsapp}?text=${encodeURIComponent(mensagem)}`;
      }
    } catch (e) {
      setErro((e as Error).message);
      setEtapa("carrinho");
    }
  }

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/60" onClick={fecharTudo}>
      <div
        className="flex h-full w-full max-w-md flex-col bg-preto-soft shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="font-display text-lg text-dourado">
            {etapa === "carrinho" && "Seu carrinho"}
            {etapa === "cadastro" && "Só falta o seu contato"}
            {etapa === "enviando" && "Abrindo o WhatsApp..."}
          </h2>
          <button onClick={fecharTudo} aria-label="Fechar" className="text-neutral-400 hover:text-dourado">
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {etapa === "carrinho" && (
            <>
              {itens.length === 0 ? (
                <p className="text-center text-neutral-400">Seu carrinho está vazio.</p>
              ) : (
                <ul className="flex flex-col gap-4">
                  {itens.map(({ produto, quantidade }) => (
                    <li key={produto.id} className="flex items-center gap-3">
                      <img
                        src={produto.imagem_url ?? undefined}
                        alt={produto.nome}
                        className="h-14 w-14 rounded-md bg-black/40 object-contain p-1"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{produto.nome}</p>
                        <p className="text-xs text-neutral-400">{formatarPreco(produto.preco)}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            value={quantidade}
                            onChange={(e) => atualizarQuantidade(produto.id, Number(e.target.value))}
                            className="w-14 rounded border border-white/15 bg-preto px-2 py-0.5 text-sm"
                          />
                          <button
                            onClick={() => remover(produto.id)}
                            className="text-neutral-500 hover:text-red-400"
                            aria-label="Remover item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-dourado">
                        {formatarPreco(produto.preco * quantidade)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {etapa === "cadastro" && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-neutral-400">
                Usamos seu nome e telefone (WhatsApp) para identificar seu pedido e falar com
                você sobre a entrega.
              </p>
              <div>
                <label className="mb-1 block text-sm text-neutral-400">Nome completo</label>
                <input
                  className="input"
                  placeholder="Seu nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-neutral-400">Telefone (WhatsApp)</label>
                <input
                  className="input"
                  placeholder="(21) 98765-4321"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && confirmarCadastroEFinalizar()}
                />
              </div>
              {erro && <p className="text-sm text-red-400">{erro}</p>}
              <button className="btn-dourado" onClick={confirmarCadastroEFinalizar}>
                Finalizar pelo WhatsApp
              </button>
            </div>
          )}

          {etapa === "enviando" && (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-dourado border-t-transparent" />
            </div>
          )}
        </div>

        {etapa === "carrinho" && itens.length > 0 && (
          <div className="border-t border-white/10 p-5">
            {erro && <p className="mb-2 text-sm text-red-400">{erro}</p>}
            <div className="mb-3 flex items-center justify-between text-lg">
              <span>Total</span>
              <span className="font-semibold text-dourado">{formatarPreco(total)}</span>
            </div>
            <button className="btn-dourado w-full" onClick={irParaCadastroOuFinalizar}>
              Fechar pedido
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
