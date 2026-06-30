import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { config } from '../config/env.js';
import { publicUser } from '../utils/index.js';
import { unauthorized, badRequest } from '../lib/AppError.js';
import { SECCIONES, seccionDeRol } from '../constants/index.js';
import { assertPasswordAllowed } from '../security/passwordPolicy.js';
import * as actividad from './actividad.service.js';

const ERROR_CRUCE_SECCION = {
  [SECCIONES.ADMIN]: 'Esta cuenta pertenece al portal de Tiendas. Usa el acceso de Tiendas.',
  [SECCIONES.TIENDA]: 'Esta cuenta es administrativa. Usa el acceso de Administración.',
};

export async function login({ username, password, seccion, ip }) {
  const user = await prisma.usuario.findUnique({ where: { username: (username || '').trim() } });
  if (!user || !user.activo) throw unauthorized('Usuario o contraseña incorrectos.');

  const ok = await bcrypt.compare(password || '', user.passwordHash);
  if (!ok) throw unauthorized('Usuario o contraseña incorrectos.');

  // Validar sección ANTES de emitir token: si el cliente eligió la pestaña
  // equivocada, no debe existir un JWT capturable en la respuesta.
  if (seccionDeRol(user.rol) !== seccion) {
    throw unauthorized(ERROR_CRUCE_SECCION[seccion]);
  }

  await prisma.usuario.update({
    where: { id: user.id },
    data: { ultimoLogin: new Date(), ultimaIp: ip },
  });
  await actividad.registrar(user.id, 'Inicio de sesión', `Ingreso desde ${ip}`, ip);

  const token = jwt.sign({ id: user.id, rol: user.rol }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
  return { token, user: publicUser({ ...user, ultimaIp: ip }) };
}

export async function cambiarPassword(user, { actual, nueva }, ip) {
  const ok = await bcrypt.compare(actual || '', user.passwordHash);
  if (!ok) throw badRequest('La contraseña actual no es correcta.');
  assertPasswordAllowed(nueva);

  const passwordHash = await bcrypt.hash(nueva, 10);
  await prisma.usuario.update({ where: { id: user.id }, data: { passwordHash } });
  await actividad.registrar(user.id, 'Cambio de contraseña', null, ip);
}
