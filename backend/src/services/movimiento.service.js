import { prisma } from '../lib/prisma.js';
import { withEstado, clampLimit } from '../utils/index.js';
import { notFound, badRequest } from '../lib/AppError.js';
import { MOV_TIPOS, STOCK_ESTADOS } from '../constants/index.js';

const parseFecha = (valor) => {
  if (!valor) return null;
  const fecha = new Date(`${valor}T00:00:00`);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

// Lista paginada por cursor (id descendente ≈ más reciente primero). `cursor` = id del
// último movimiento ya cargado; devuelve la página siguiente (más antiguos).
export function listar({ productoId, limit, cursor, desde, hasta, tipo } = {}) {
  const where = {};
  if (productoId) where.productoId = Number(productoId);
  if (tipo === MOV_TIPOS.ENTRADA || tipo === MOV_TIPOS.SALIDA) where.tipo = tipo;

  const fechaDesde = parseFecha(desde);
  const fechaHasta = parseFecha(hasta);
  if (fechaDesde || fechaHasta) {
    where.fecha = {};
    if (fechaDesde) where.fecha.gte = fechaDesde;
    if (fechaHasta) {
      const finDelRango = new Date(fechaHasta);
      finDelRango.setDate(finDelRango.getDate() + 1);
      where.fecha.lt = finDelRango;
    }
  }

  const take = clampLimit(limit, 100, 200);
  return prisma.movimiento.findMany({
    where,
    include: { producto: true },
    orderBy: { id: 'desc' },
    take,
    ...(cursor ? { skip: 1, cursor: { id: Number(cursor) } } : {}),
  });
}

// Registra entrada/salida ajustando el stock de forma atómica.
export async function registrar(data, responsablePorDefecto) {
  const { productoId, tipo, cantidad, responsable, observacion, destino } = data;
  const cant = Number(cantidad);
  if (!productoId || ![MOV_TIPOS.ENTRADA, MOV_TIPOS.SALIDA].includes(tipo) || !cant || cant <= 0)
    throw badRequest('Datos del movimiento inválidos.');

  return prisma.$transaction(async (tx) => {
    const prod = await tx.producto.findUnique({ where: { id: Number(productoId) } });
    if (!prod) throw notFound('Producto no encontrado.');

    // Ajuste atómico del stock (increment/decrement) para evitar lost-updates entre
    // movimientos concurrentes. En SALIDA el guard `gte` impide dejar el stock negativo.
    if (tipo === MOV_TIPOS.SALIDA) {
      const res = await tx.producto.updateMany({
        where: { id: prod.id, stockCompleto: { gte: cant } },
        data: { stockCompleto: { decrement: cant } },
      });
      if (res.count === 0)
        throw badRequest(`Stock insuficiente. Disponible (completo): ${prod.stockCompleto}`);
    } else {
      await tx.producto.update({
        where: { id: prod.id },
        data: { stockCompleto: { increment: cant } },
      });
    }
    const updated = await tx.producto.findUnique({ where: { id: prod.id } });
    const mov = await tx.movimiento.create({
      data: {
        productoId: prod.id,
        tipo,
        cantidad: cant,
        destino: destino?.trim() || null,
        responsable: responsable?.trim() || responsablePorDefecto,
        observacion: observacion?.trim() || null,
      },
    });
    const producto = withEstado(updated);
    const estadoAntes = withEstado(prod).estado;
    const alertaStock =
      (estadoAntes === STOCK_ESTADOS.OK && producto.estado !== STOCK_ESTADOS.OK) ||
      (estadoAntes === STOCK_ESTADOS.BAJO && producto.estado === STOCK_ESTADOS.AGOTADO);
    return { mov, producto, alertaStock };
  });
}

// Elimina un movimiento y revierte su efecto en el stock (de forma atómica).
// Una ENTRADA borrada descuenta lo que había sumado; una SALIDA borrada lo devuelve.
export async function eliminar(id) {
  return prisma.$transaction(async (tx) => {
    const mov = await tx.movimiento.findUnique({ where: { id }, include: { producto: true } });
    if (!mov) throw notFound('Movimiento no encontrado.');

    // Al revertir una ENTRADA se resta (guard para no dejar negativo); al revertir una SALIDA se suma.
    if (mov.tipo === MOV_TIPOS.ENTRADA) {
      const res = await tx.producto.updateMany({
        where: { id: mov.productoId, stockCompleto: { gte: mov.cantidad } },
        data: { stockCompleto: { decrement: mov.cantidad } },
      });
      if (res.count === 0)
        throw badRequest(
          `No se puede eliminar: revertir esta entrada dejaría el stock negativo (disponible: ${mov.producto.stockCompleto}, a revertir: ${mov.cantidad}).`
        );
    } else {
      await tx.producto.update({
        where: { id: mov.productoId },
        data: { stockCompleto: { increment: mov.cantidad } },
      });
    }
    const updated = await tx.producto.findUnique({ where: { id: mov.productoId } });
    await tx.movimiento.delete({ where: { id } });
    return { mov, producto: withEstado(updated) };
  });
}
