import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterProducts } from '../src/lib/productSearch.js';

const products = [
  { id: 1, producto: 'Lápiz azul', categoria: 'Papelería' },
  { id: 2, producto: 'Bolsa grande', categoria: 'Empaque' },
  { id: 3, producto: 'Alcohol', categoria: 'Limpieza' },
];

test('buscador de solicitudes: encuentra por nombre ignorando tildes y mayúsculas', () => {
  assert.deepEqual(filterProducts(products, 'LAPIZ').map((p) => p.id), [1]);
});

test('buscador de solicitudes: encuentra por categoría', () => {
  assert.deepEqual(filterProducts(products, 'empaque').map((p) => p.id), [2]);
});

test('buscador de solicitudes: sin texto conserva todos los productos', () => {
  assert.equal(filterProducts(products, '').length, products.length);
});
