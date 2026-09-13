/** Normaliza para o formato usado no WhatsApp: DDI 55 + DDD + número, só dígitos. */
export function normalizarTelefone(telefone: string): string | null {
  let digitos = telefone.replace(/\D/g, "");
  if (digitos.length === 10 || digitos.length === 11) {
    digitos = `55${digitos}`;
  }
  if (digitos.length !== 12 && digitos.length !== 13) {
    return null;
  }
  if (!digitos.startsWith("55")) {
    return null;
  }
  return digitos;
}
