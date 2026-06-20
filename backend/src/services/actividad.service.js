import { prisma } from '../lib/prisma.js';
import { clampLimit } from '../utils/index.js';

// Registra una acción en la bitácora. No lanza: un fallo aquí no debe romper la operación principal.
export async function registrar(usuarioId, accion, detalle, ip) {
  try {
    await prisma.actividad.create({
      data: { usuarioId, accion, detalle: detalle || null, ip: ip || null },
    });
  } catch (e) {
    console.error('Error registrando actividad:', e.message);
  }
}

export function listar({ usuarioId, limit, cursor } = {}) {
  const where = usuarioId ? { usuarioId: Number(usuarioId) } : {};
  const take = clampLimit(limit, 300, 500);
  return prisma.actividad.findMany({
    where,
    include: { usuario: { select: { username: true, nombre: true, tienda: true } } },
    orderBy: { id: 'desc' },
    take,
    ...(cursor ? { skip: 1, cursor: { id: Number(cursor) } } : {}),
  });
}
