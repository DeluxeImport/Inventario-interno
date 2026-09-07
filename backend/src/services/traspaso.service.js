import { prisma } from '../lib/prisma.js';
import { notFound, badRequest, forbidden } from '../lib/AppError.js';
import { ROLES, TRASPASO_ESTADOS } from '../constants/index.js';
import { decodeCursor, pageResult } from '../lib/pagination.js';
import { clampLimit } from '../utils/index.js';
import { TIENDAS } from '../data/tiendas.js';

const NOMBRES_TIENDA = TIENDAS.map((t) => t.nombre);
const ALMACEN_ROLES = [ROLES.ADMIN, ROLES.USUARIO];

const includeTraspaso = {
  solicitante: { select: { nombre: true, username: true, tienda: true } },
  atendidoPor: { select: { nombre: true, username: true } },
};

// Código legible del traspaso derivado de su id (TR-0001).
export const codigoTraspaso = (id) => 'TR-' + String(id).padStart(4, '0');
const traspasoPublico = (t) => ({ ...t, codigo: codigoTraspaso(t.id) });

const esCursorTraspaso = (c) =>
  c && typeof c.createdAt === 'string' && !Number.isNaN(Date.parse(c.createdAt)) &&
  Number.isInteger(c.id) && c.id > 0;

// El admin y almacén ven todos los traspasos (para copiarlos al ERP real);
// una tienda solo ve los suyos, sea que los envió o que los reciba.
export async function listar(user, { estado, limit, cursor, copiadoErp, direccion } = {}) {
  const filtros = [];
  if (user.rol === ROLES.TIENDA) {
    if (!user.tienda) throw forbidden('Tu usuario no tiene una tienda asignada.');
    if (direccion && !['origen', 'destino'].includes(direccion)) throw badRequest('Dirección inválida.');
    if (direccion === 'destino') filtros.push({ destinoTienda: user.tienda });
    else if (direccion === 'origen') filtros.push({ origenTienda: user.tienda });
    else filtros.push({ OR: [{ origenTienda: user.tienda }, { destinoTienda: user.tienda }] });
  } else if (!ALMACEN_ROLES.includes(user.rol)) {
    throw forbidden('No tienes permiso para ver traspasos.');
  }
  if (estado && estado !== 'TODOS') {
    if (!Object.values(TRASPASO_ESTADOS).includes(estado)) throw badRequest('Estado inválido.');
    filtros.push({ estado: estado === 'CANCELADO' ? { in: ['CANCELADO', 'RECHAZADO'] } : estado });
  }
  if (copiadoErp !== undefined) {
    if (!['true', 'false'].includes(copiadoErp)) throw badRequest('Filtro del sistema real inválido.');
    filtros.push({ copiadoErp: copiadoErp === 'true' });
  }

  const posicion = decodeCursor(cursor, esCursorTraspaso);
  if (posicion) {
    const createdAt = new Date(posicion.createdAt);
    filtros.push({
      OR: [{ createdAt: { lt: createdAt } }, { createdAt, id: { lt: posicion.id } }],
    });
  }

  const pageSize = clampLimit(limit, 40, 100);
  const where = filtros.length > 0 ? { AND: filtros } : undefined;
  const [rows, total] = await Promise.all([
    prisma.traspaso.findMany({
      where,
      include: includeTraspaso,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: pageSize + 1,
    }),
    cursor ? Promise.resolve(null) : prisma.traspaso.count({ where }),
  ]);
  const page = pageResult(rows, pageSize, ({ createdAt, id }) => ({
    createdAt: createdAt.toISOString(),
    id,
  }));
  return { ...page, total, items: page.items.map(traspasoPublico) };
}

export async function crear(user, { destinoTienda, producto, codigoProducto, cantidad, unidad, nota }) {
  if (!user.tienda) throw badRequest('Tu usuario no tiene una tienda asignada.');
  if (!NOMBRES_TIENDA.includes(destinoTienda)) throw badRequest('Tienda destino inválida.');
  if (destinoTienda === user.tienda) throw badRequest('No puedes traspasar a tu propia tienda.');

  const t = await prisma.traspaso.create({
    data: {
      origenTienda: user.tienda,
      destinoTienda,
      producto: producto.trim(),
      codigoProducto: codigoProducto.trim(),
      cantidad,
      unidad: unidad?.trim() || null,
      nota: nota?.trim() || null,
      solicitanteId: user.id,
    },
    include: includeTraspaso,
  });
  return traspasoPublico(t);
}

// Adjunta/reemplaza la foto (evidencia opcional). Solo quien lo creó o almacén.
// Devuelve también la foto anterior (si había) para que la ruta borre el
// archivo viejo del disco y no se acumulen huérfanos con cada reemplazo.
export async function adjuntarFoto(user, id, fotoUrl) {
  const t = await prisma.traspaso.findUnique({ where: { id } });
  if (!t) throw notFound('Traspaso no encontrado.');
  const puede =
    ALMACEN_ROLES.includes(user.rol) || (user.rol === ROLES.TIENDA && user.tienda === t.origenTienda);
  // Una tienda ajena recibe "no encontrado", no "sin permiso": así no puede
  // distinguir un id inexistente de uno real que no le pertenece.
  if (!puede) {
    if (user.rol === ROLES.TIENDA) throw notFound('Traspaso no encontrado.');
    throw forbidden('No puedes adjuntar una foto a este traspaso.');
  }

  const upd = await prisma.traspaso.update({ where: { id }, data: { fotoUrl }, include: includeTraspaso });
  return { traspaso: traspasoPublico(upd), fotoAnterior: t.fotoUrl };
}

// aceptar/rechazar: solo la tienda destino. cancelar: solo la tienda origen.
// A propósito, almacén/admin NO puede actuar en nombre de una tienda: el
// traspaso lo negocian ellas solas, admin únicamente mira y copia al ERP real
// (ver marcarCopiado). Reclamo atómico igual que en tickets: evita que dos
// respuestas concurrentes (p. ej. dos pestañas) procesen el mismo traspaso dos veces.
export async function cambiarEstado(actor, id, { accion, motivo }) {
  const t = await prisma.traspaso.findUnique({ where: { id }, include: includeTraspaso });
  if (!t) throw notFound('Traspaso no encontrado.');

  const esOrigen = actor.rol === ROLES.TIENDA && actor.tienda === t.origenTienda;
  const esDestino = actor.rol === ROLES.TIENDA && actor.tienda === t.destinoTienda;

  // Autorización primero: quién puede actuar no depende de si ya se resolvió.
  // Así un tercero ajeno al traspaso nunca llega a enterarse de su estado.
  // Una tienda sin relación con este traspaso recibe "no encontrado" (no
  // "sin permiso"): así no puede distinguir un id inexistente de uno real
  // de otra tienda probando ids al azar.
  if (accion === 'cancelar') {
    if (!esOrigen) {
      if (actor.rol === ROLES.TIENDA) throw notFound('Traspaso no encontrado.');
      throw forbidden('Solo la tienda que lo creó puede cancelarlo.');
    }
  } else if (accion === 'aceptar' || accion === 'rechazar') {
    if (!esDestino) {
      if (actor.rol === ROLES.TIENDA) throw notFound('Traspaso no encontrado.');
      throw forbidden('Solo la tienda destino puede responder este traspaso.');
    }
  } else {
    throw badRequest('Acción inválida.');
  }

  if (t.estado !== TRASPASO_ESTADOS.PENDIENTE)
    throw badRequest(`El traspaso ya está ${t.estado.toLowerCase()}.`);

  if (accion === 'cancelar') {
    const claim = await prisma.traspaso.updateMany({
      where: { id, estado: TRASPASO_ESTADOS.PENDIENTE },
      data: { estado: TRASPASO_ESTADOS.CANCELADO, atendidoPorId: actor.id },
    });
    if (claim.count === 0)
      throw badRequest('El traspaso ya fue procesado por otra operación. Recarga la lista.');
    const upd = await prisma.traspaso.findUnique({ where: { id }, include: includeTraspaso });
    return { traspaso: traspasoPublico(upd), accionLog: 'Canceló traspaso' };
  }

  if (accion === 'aceptar' || accion === 'rechazar') {
    if (accion === 'rechazar' && !motivo?.trim())
      throw badRequest('Indica el motivo del rechazo.');

    const nuevoEstado = accion === 'aceptar' ? TRASPASO_ESTADOS.ACEPTADO : TRASPASO_ESTADOS.RECHAZADO;
    const claim = await prisma.traspaso.updateMany({
      where: { id, estado: TRASPASO_ESTADOS.PENDIENTE },
      data: {
        estado: nuevoEstado,
        atendidoPorId: actor.id,
        motivoRechazo: accion === 'rechazar' ? motivo.trim() : null,
      },
    });
    if (claim.count === 0)
      throw badRequest('El traspaso ya fue procesado por otra operación. Recarga la lista.');
    const upd = await prisma.traspaso.findUnique({ where: { id }, include: includeTraspaso });
    return {
      traspaso: traspasoPublico(upd),
      accionLog: accion === 'aceptar' ? 'Aceptó traspaso' : 'Rechazó traspaso',
    };
  }
}

// Checklist personal de almacén: no cambia el estado del traspaso, solo marca
// que ya se replicó a mano en el ERP real.
export async function marcarCopiado(actor, id, copiado, observacion = '') {
  if (typeof observacion !== 'string' || observacion.length > 1000) throw badRequest('La observación admite hasta 1000 caracteres.');
  if (typeof copiado !== 'boolean') throw badRequest('Indica si está registrado en el sistema real.');
  if (!ALMACEN_ROLES.includes(actor.rol)) throw forbidden('No tienes permiso para esta acción.');
  const t = await prisma.traspaso.findUnique({ where: { id } });
  if (!t) throw notFound('Traspaso no encontrado.');
  const upd = await prisma.$transaction(async (tx) => {
    const actualizado = await tx.traspaso.update({
      where: { id }, data: { copiadoErp: copiado }, include: includeTraspaso,
    });
    await tx.actividad.create({ data: {
      usuarioId: actor.id,
      accion: `ERP traspaso ${id}`,
      detalle: `${copiado ? 'Marcado como subido' : 'Sin marcar como subido'}${observacion.trim() ? `: ${observacion.trim()}` : ''}`,
    } });
    return actualizado;
  });
  return traspasoPublico(upd);
}

// Usuarios activos a avisar cuando se crea un traspaso: la tienda destino
// (tiene que aceptarlo) y almacén/admin (lo van a auditar y copiar al ERP real).
export async function usuariosParaNotificarCreacion(destinoTienda) {
  try {
    const usuarios = await prisma.usuario.findMany({
      where: {
        activo: true,
        OR: [{ rol: ROLES.TIENDA, tienda: destinoTienda }, { rol: { in: ALMACEN_ROLES } }],
      },
      select: { id: true },
    });
    return usuarios.map((u) => u.id);
  } catch (e) {
    // Best-effort, igual que notificarWhatsapp/notificarPush: una falla acá
    // no debe tumbar el proceso ni la creación del traspaso que ya se guardó.
    console.error('[traspasos] no se pudo resolver destinatarios de push:', e.message);
    return [];
  }
}

export async function historialErp(actor, id) {
  if (!ALMACEN_ROLES.includes(actor.rol)) throw forbidden('No tienes permiso para esta acción.');
  const t = await prisma.traspaso.findUnique({ where: { id } });
  if (!t) throw notFound('Traspaso no encontrado.');
  return prisma.actividad.findMany({
    where: { accion: `ERP traspaso ${id}` },
    select: { id: true, detalle: true, fecha: true, usuario: { select: { nombre: true } } },
    orderBy: { id: 'desc' }, take: 20,
  });
}
