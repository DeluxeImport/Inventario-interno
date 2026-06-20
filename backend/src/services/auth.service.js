import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { config } from '../config/env.js';
import { publicUser } from '../utils/index.js';
import { unauthorized, badRequest } from '../lib/AppError.js';
import * as actividad from './actividad.service.js';

export async function login({ username, password, ip }) {
  const user = await prisma.usuario.findUnique({ where: { username: (username || '').trim() } });
  if (!user || !user.activo) throw unauthorized('Usuario o contraseña incorrectos.');

  const ok = await bcrypt.compare(password || '', user.passwordHash);
  if (!ok) throw unauthorized('Usuario o contraseña incorrectos.');

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
  if (!nueva || nueva.length < 4)
    throw badRequest('La nueva contraseña debe tener al menos 4 caracteres.');

  const passwordHash = await bcrypt.hash(nueva, 10);
  await prisma.usuario.update({ where: { id: user.id }, data: { passwordHash } });
  await actividad.registrar(user.id, 'Cambio de contraseña', null, ip);
}
