import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { auth, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { usuarioCrearSchema, usuarioEditarSchema } from '../validators/schemas.js';
import { getIp } from '../utils/index.js';
import * as usuarios from '../services/usuario.service.js';
import * as actividad from '../services/actividad.service.js';

const router = Router();
router.use(auth, adminOnly);

router.get(
  '/',
  asyncHandler(async (_req, res) => res.json(await usuarios.listar()))
);

router.post(
  '/',
  validate(usuarioCrearSchema),
  asyncHandler(async (req, res) => {
    const nuevo = await usuarios.crear(req.body);
    await actividad.registrar(
      req.user.id,
      'Creó usuario',
      `${nuevo.username} (${nuevo.rol})`,
      getIp(req)
    );
    res.status(201).json(nuevo);
  })
);

router.put(
  '/:id',
  validate(usuarioEditarSchema),
  asyncHandler(async (req, res) => {
    const upd = await usuarios.actualizar(Number(req.params.id), req.body);
    await actividad.registrar(
      req.user.id,
      'Editó usuario',
      `${upd.username}${req.body.password ? ' (restableció contraseña)' : ''}`,
      getIp(req)
    );
    res.json(upd);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const u = await usuarios.eliminar(Number(req.params.id), req.user.id);
    await actividad.registrar(req.user.id, 'Eliminó usuario', u.username, getIp(req));
    res.json({ ok: true });
  })
);

export default router;
