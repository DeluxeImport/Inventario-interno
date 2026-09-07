import { Router } from 'express';
import { tiendasPublicas } from '../data/tiendas.js';
import { auth } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { ROLES } from '../constants/index.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const router = Router();

// Catálogo público (sin auth) consumido por el carrusel del login: requiere
// logo (slug) por tienda, así que se mantiene como lista curada a mano.
router.get('/publicas', (_req, res) => res.json(tiendasPublicas()));

// Autenticado: usado por el selector de tienda destino al crear un traspaso.
// Se lee de la base de datos (usuarios activos con rol "tienda"), que es la
// fuente real de qué tiendas existen — el admin las crea/edita desde el panel
// de Usuarios sin depender de un catálogo estático que había que mantener a mano.
router.get('/', auth, asyncHandler(async (_req, res) => {
  const usuarios = await prisma.usuario.findMany({
    where: { rol: ROLES.TIENDA, activo: true, tienda: { not: null } },
    select: { tienda: true },
    distinct: ['tienda'],
    orderBy: { tienda: 'asc' },
  });
  res.json(usuarios.map((u) => ({ nombre: u.tienda })));
}));

export default router;
