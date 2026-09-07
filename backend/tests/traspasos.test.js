import { test, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/lib/prisma.js';
import { listar, marcarCopiado, historialErp } from '../src/services/traspaso.service.js';

const originalTraspaso = prisma.traspaso;
beforeEach(() => {
  prisma.traspaso = { findMany() {}, count() {}, findUnique() {} };
});
afterEach(() => { mock.restoreAll(); prisma.traspaso = originalTraspaso; });

test('traspasos: combina cancelados históricos, marca ERP y permisos antes de paginar', async () => {
  let consulta;
  mock.method(prisma.traspaso, 'findMany', async (args) => { consulta = args; return []; });
  mock.method(prisma.traspaso, 'count', async ({ where }) => {
    assert.deepEqual(where, consulta.where);
    return 0;
  });
  await listar({ rol: 'tienda', tienda: 'Origen' }, { estado: 'CANCELADO', copiadoErp: 'false', limit: 10 });
  assert.deepEqual(consulta.where.AND, [
    { OR: [{ origenTienda: 'Origen' }, { destinoTienda: 'Origen' }] },
    { estado: { in: ['CANCELADO', 'RECHAZADO'] } },
    { copiadoErp: false },
  ]);
  assert.equal(consulta.take, 11);
});

test('traspasos: rechaza filtros ambiguos y marcas que no son booleanos', async () => {
  await assert.rejects(listar({ rol: 'admin' }, { copiadoErp: 'no' }));
  await assert.rejects(listar({ rol: 'admin' }, { estado: 'INVENTADO' }));
  await assert.rejects(marcarCopiado({ rol: 'admin' }, 1, 'false'));
});

test('traspasos: guarda la revisión y su autor sin alterar la recepción', async () => {
  mock.method(prisma.traspaso, 'findUnique', async () => ({ id: 1 }));
  let registro;
  mock.method(prisma, '$transaction', async (operar) => operar({
    traspaso: { update: async ({ data }) => {
      assert.deepEqual(data, { copiadoErp: false });
      return { id: 1, estado: 'ACEPTADO', ...data };
    } },
    actividad: { create: async ({ data }) => { registro = data; } },
  }));
  const resultado = await marcarCopiado({ rol: 'admin', id: 7 }, 1, false, 'Falta documento');
  assert.equal(resultado.estado, 'ACEPTADO');
  assert.equal(registro.usuarioId, 7);
  assert.equal(registro.accion, 'ERP traspaso 1');
  assert.match(registro.detalle, /Falta documento/);
});

test('traspasos: una tienda no puede modificar ni leer revisiones internas del ERP', async () => {
  await assert.rejects(marcarCopiado({ rol: 'tienda' }, 1, true));
  await assert.rejects(historialErp({ rol: 'tienda' }, 1));
});
