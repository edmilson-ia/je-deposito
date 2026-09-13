import { Resend } from "resend";
import { env } from "./env.js";

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

export async function enviarCodigoRecuperacao(codigo: string) {
  if (!resend) {
    throw new Error("RESEND_API_KEY não configurada — não é possível enviar o e-mail de recuperação.");
  }
  if (!env.adminRecoveryEmail) {
    throw new Error("ADMIN_RECOVERY_EMAIL não configurado.");
  }

  await resend.emails.send({
    from: env.resendFromEmail,
    to: env.adminRecoveryEmail,
    subject: "Recuperação de senha — Painel J.E Alimentos e Destilados",
    html: `
      <div style="font-family: Arial, sans-serif; color: #151312;">
        <h2 style="color: #9c7d1a;">Recuperação de senha do painel</h2>
        <p>Foi solicitada a recuperação de senha do painel administrativo da <strong>J.E Alimentos e Destilados</strong>.</p>
        <p>Use o código temporário abaixo para acessar o painel. Você precisará definir uma nova senha em seguida.</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; background:#f4e9c9; padding: 12px 16px; display:inline-block; border-radius: 8px;">
          ${codigo}
        </p>
        <p>Este código expira em 30 minutos. Se você não solicitou essa recuperação, ignore este e-mail.</p>
      </div>
    `,
  });
}
