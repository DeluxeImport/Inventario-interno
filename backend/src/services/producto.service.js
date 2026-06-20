import { prisma } from '../lib/prisma.js';
import { withEstado } from '../utils/index.js';
import { STOCK_ESTADOS } from '../constants/index.js';

export async function listar({ q, categoria } = {}) {
  const where = {};
  if (categoria && categoria !== 'Todas') where.categoria = categoria;
  if (q) where.producto = { contains: q, mode: 'insensitive' };
  const productos = await prisma.producto.findMany({
    where,
    orderBy: [{ categoria: 'asc' }, { producto: 'asc' }],
  });
  return productos.map(withEstado);
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
  const productos = (await prisma.producto.findMany()).map(withEstado);
  const porCategoria = {};
  for (const p of productos) porCategoria[p.categoria] = (porCategoria[p.categoria] || 0) + 1;
  return {
    totalProductos: productos.length,
    bajoMinimo: productos.filter((p) => p.estado === STOCK_ESTADOS.BAJO).length,
    agotados: productos.filter((p) => p.estado === STOCK_ESTADOS.AGOTADO).length,
    porCategoria,
    alertas: productos
      .filter((p) => p.estado !== STOCK_ESTADOS.OK)
      .sort((a, b) => a.stockTotal - b.stockTotal),
  };
}
