import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { config } from '../config/env.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { unauthorized, forbidden } from '../lib/AppError.js';
import { ROLES, REQUESTER_ROLES } from '../constants/index.js';

// Verifica el token JWT y carga el usuario en req.user.
export const auth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw unauthorized('No autenticado.');

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw unauthorized('Sesión expirada o inválida.');
  }

  const user = await prisma.usuario.findUnique({ where: { id: payload.id } });
  if (!user || !user.activo) throw unauthorized('Sesión inválida.');

  req.user = user;
  next();
});

// Solo administradores.
export const adminOnly = (req, _res, next) => {
  if (req.user.rol !== ROLES.ADMIN) throw forbidden('Requiere permisos de administrador.');
  next();
};

// Bloquea a los roles solicitantes (tienda y líder): solo tienen acceso a Solicitudes.
export const soloAlmacen = (req, _res, next) => {
  if (REQUESTER_ROLES.includes(req.user.rol))
    throw forbidden('Tu rol solo tiene acceso a Solicitudes.');
  next();
};

// Solo roles solicitantes (tienda o líder de área) crean solicitudes.
export const soloSolicitante = (req, _res, next) => {
  if (!REQUESTER_ROLES.includes(req.user.rol))
    throw forbidden('Solo tiendas y líderes de área pueden crear solicitudes.');
  next();
};
