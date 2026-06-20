import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  withEstado,
  codigoTicket,
  publicUser,
  getIp,
  destinoDeSolicitante,
  clampLimit,
} from '../src/utils/index.js';
import { ROLES_LIST, STOCK_ESTADOS } from '../src/constants/index.js';
import {
  productoCrearSchema,
  usuarioCrearSchema,
  ticketCrearSchema,
} from '../src/validators/schemas.js';

test('withEstado: AGOTADO cuando el total es 0 o menos', () => {
  const p = withEstado({ stockCompleto: 0, stockIncompleto: 0, stockMinimo: 1 });
  assert.equal(p.estado, STOCK_ESTADOS.AGOTADO);
  assert.equal(p.stockTotal, 0);
});

test('withEstado: BAJO cuando el total es menor o igual al mínimo', () => {
  const p = withEstado({ stockCompleto: 1, stockIncompleto: 0, stockMinimo: 1 });
  assert.equal(p.estado, STOCK_ESTADOS.BAJO);
  assert.equal(p.stockTotal, 1);
});

test('withEstado: OK cuando el total supera el mínimo (suma completo + incompleto)', () => {
  const p = withEstado({ stockCompleto: 3, stockIncompleto: 2, stockMinimo: 4 });
  assert.equal(p.estado, STOCK_ESTADOS.OK);
  assert.equal(p.stockTotal, 5);
});

test('codigoTicket: formatea con ceros a la izquierda', () => {
  assert.equal(codigoTicket(1), 'TK-0001');
  assert.equal(codigoTicket(123), 'TK-0123');
  assert.equal(codigoTicket(45678), 'TK-45678');
});

test('publicUser: nunca expone passwordHash', () => {
  const u = publicUser({
    id: 1,
    username: 'admin',
    nombre: 'Admin',
    rol: 'admin',
    tienda: null,
    activo: true,
    ultimoLogin: null,
    ultimaIp: null,
    createdAt: new Date(),
    passwordHash: 'super-secreto',
  });
  assert.equal(u.passwordHash, undefined);
  assert.equal(u.username, 'admin');
});

test('getIp: normaliza IPv6 local a etiqueta legible', () => {
  const ip = getIp({ headers: {}, socket: { remoteAddress: '::1' } });
  assert.equal(ip, '127.0.0.1 (local)');
});

test('getIp: usa el primer valor de x-forwarded-for', () => {
  const ip = getIp({ headers: { 'x-forwarded-for': '203.0.113.5, 10.0.0.1' }, socket: {} });
  assert.equal(ip, '203.0.113.5');
});

test('destinoDeSolicitante: prioriza tienda, luego área', () => {
  assert.equal(destinoDeSolicitante({ tienda: 'Nova', area: null }), 'Nova');
  assert.equal(destinoDeSolicitante({ tienda: null, area: 'Logística' }), 'Logística');
  assert.equal(destinoDeSolicitante({ tienda: null, area: null }), null);
});

test('clampLimit: usa el valor por defecto ante entradas inválidas', () => {
  assert.equal(clampLimit(undefined, 100, 200), 100);
  assert.equal(clampLimit('abc', 100, 200), 100);
  assert.equal(clampLimit(0, 100, 200), 100);
  assert.equal(clampLimit(-5, 100, 200), 100);
});

test('clampLimit: recorta al máximo y respeta valores válidos', () => {
  assert.equal(clampLimit(50, 100, 200), 50);
  assert.equal(clampLimit(999, 100, 200), 200);
  assert.equal(clampLimit('30', 100, 200), 30);
});

test('ROLES_LIST contiene los cuatro roles esperados', () => {
  assert.deepEqual([...ROLES_LIST].sort(), ['admin', 'lider', 'tienda', 'usuario']);
});

// ----- Validaciones de esquemas -----

test('productoCrearSchema: rechaza stock negativo', () => {
  const r = productoCrearSchema.safeParse({
    categoria: 'Papelería',
    producto: 'Lápiz',
    stockCompleto: -5,
  });
  assert.equal(r.success, false);
  assert.match(r.error.issues[0].message, /no puede ser negativo/);
});

test('productoCrearSchema: acepta stock cero y datos válidos', () => {
  const r = productoCrearSchema.safeParse({
    categoria: 'Papelería',
    producto: 'Lápiz',
    stockCompleto: 0,
    stockMinimo: 3,
  });
  assert.equal(r.success, true);
});

test('usuarioCrearSchema: rechaza un rol inválido', () => {
  const r = usuarioCrearSchema.safeParse({
    username: 'x',
    nombre: 'X',
    password: '1234',
    rol: 'superadmin',
  });
  assert.equal(r.success, false);
  assert.match(r.error.issues[0].message, /Rol inválido/);
});

test('usuarioCrearSchema: acepta un rol válido de la lista', () => {
  const r = usuarioCrearSchema.safeParse({
    username: 'x',
    nombre: 'X',
    password: '1234',
    rol: 'tienda',
  });
  assert.equal(r.success, true);
});

test('ticketCrearSchema: rechaza cantidad decimal o no positiva', () => {
  const decimal = ticketCrearSchema.safeParse({ items: [{ productoId: 1, cantidad: 2.5 }] });
  assert.equal(decimal.success, false);
  const cero = ticketCrearSchema.safeParse({ items: [{ productoId: 1, cantidad: 0 }] });
  assert.equal(cero.success, false);
});

test('ticketCrearSchema: acepta cantidades enteras positivas', () => {
  const r = ticketCrearSchema.safeParse({ items: [{ productoId: 1, cantidad: 3 }] });
  assert.equal(r.success, true);
});
