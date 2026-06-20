import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import EstadoBadge from '../common/EstadoBadge';
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

export default function Inventario({ categorias, onChanged, onError }) {
  const [productos, setProductos] = useState([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Todas');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [movFor, setMovFor] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      setProductos(await api.productos(q, cat));
    } catch (e) {
      onError(e.message);
    } finally {
      setLoading(false);
    }
  }, [q, cat, onError]);

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
        <input
          className="search"
          placeholder="🔍 Buscar producto..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option>Todas</option>
          {categorias.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button className="btn btn-primary" onClick={() => setEditing({ ...PRODUCTO_VACIO })}>
          + Nuevo producto
        </button>
      </div>

      {loading ? (
        <p className="muted">Cargando...</p>
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
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id} className={p.estado !== 'OK' ? 'row-alert' : ''}>
                  <td data-label="Producto" className="strong">
                    {p.producto}
                    {p.solicitable && (
                      <span className="tag-solic" title="Solicitable por ticket">
                        🎫
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
                    <button className="btn btn-sm btn-mov" onClick={() => setMovFor(p)}>
                      Mov.
                    </button>
                    <button className="btn btn-sm" onClick={() => setEditing(p)}>
                      Editar
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => borrar(p)}>
                      Borrar
                    </button>
                  </td>
                </tr>
              ))}
              {productos.length === 0 && (
                <tr>
                  <td colSpan={9} className="muted center">
                    Sin resultados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
