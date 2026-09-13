import "dotenv/config";

function obrigatoria(nome: string): string {
  const valor = process.env[nome];
  if (!valor) {
    throw new Error(`Variável de ambiente ausente: ${nome}. Confira o arquivo .env (veja .env.example).`);
  }
  return valor;
}

export const env = {
  supabaseUrl: obrigatoria("SUPABASE_URL"),
  supabaseServiceRoleKey: obrigatoria("SUPABASE_SERVICE_ROLE_KEY"),
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  adminRecoveryEmail: process.env.ADMIN_RECOVERY_EMAIL ?? "",
  sessionSecret: process.env.SESSION_SECRET ?? "troque-este-segredo-em-producao",
  precosUsuario: process.env.PRECOS_USUARIO ?? "",
  precosSenha: process.env.PRECOS_SENHA ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  resendFromEmail: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
  avisaApiUrl: process.env.AVISA_API_URL ?? "",
  avisaApiKey: process.env.AVISA_API_KEY ?? "",
  pixKeyType: process.env.PIX_KEY_TYPE ?? "telefone",
  pixKeyValue: process.env.PIX_KEY_VALUE ?? "",
  pixReceiverName: process.env.PIX_RECEIVER_NAME ?? "J.E Alimentos e Destilados",
  pixReceiverCity: process.env.PIX_RECEIVER_CITY ?? "RIO DE JANEIRO",
  n8nWebhookSecret: process.env.N8N_WEBHOOK_SECRET ?? "",
  n8nConfirmacaoWebhookUrl: process.env.N8N_CONFIRMACAO_WEBHOOK_URL ?? "",
  port: Number(process.env.PORT ?? 3001),
  isProd: process.env.NODE_ENV === "production",
};
