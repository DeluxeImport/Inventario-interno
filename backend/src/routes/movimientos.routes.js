import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { auth, soloAlmacen } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { movimientoSchema } from '../validators/schemas.js';
import { getIp } from '../utils/index.js';
import { MOV_TIPOS } from '../constants/index.js';
import * as movimientos from '../services/movimiento.service.js';
import * as actividad from '../services/actividad.service.js';

const router = Router();
router.use(auth, soloAlmacen);

router.get(
  '/',
  asyncHandler(async (req, res) => res.json(await movimientos.listar(req.query)))
);

router.post(
  '/',
  validate(movimientoSchema),
  asyncHandler(async (req, res) => {
    const result = await movimientos.registrar(req.body, req.user.nombre);
    const accion =
      result.mov.tipo === MOV_TIPOS.ENTRADA ? 'Registró entrada' : 'Registró salida';
    await actividad.registrar(
      req.user.id,
      accion,
      `${result.producto.producto}: ${result.mov.cantidad}`,
      getIp(req)
    );
    res.status(201).json(result);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { mov, producto } = await movimientos.eliminar(Number(req.params.id));
    await actividad.registrar(
      req.user.id,
      'Eliminó movimiento',
      `${producto.producto}: ${mov.tipo} de ${mov.cantidad} (stock revertido)`,
      getIp(req)
    );
    res.json({ ok: true, producto });
  })
);

export default router;
