import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { auth, adminOnly } from '../middleware/auth.js';
import * as actividad from '../services/actividad.service.js';

const router = Router();
router.use(auth, adminOnly);

router.get(
  '/',
  asyncHandler(async (req, res) => res.json(await actividad.listar(req.query)))
);

export default router;
