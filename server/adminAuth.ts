import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { supabaseAdmin } from "./supabaseServer.js";
import { env } from "./env.js";

interface AdminConfig {
  id: number;
  senha_hash: string;
  codigo_recuperacao_hash: string | null;
  codigo_recuperacao_expira: string | null;
}

async function obterConfig(): Promise<AdminConfig> {
  const { data, error } = await supabaseAdmin
    .from("admin_config")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) throw new Error(`Falha ao ler configuração do admin: ${error.message}`);

  if (data) return data as AdminConfig;

  if (!env.adminPassword) {
    throw new Error(
      "ADMIN_PASSWORD não configurado no .env e ainda não existe senha salva no banco.",
    );
  }

  const senhaHash = await bcrypt.hash(env.adminPassword, 10);
  const { data: criado, error: erroCriar } = await supabaseAdmin
    .from("admin_config")
    .insert({ id: 1, senha_hash: senhaHash })
    .select("*")
    .single();

  if (erroCriar) throw new Error(`Falha ao inicializar configuração do admin: ${erroCriar.message}`);
  return criado as AdminConfig;
}

export async function verificarSenha(senha: string): Promise<boolean> {
  const config = await obterConfig();
  return bcrypt.compare(senha, config.senha_hash);
}

export async function definirNovaSenha(novaSenha: string) {
  const senhaHash = await bcrypt.hash(novaSenha, 10);
  const { error } = await supabaseAdmin
    .from("admin_config")
    .update({
      senha_hash: senhaHash,
      codigo_recuperacao_hash: null,
      codigo_recuperacao_expira: null,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) throw new Error(`Falha ao salvar nova senha: ${error.message}`);
}

export async function gerarCodigoRecuperacao(): Promise<string> {
  await obterConfig(); // garante que a linha exista
  const codigo = crypto.randomInt(100000, 999999).toString();
  const codigoHash = await bcrypt.hash(codigo, 10);
  const expira = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  const { error } = await supabaseAdmin
    .from("admin_config")
    .update({ codigo_recuperacao_hash: codigoHash, codigo_recuperacao_expira: expira })
    .eq("id", 1);
  if (error) throw new Error(`Falha ao gerar código de recuperação: ${error.message}`);

  return codigo;
}

export async function verificarCodigoRecuperacao(
  codigo: string,
): Promise<{ ok: boolean; motivo?: string }> {
  const config = await obterConfig();
  if (!config.codigo_recuperacao_hash || !config.codigo_recuperacao_expira) {
    return { ok: false, motivo: "Nenhum código de recuperação foi solicitado." };
  }
  if (new Date(config.codigo_recuperacao_expira).getTime() < Date.now()) {
    return { ok: false, motivo: "Código expirado. Solicite um novo." };
  }
  const ok = await bcrypt.compare(codigo, config.codigo_recuperacao_hash);
  return ok ? { ok: true } : { ok: false, motivo: "Código inválido." };
}
