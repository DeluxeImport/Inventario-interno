import { useEffect, useMemo, useState } from 'react';
import { filterProducts } from '../../lib/productSearch';
import Icon from '../common/Icon';

const MAX_SEARCH_RESULTS = 12;

export default function ProductSearch({ productos, productoId, onSelect }) {
  const [busqueda, setBusqueda] = useState('');
  const productosFiltrados = useMemo(
    () => filterProducts(productos, busqueda),
    [productos, busqueda]
  );

  useEffect(() => {
    if (productoId && !productosFiltrados.some((producto) => producto.id === Number(productoId))) {
      onSelect('');
    }
  }, [productoId, productosFiltrados, onSelect]);

  return (
    <>
      <div className="search-field ticket-product-search">
        <Icon name="buscar" size={14} />
        <input
          type="search"
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Buscar por nombre o categoría…"
          aria-label="Buscar producto para solicitud"
        />
      </div>

      {busqueda.trim() ? (
        <div className="product-search-results">
          {productosFiltrados.length === 0 ? (
            <p className="product-search-empty">No encontramos productos con ese texto.</p>
          ) : (
            <>
              <p className="product-search-count">
                {productosFiltrados.length === 1
                  ? '1 producto encontrado'
                  : `${productosFiltrados.length} productos encontrados`}
              </p>
              <div className="product-search-list" role="listbox" aria-label="Productos encontrados">
                {productosFiltrados.slice(0, MAX_SEARCH_RESULTS).map((producto) => (
                  <button
                    key={producto.id}
                    type="button"
                    className="product-search-option"
                    role="option"
                    aria-selected={producto.id === Number(productoId)}
                    onClick={() => {
                      onSelect(String(producto.id));
                      setBusqueda('');
                    }}
                  >
                    <span>
                      <strong>{producto.producto}</strong>
                      <small>{producto.categoria}</small>
                    </span>
                    <span className="product-search-stock">Stock {producto.stockCompleto}</span>
                  </button>
                ))}
              </div>
              {productosFiltrados.length > MAX_SEARCH_RESULTS && (
                <p className="product-search-hint">Escribe un poco más para reducir los resultados.</p>
              )}
            </>
          )}
        </div>
      ) : (
        <select
          className="add-select"
          value={productoId}
          onChange={(event) => onSelect(event.target.value)}
        >
          <option value="">Elegir producto…</option>
          {productos.map((producto) => (
            <option key={producto.id} value={producto.id}>
              {producto.producto} ({producto.categoria}) · stock {producto.stockCompleto}
            </option>
          ))}
        </select>
      )}
    </>
  );
}

