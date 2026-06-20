import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { auth, adminOnly, soloSolicitante } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ticketCrearSchema, ticketEstadoSchema } from '../validators/schemas.js';
import { getIp } from '../utils/index.js';
import * as tickets from '../services/ticket.service.js';
import * as actividad from '../services/actividad.service.js';

const router = Router();
router.use(auth);

router.get(
  '/',
  asyncHandler(async (req, res) => res.json(await tickets.listar(req.user, req.query)))
);

// Solo las tiendas crean solicitudes.
router.post(
  '/',
  soloSolicitante,
  validate(ticketCrearSchema),
  asyncHandler(async (req, res) => {
    const ticket = await tickets.crear(req.user, req.body);
    await actividad.registrar(
      req.user.id,
      'Creó ticket',
      `${ticket.codigo} (${ticket.items.length} producto/s)`,
      getIp(req)
    );
    res.status(201).json(ticket);
  })
);

// Solo el admin procesa el estado.
router.put(
  '/:id/estado',
  adminOnly,
  validate(ticketEstadoSchema),
  asyncHandler(async (req, res) => {
    const { ticket, accionLog } = await tickets.cambiarEstado(
      req.user,
      Number(req.params.id),
      req.body
    );
    await actividad.registrar(req.user.id, accionLog, ticket.codigo, getIp(req));
    res.json(ticket);
  })
);

export default router;
