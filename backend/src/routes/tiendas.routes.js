import { Router } from 'express';
import { tiendasPublicas } from '../data/tiendas.js';

const router = Router();

// Catálogo público (sin auth) consumido por el carrusel del login.
// Solo expone slug + nombre; ningún dato sensible.
router.get('/publicas', (_req, res) => res.json(tiendasPublicas()));

export default router;
