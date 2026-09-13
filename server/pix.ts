/**
 * Gerador de payload Pix estático (BR Code / "Copia e Cola"), formato EMV/BR Code do Bacen.
 * Não depende de nenhum gateway/PSP — funciona com qualquer chave Pix (aqui, telefone).
 * Confirmação de pagamento é MANUAL (o atendente confirma no painel admin), já que uma chave
 * Pix isolada não notifica automaticamente o recebimento — isso exigiria um gateway (Mercado
 * Pago, Efí etc.) conectado à conta, o que pode ser plugado depois sem mudar o fluxo do site.
 */
import { env } from "./env.js";

const REGEX_DIACRITICOS = new RegExp("[\\u0300-\\u036f]", "g");

function tlv(id: string, valor: string): string {
  const tamanho = valor.length.toString().padStart(2, "0");
  return `${id}${tamanho}${valor}`;
}

function removerAcentos(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(REGEX_DIACRITICOS, "")
    .replace(/[^A-Za-z0-9 ]/g, "");
}

function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function gerarPixCopiaCola(valor: number, txid: string): string {
  const chave = env.pixKeyValue.replace(/[()\-\s]/g, "");
  const nome = removerAcentos(env.pixReceiverName).slice(0, 25) || "RECEBEDOR";
  const cidade = removerAcentos(env.pixReceiverCity).slice(0, 15) || "BRASIL";
  const txidLimpo = removerAcentos(txid).slice(0, 25) || "***";

  const merchantAccountInfo = tlv("00", "br.gov.bcb.pix") + tlv("01", chave);

  const semCrc =
    tlv("00", "01") +
    tlv("26", merchantAccountInfo) +
    tlv("52", "0000") +
    tlv("53", "986") +
    tlv("54", valor.toFixed(2)) +
    tlv("58", "BR") +
    tlv("59", nome) +
    tlv("60", cidade) +
    tlv("62", tlv("05", txidLimpo)) +
    "6304";

  return semCrc + crc16(semCrc);
}
