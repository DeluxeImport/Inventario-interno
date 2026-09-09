import { Fragment, useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';
import { fmtFecha } from '../../lib/format';
import Icon from '../common/Icon';
import NuevaCompraModal from './NuevaCompraModal';

export default function Compras({ onError, onChanged }) {
  const [compras, setCompras] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [nueva, setNueva] = useState(false);
  const [expandida, setExpandida] = useState(null);

  const cargar = useCallback(() => {
    api
      .compras({ desde: desde || undefined, hasta: hasta || undefined })
      .then((page) => {
        setCompras(page.items);
        setNextCursor(page.nextCursor);
      })
      .catch((e) => onError(e.message));
  }, [desde, hasta, onError]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cargarMas = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await api.compras({ desde: desde || undefined, hasta: hasta || undefined, cursor: nextCursor });
      setCompras((actuales) => [...actuales, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch (e) {
      onError(e.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const limpiar = () => {
    setDesde('');
    setHasta('');
  };

  const totalListado = compras.reduce((acc, c) => acc + c.total, 0);

  return (
    <div>
      <div className="toolbar">
        <div className="filtro">
          <span>Desde</span>
          <input type="date" value={desde} max={hasta || undefined} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div className="filtro">
          <span>Hasta</span>
          <input type="date" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)} />
        </div>
        {(desde || hasta) && (
          <button className="btn btn-sm" onClick={limpiar}>
            Limpiar
          </button>
        )}
        <span className="toolbar-count">
          {compras.length}
          {nextCursor ? '+' : ''} compra{compras.length === 1 ? '' : 's'} · S/ {totalListado.toFixed(2)}
        </span>
        <button className="btn btn-primary" onClick={() => setNueva(true)}>
          <Icon name="mas" size={13} strokeWidth={2} />
          Nueva compra
        </button>
      </div>

      {compras.length === 0 ? (
        <p className="vacio">Aún no hay compras registradas.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Proveedor</th>
                <th>Fecha</th>
                <th>Comprobante</th>
                <th className="num">Productos</th>
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {compras.map((c) => (
                <Fragment key={c.id}>
                  <tr
                    className="fila-expandible"
                    onClick={() => setExpandida(expandida === c.id ? null : c.id)}
                  >
                    <td>
                      <Icon name="flecha" size={12} className={expandida === c.id ? 'rot90' : ''} />
                    </td>
                    <td data-label="Proveedor" className="strong">{c.proveedor}</td>
                    <td data-label="Fecha">{fmtFecha(c.fecha)}</td>
                    <td data-label="Comprobante">{c.comprobante || '—'}</td>
                    <td data-label="Productos" className="num">{c.movimientos.length}</td>
                    <td data-label="Total" className="num strong">S/ {c.total.toFixed(2)}</td>
                  </tr>
                  {expandida === c.id && (
                    <tr className="fila-detalle">
                      <td colSpan={6}>
                        <div className="compra-detalle">
                          {c.observacion && <p className="muted">{c.observacion}</p>}
                          <table>
                            <thead>
                              <tr>
                                <th>Producto</th>
                                <th className="num">Cantidad</th>
                                <th className="num">P. unitario</th>
                                <th className="num">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {c.movimientos.map((m) => (
                                <tr key={m.id}>
                                  <td>{m.producto?.producto}</td>
                                  <td className="num">{m.cantidad} {m.producto?.unidad}</td>
                                  <td className="num">S/ {(m.precioUnitario ?? 0).toFixed(2)}</td>
                                  <td className="num">S/ {(m.cantidad * (m.precioUnitario ?? 0)).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {nextCursor && (
        <div className="center" style={{ padding: '12px' }}>
          <button className="btn btn-sm" onClick={cargarMas} disabled={loadingMore}>
            {loadingMore ? 'Cargando…' : 'Cargar más'}
          </button>
        </div>
      )}

      {nueva && (
        <NuevaCompraModal
          onClose={() => setNueva(false)}
          onSaved={() => {
            setNueva(false);
            cargar();
            onChanged?.();
          }}
          onError={onError}
        />
      )}
    </div>
  );
}
