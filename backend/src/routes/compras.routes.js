import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { auth, soloAlmacen } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { compraCrearSchema } from '../validators/schemas.js';
import { getIp } from '../utils/index.js';
import { STOCK_ESTADOS } from '../constants/index.js';
import { notificarWhatsapp } from '../lib/whatsapp.js';
import * as compras from '../services/compra.service.js';
import * as actividad from '../services/actividad.service.js';

const ESTADO_LABEL = { [STOCK_ESTADOS.BAJO]: 'stock bajo', [STOCK_ESTADOS.AGOTADO]: 'agotado' };

const router = Router();
router.use(auth, soloAlmacen);

router.get(
  '/',
  asyncHandler(async (req, res) => res.json(await compras.listar(req.query)))
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => res.json(await compras.obtener(Number(req.params.id))))
);

router.post(
  '/',
  validate(compraCrearSchema),
  asyncHandler(async (req, res) => {
    const { compra, resultados, total } = await compras.crear(req.body, req.user.nombre);
    await actividad.registrar(
      req.user.id,
      'Registró compra',
      `${req.body.proveedor}: ${resultados.length} producto(s), total S/ ${total.toFixed(2)}`,
      getIp(req)
    );
    for (const r of resultados) {
      if (r.alertaStock) {
        notificarWhatsapp(
          `⚠️ ${r.producto.producto} quedó en ${ESTADO_LABEL[r.producto.estado]} ` +
            `(total: ${r.producto.stockTotal}, mínimo: ${r.producto.stockMinimo}).`
        );
      }
    }
    res.status(201).json(await compras.obtener(compra.id));
  })
);

export default router;
