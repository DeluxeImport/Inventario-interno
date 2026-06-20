import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { auth, soloAlmacen } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { productoCrearSchema, productoEditarSchema } from '../validators/schemas.js';
import { getIp } from '../utils/index.js';
import * as productos from '../services/producto.service.js';
import * as actividad from '../services/actividad.service.js';

const router = Router();
router.use(auth, soloAlmacen);

router.get(
  '/',
  asyncHandler(async (req, res) => res.json(await productos.listar(req.query)))
);

router.post(
  '/',
  validate(productoCrearSchema),
  asyncHandler(async (req, res) => {
    const nuevo = await productos.crear(req.body);
    await actividad.registrar(req.user.id, 'Creó producto', nuevo.producto, getIp(req));
    res.status(201).json(nuevo);
  })
);

router.put(
  '/:id',
  validate(productoEditarSchema),
  asyncHandler(async (req, res) => {
    const upd = await productos.actualizar(Number(req.params.id), req.body);
    await actividad.registrar(req.user.id, 'Editó producto', upd.producto, getIp(req));
    res.json(upd);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const prod = await productos.eliminar(Number(req.params.id));
    await actividad.registrar(req.user.id, 'Eliminó producto', prod.producto, getIp(req));
    res.json({ ok: true });
  })
);

export default router;
