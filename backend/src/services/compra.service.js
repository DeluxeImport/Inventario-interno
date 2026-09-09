import { prisma } from '../lib/prisma.js';
import { notFound } from '../lib/AppError.js';
import { MOV_TIPOS } from '../constants/index.js';
import { decodeCursor, pageResult } from '../lib/pagination.js';
import { clampLimit } from '../utils/index.js';
import { ajustarStockYMovimiento } from './movimiento.service.js';

const includeCompra = {
  movimientos: { include: { producto: { select: { producto: true, unidad: true } } } },
};

const esCursorCompra = (c) =>
  c && typeof c.fecha === 'string' && !Number.isNaN(Date.parse(c.fecha)) &&
  Number.isInteger(c.id) && c.id > 0;

export async function listar({ limit, cursor, desde, hasta } = {}) {
  const filtros = [];
  if (desde || hasta) {
    filtros.push({
      fecha: {
        ...(desde ? { gte: new Date(`${desde}T00:00:00`) } : {}),
        ...(hasta ? { lt: new Date(new Date(`${hasta}T00:00:00`).getTime() + 86400000) } : {}),
      },
    });
  }

  const posicion = decodeCursor(cursor, esCursorCompra);
  if (posicion) {
    const fecha = new Date(posicion.fecha);
    filtros.push({ OR: [{ fecha: { lt: fecha } }, { fecha, id: { lt: posicion.id } }] });
  }

  const pageSize = clampLimit(limit, 30, 100);
  const where = filtros.length > 0 ? { AND: filtros } : undefined;
  const rows = await prisma.compra.findMany({
    where,
    include: includeCompra,
    orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
    take: pageSize + 1,
  });
  return pageResult(rows, pageSize, ({ fecha, id }) => ({ fecha: fecha.toISOString(), id }));
}

export async function obtener(id) {
  const compra = await prisma.compra.findUnique({ where: { id }, include: includeCompra });
  if (!compra) throw notFound('Compra no encontrada.');
  return compra;
}

// Crea la Compra y una línea (Movimiento ENTRADA) por cada ítem, todo en una
// sola transacción: si un producto no existe o algo falla, no queda nada a medias.
export async function crear({ proveedor, comprobante, observacion, items }, registradoPor) {
  const total = items.reduce((acc, it) => acc + Number(it.cantidad) * Number(it.precioUnitario), 0);

  return prisma.$transaction(async (tx) => {
    const compra = await tx.compra.create({
      data: {
        proveedor: proveedor.trim(),
        comprobante: comprobante?.trim() || null,
        observacion: observacion?.trim() || null,
        total,
        registradoPor,
      },
    });

    const resultados = [];
    for (const item of items) {
      const r = await ajustarStockYMovimiento(tx, {
        productoId: item.productoId,
        tipo: MOV_TIPOS.ENTRADA,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        compraId: compra.id,
        responsable: registradoPor,
      });
      resultados.push(r);
    }

    return { compra, resultados };
  });
}
