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
    // CallMeBot responde 200 incluso cuando limita o falla; el detalle va en el
    // cuerpo. Revisamos ambos para que un fallo no pase inadvertido.
    const body = (await res.text()).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!res.ok || /error|invalid|not allowed|too fast|apikey/i.test(body)) {
      console.error(`[whatsapp] CallMeBot no envió (${res.status}): ${body.slice(0, 200)}`);
    }
  } catch (e) {
    console.error('[whatsapp] no se pudo enviar:', e.message);
  }
}

// Dispara el envío sin bloquear al que llama (fire-and-forget).
export function notificarWhatsapp(texto) {
  enviarWhatsapp(texto);
}
