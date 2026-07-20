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
