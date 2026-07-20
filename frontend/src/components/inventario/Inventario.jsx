import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import EstadoBadge from '../common/EstadoBadge';
import Icon from '../common/Icon';
import ProductoModal from './ProductoModal';
import MovimientoModal from './MovimientoModal';

const PRODUCTO_VACIO = {
  categoria: '',
  producto: '',
  unidad: 'Unidad',
  stockCompleto: 0,
  stockIncompleto: 0,
  stockMinimo: 0,
  solicitable: false,
};

const PAGE_SIZE = 50;


// Clase de la fila según la gravedad del estado: agotado pesa más que stock bajo.
const claseFila = (estado) => {
  if (estado === 'AGOTADO') return 'row-alert row-alert--critica';
  if (estado === 'BAJO') return 'row-alert';
  return '';
};

export default function Inventario({ categorias, onChanged, onError }) {
  const [productos, setProductos] = useState([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Todas');
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [editing, setEditing] = useState(null);
  const [movFor, setMovFor] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const page = await api.productos({ q, categoria: cat, limit: PAGE_SIZE });
      setProductos(page.items);
      setNextCursor(page.nextCursor);
    } catch (e) {
      onError(e.message);
    } finally {
      setLoading(false);
    }
  }, [q, cat, onError]);

  const cargarMas = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await api.productos({
        q,
        categoria: cat,
        cursor: nextCursor,
        limit: PAGE_SIZE,
      });
      setProductos((actuales) => [...actuales, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch (e) {
      onError(e.message);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(cargar, 200);
    return () => clearTimeout(t);
  }, [cargar]);

  const recargarTodo = () => {
    cargar();
    onChanged();
  };

  const borrar = async (p) => {
    if (!confirm(`¿Eliminar "${p.producto}"? Esto borra también su historial de movimientos.`))
      return;
    try {
      await api.borrarProducto(p.id);
      recargarTodo();
    } catch (e) {
      onError(e.message);
    }
  };

  return (
    <div>
      <div className="toolbar">
        <div className="search-field">
          <Icon name="buscar" size={14} />
          <input
            type="search"
            placeholder="Buscar producto…"
            aria-label="Buscar producto"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Categoría">
          <option>Todas</option>
          {categorias.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button className="btn btn-primary" onClick={() => setEditing({ ...PRODUCTO_VACIO })}>
          <Icon name="mas" size={13} strokeWidth={2} />
          Nuevo producto
        </button>
        {!loading && (
          <span className="toolbar-count">
            {productos.length === 1 ? '1 producto cargado' : `${productos.length} productos cargados`}
          </span>
        )}
      </div>

      {loading ? (
        <p className="muted">Cargando…</p>
      ) : (
        <div className="table-wrap">
          <table className="tbl-stock">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Unidad de medida</th>
                <th className="num">Completo</th>
                <th className="num">Incompleto</th>
                <th className="num">Total</th>
                <th className="num">Mínimo</th>
                <th>Estado</th>
                <th className="col-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id} className={claseFila(p.estado)}>
                  <td data-label="Producto" className="strong">
                    {p.producto}
                    {p.solicitable && (
                      <span className="tag-solic">
                        <Icon name="ticket" size={13} title="Solicitable por ticket" />
                      </span>
                    )}
                  </td>
                  <td data-label="Categoría">{p.categoria}</td>
                  <td data-label="Unidad">{p.unidad}</td>
                  <td data-label="Completo" className="num">{p.stockCompleto}</td>
                  <td data-label="Incompleto" className="num">{p.stockIncompleto}</td>
                  <td data-label="Total" className="num strong">{p.stockTotal}</td>
                  <td data-label="Mínimo" className="num">{p.stockMinimo}</td>
                  <td data-label="Estado">
                    <EstadoBadge estado={p.estado} />
                  </td>
                  <td data-label="Acciones" className="actions">
                    <div className="row-actions">
                      <button
                        className="icon-btn"
                        onClick={() => setMovFor(p)}
                        title="Registrar movimiento"
                      >
                        <Icon name="transfer" size={15} title="Registrar movimiento" />
                      </button>
                      <button className="icon-btn" onClick={() => setEditing(p)} title="Editar">
                        <Icon name="lapiz" size={15} title="Editar" />
                      </button>
                      <button
                        className="icon-btn icon-btn--danger"
                        onClick={() => borrar(p)}
                        title="Eliminar producto"
                      >
                        <Icon name="basura" size={15} title="Eliminar producto" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {productos.length === 0 && (
                <tr>
                  <td colSpan={9} className="muted center">
                    No hay productos que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {nextCursor && (
            <div className="center" style={{ padding: '12px' }}>
              <button className="btn btn-sm" onClick={cargarMas} disabled={loadingMore}>
                {loadingMore ? 'Cargando…' : 'Cargar más'}
              </button>
            </div>
          )}
        </div>
      )}

      {editing && (
        <ProductoModal
          producto={editing}
          categorias={categorias}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            recargarTodo();
          }}
          onError={onError}
        />
      )}
      {movFor && (
        <MovimientoModal
          producto={movFor}
          onClose={() => setMovFor(null)}
          onSaved={() => {
            setMovFor(null);
            recargarTodo();
          }}
          onError={onError}
        />
      )}
    </div>
  );
}
