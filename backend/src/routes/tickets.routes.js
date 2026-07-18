import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { auth, adminOnly, soloSolicitante } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ticketCrearSchema, ticketEstadoSchema } from '../validators/schemas.js';
import { getIp, codigoTicket } from '../utils/index.js';
import { notificarWhatsapp } from '../lib/whatsapp.js';
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
    const origen =
      ticket.solicitante?.tienda || ticket.solicitante?.area || ticket.solicitante?.nombre;
    notificarWhatsapp(
      `📩 Nueva solicitud ${ticket.codigo} de ${origen} (${ticket.items.length} producto/s).`
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
    const id = Number(req.params.id);
    let result;
    try {
      result = await tickets.cambiarEstado(req.user, id, req.body);
    } catch (e) {
      // Si no se pudo entregar por falta de stock, avisa para reponer y
      // re-lanza el error para que el admin lo vea igual.
      if (/stock insuficiente/i.test(e.message)) {
        notificarWhatsapp(`⚠️ No se pudo entregar ${codigoTicket(id)}: ${e.message} Reponer stock.`);
      }
      throw e;
    }
    await actividad.registrar(req.user.id, result.accionLog, result.ticket.codigo, getIp(req));
    res.json(result.ticket);
  })
);

export default router;
