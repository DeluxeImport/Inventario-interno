import webpush from 'web-push';
import { config } from '../config/env.js';
import { prisma } from './prisma.js';

if (config.push.enabled) {
  webpush.setVapidDetails(config.push.subject, config.push.publicKey, config.push.privateKey);
}

// Manda una notificación push a todas las suscripciones activas de los
// usuarios indicados. Nunca lanza: una falla de notificación no debe romper
// la operación que la disparó (mismo criterio que notificarWhatsapp).
// Si una suscripción quedó inválida (endpoint dado de baja por el navegador,
// 404/410) se borra sola para no seguir intentando.
export async function notificarPush(usuarioIds, { titulo, cuerpo, url }) {
  if (!config.push.enabled || !usuarioIds?.length) return;
  try {
    const subs = await prisma.pushSuscripcion.findMany({ where: { usuarioId: { in: usuarioIds } } });
    const payload = JSON.stringify({ title: titulo, body: cuerpo, url: url || '/' });
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload
          );
        } catch (e) {
          if (e.statusCode === 404 || e.statusCode === 410) {
            await prisma.pushSuscripcion.delete({ where: { id: s.id } }).catch(() => {});
          } else {
            console.error('[push] no se pudo enviar:', e.message);
          }
        }
      })
    );
  } catch (e) {
    console.error('[push] fallo al notificar:', e.message);
  }
}
