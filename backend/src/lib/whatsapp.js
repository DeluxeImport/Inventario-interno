import { config } from '../config/env.js';

const CALLMEBOT_URL = 'https://api.callmebot.com/whatsapp.php';

// CallMeBot envía al único número asociado a la API key. La notificación es
// opcional y nunca debe interrumpir una operación del inventario.
export async function enviarWhatsapp(texto) {
  if (!config.whatsapp.enabled) return false;

  const params = new URLSearchParams({
    phone: config.whatsapp.phone,
    text: texto,
    apikey: config.whatsapp.apikey,
  });

  try {
    const response = await fetch(`${CALLMEBOT_URL}?${params}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.error(`[whatsapp] CallMeBot respondió ${response.status}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[whatsapp] no se pudo enviar:', error.message);
    return false;
  }
}

export function notificarWhatsapp(texto) {
  void enviarWhatsapp(texto);
}
