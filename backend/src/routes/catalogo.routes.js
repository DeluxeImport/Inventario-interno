import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { auth, soloAlmacen } from '../middleware/auth.js';
import * as productos from '../services/producto.service.js';
import * as usuarios from '../services/usuario.service.js';

const router = Router();

// Categorías y estadísticas: no accesibles para tiendas.
router.get(
  '/categorias',
  auth,
  soloAlmacen,
  asyncHandler(async (_req, res) => res.json(await productos.categorias()))
);

router.get(
  '/stats',
  auth,
  soloAlmacen,
  asyncHandler(async (_req, res) => res.json(await productos.stats()))
);

// Destinos para una salida de stock (tiendas registradas + áreas).
router.get(
  '/destinos',
  auth,
  soloAlmacen,
  asyncHandler(async (_req, res) => res.json(await usuarios.destinos()))
);

// Productos solicitables: accesibles también para tiendas (para crear tickets).
router.get(
  '/solicitables',
  auth,
  asyncHandler(async (_req, res) => res.json(await productos.solicitables()))
);

export default router;
