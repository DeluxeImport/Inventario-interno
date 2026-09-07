import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { config } from '../config/env.js';
import { pushSuscripcionSchema, pushDesuscribirSchema } from '../validators/schemas.js';

const router = Router();

// Clave pública VAPID: sin auth (el frontend la necesita para armar la suscripción,
// no es secreta por diseño del estándar Web Push).
router.get('/public-key', (_req, res) => {
  res.json({ publicKey: config.push.enabled ? config.push.publicKey : null });
});

router.use(auth);

// Alta o reemplazo de la suscripción de este navegador (el endpoint es único:
// volver a suscribirse desde el mismo dispositivo actualiza el dueño y las claves).
router.post(
  '/subscribe',
  validate(pushSuscripcionSchema),
  asyncHandler(async (req, res) => {
    const { endpoint, keys } = req.body;
    await prisma.pushSuscripcion.upsert({
      where: { endpoint },
      create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, usuarioId: req.user.id },
      update: { p256dh: keys.p256dh, auth: keys.auth, usuarioId: req.user.id },
    });
    res.status(201).json({ ok: true });
  })
);

// Baja explícita (el usuario desactivó las notificaciones desde este navegador).
router.post(
  '/unsubscribe',
  validate(pushDesuscribirSchema),
  asyncHandler(async (req, res) => {
    await prisma.pushSuscripcion.deleteMany({ where: { endpoint: req.body.endpoint, usuarioId: req.user.id } });
    res.json({ ok: true });
  })
);

export default router;
