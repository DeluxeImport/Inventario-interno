import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { getIp, publicUser } from '../utils/index.js';
import { loginSchema } from '../validators/schemas.js';
import * as authService from '../services/auth.service.js';

const router = Router();

router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.login({ ...req.body, ip: getIp(req) });
    res.json(result);
  })
);

router.get('/me', auth, (req, res) => res.json(publicUser(req.user)));

router.post(
  '/cambiar-password',
  auth,
  asyncHandler(async (req, res) => {
    await authService.cambiarPassword(req.user, req.body, getIp(req));
    res.json({ ok: true });
  })
);

export default router;
