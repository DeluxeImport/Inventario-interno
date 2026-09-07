import { Router } from 'express';
import { tiendasPublicas } from '../data/tiendas.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// Catálogo público (sin auth) consumido por el carrusel del login.
// Solo expone slug + nombre; ningún dato sensible.
router.get('/publicas', (_req, res) => res.json(tiendasPublicas()));

// Mismo catálogo, autenticado: usado por el selector de tienda destino al
// crear un traspaso.
router.get('/', auth, (_req, res) => res.json(tiendasPublicas()));

export default router;
