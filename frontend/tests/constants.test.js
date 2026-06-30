import { test } from 'node:test';
import assert from 'node:assert/strict';
import { puede } from '../src/constants.js';

test('puede: no concede permisos a roles desconocidos', () => {
  assert.equal(puede('superadmin', 'inventario'), false);
  assert.equal(puede(undefined, 'inventario'), false);
});

test('puede: conserva permisos explícitos de roles válidos', () => {
  assert.equal(puede('usuario', 'inventario'), true);
  assert.equal(puede('tienda', 'inventario'), false);
  assert.equal(puede('tienda', 'tickets'), true);
});
