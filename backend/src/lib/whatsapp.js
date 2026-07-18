import { config } from '../config/env.js';

// Envía un mensaje de WhatsApp vía CallMeBot (https://www.callmebot.com).
//
// CallMeBot manda a UN solo número (el que registró la apikey). Si no está
// configurado (falta teléfono o apikey), no hace nada. Nunca lanza: una falla
// de notificación no debe romper la operación que la disparó.
export async function enviarWhatsapp(texto) {
  if (!config.whatsapp.enabled) return;
  const { phone, apikey } = config.whatsapp;
  const url =
    'https://api.callmebot.com/whatsapp.php' +
    `?phone=${encodeURIComponent(phone)}` +
    `&text=${encodeURIComponent(texto)}` +
    `&apikey=${encodeURIComponent(apikey)}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) console.error(`[whatsapp] CallMeBot respondió ${res.status}`);
  } catch (e) {
    console.error('[whatsapp] no se pudo enviar:', e.message);
  }
}

// Dispara el envío sin bloquear al que llama (fire-and-forget).
export function notificarWhatsapp(texto) {
  enviarWhatsapp(texto);
}
