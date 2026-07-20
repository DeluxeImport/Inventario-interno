import { prisma } from '../lib/prisma.js';
import { clampLimit, withEstado } from '../utils/index.js';
import { decodeCursor, pageResult } from '../lib/pagination.js';

const esCursorProducto = (c) =>
  c &&
  typeof c.categoria === 'string' &&
  typeof c.producto === 'string' &&
  Number.isInteger(c.id) &&
  c.id > 0;

export async function listar({ q, categoria, limit, cursor } = {}) {
  const filtros = [];
  if (categoria && categoria !== 'Todas') filtros.push({ categoria });
  if (q?.trim()) filtros.push({ producto: { contains: q.trim(), mode: 'insensitive' } });

  const posicion = decodeCursor(cursor, esCursorProducto);
  if (posicion) {
    filtros.push({
      OR: [
        { categoria: { gt: posicion.categoria } },
        { categoria: posicion.categoria, producto: { gt: posicion.producto } },
        { categoria: posicion.categoria, producto: posicion.producto, id: { gt: posicion.id } },
      ],
    });
  }

  const pageSize = clampLimit(limit, 50, 100);
  const rows = await prisma.producto.findMany({
    where: filtros.length > 0 ? { AND: filtros } : undefined,
    orderBy: [{ categoria: 'asc' }, { producto: 'asc' }, { id: 'asc' }],
    take: pageSize + 1,
  });
  return pageResult(rows.map(withEstado), pageSize, ({ categoria, producto, id }) => ({
    categoria,
    producto,
    id,
  }));
}

export async function categorias() {
  const rows = await prisma.producto.findMany({
    distinct: ['categoria'],
    select: { categoria: true },
    orderBy: { categoria: 'asc' },
  });
  return rows.map((r) => r.categoria);
}

export async function crear(data) {
  const nuevo = await prisma.producto.create({
    data: {
      categoria: data.categoria.trim(),
      producto: data.producto.trim(),
      unidad: (data.unidad || 'Unidad').trim(),
      stockCompleto: Number(data.stockCompleto) || 0,
      stockIncompleto: Number(data.stockIncompleto) || 0,
      stockMinimo: Number(data.stockMinimo) || 0,
      solicitable: !!data.solicitable,
    },
  });
  return withEstado(nuevo);
}

export async function actualizar(id, data) {
  const upd = await prisma.producto.update({
    where: { id },
    data: {
      categoria: data.categoria?.trim(),
      producto: data.producto?.trim(),
      unidad: data.unidad?.trim(),
      stockCompleto: data.stockCompleto != null ? Number(data.stockCompleto) : undefined,
      stockIncompleto: data.stockIncompleto != null ? Number(data.stockIncompleto) : undefined,
      stockMinimo: data.stockMinimo != null ? Number(data.stockMinimo) : undefined,
      solicitable: data.solicitable != null ? !!data.solicitable : undefined,
    },
  });
  return withEstado(upd);
}

export async function eliminar(id) {
  return prisma.producto.delete({ where: { id } });
}

export async function solicitables() {
  const productos = await prisma.producto.findMany({
    where: { solicitable: true },
    orderBy: [{ categoria: 'asc' }, { producto: 'asc' }],
  });
  return productos.map(withEstado);
}

export async function stats() {
  const [resumenRows, categoriasRows, alertas] = await Promise.all([
    prisma.$queryRaw`
      SELECT
        COUNT(*)::int AS "totalProductos",
        COUNT(*) FILTER (
          WHERE ("stockCompleto" + "stockIncompleto") > 0
            AND ("stockCompleto" + "stockIncompleto") <= "stockMinimo"
        )::int AS "bajoMinimo",
        COUNT(*) FILTER (
          WHERE ("stockCompleto" + "stockIncompleto") <= 0
        )::int AS "agotados"
      FROM "Producto"
    `,
    prisma.producto.groupBy({
      by: ['categoria'],
      _count: { _all: true },
      orderBy: { categoria: 'asc' },
    }),
    prisma.$queryRaw`
      SELECT
        id,
        categoria,
        producto,
        "stockMinimo",
        ("stockCompleto" + "stockIncompleto")::int AS "stockTotal",
        CASE
          WHEN ("stockCompleto" + "stockIncompleto") <= 0 THEN 'AGOTADO'
          ELSE 'BAJO'
        END AS estado
      FROM "Producto"
      WHERE ("stockCompleto" + "stockIncompleto") <= "stockMinimo"
      ORDER BY
        CASE WHEN ("stockCompleto" + "stockIncompleto") <= 0 THEN 0 ELSE 1 END,
        ("stockCompleto" + "stockIncompleto") ASC,
        producto ASC
      LIMIT 200
    `,
  ]);

  const resumen = resumenRows[0] || { totalProductos: 0, bajoMinimo: 0, agotados: 0 };
  const porCategoria = Object.fromEntries(
    categoriasRows.map((row) => [row.categoria, row._count._all])
  );
  return {
    ...resumen,
    porCategoria,
    alertas,
    alertasLimitadas: resumen.bajoMinimo + resumen.agotados > alertas.length,
  };
}
