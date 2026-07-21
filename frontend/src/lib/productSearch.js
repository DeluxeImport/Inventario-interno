const normalizeSearch = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export function filterProducts(products, query) {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return products;
  return products.filter((product) =>
    normalizeSearch(`${product.producto} ${product.categoria}`).includes(normalizedQuery)
  );
}

// Las solicitudes se entregan desde stock completo; el stock incompleto no está
// disponible para pedidos hasta que almacén lo regularice.
export const hasRequestStock = (product) => Number(product?.stockCompleto) > 0;
