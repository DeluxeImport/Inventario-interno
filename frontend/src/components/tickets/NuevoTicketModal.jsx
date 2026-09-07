import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';
import Icon from '../common/Icon';
import ProductSearch from './ProductSearch';
import { useConfirm } from '../../hooks/useConfirm';

export default function NuevoTicketModal({ onClose, onSaved, onError }) {
  const confirmar = useConfirm();
  const [guardando, setGuardando] = useState(false);
  const [solicitables, setSolicitables] = useState([]);
  const [area, setArea] = useState('');
  const [nota, setNota] = useState('');
  const [items, setItems] = useState([]);
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const seleccionarProducto = useCallback((id) => setProductoId(id), []);

  useEffect(() => {
    api.solicitables().then(setSolicitables).catch((error) => onError(error.message));
  }, [onError]);

  const productoActual = solicitables.find((producto) => producto.id === Number(productoId));

  const agregar = () => {
    if (!productoActual || !Number.isSafeInteger(Number(cantidad)) || Number(cantidad) < 1) return;

    setItems((actuales) => {
      const existente = actuales.find((item) => item.productoId === productoActual.id);
      if (existente) {
        return actuales.map((item) =>
          item.productoId === productoActual.id
            ? { ...item, cantidad: item.cantidad + Number(cantidad) }
            : item
        );
      }

      return [
        ...actuales,
        {
          productoId: productoActual.id,
          producto: productoActual.producto,
          unidad: productoActual.unidad,
          cantidad: Number(cantidad),
        },
      ];
    });
    setProductoId('');
    setCantidad(1);
  };

  const quitar = (id) => setItems((actuales) => actuales.filter((item) => item.productoId !== id));

  const guardar = async (event) => {
    event.preventDefault();
    if (guardando) return;
    if (items.length === 0) return onError('Agrega al menos un producto.');
    setGuardando(true);
    const ok = await confirmar({
      title: 'Confirmar pedido',
      message: items.map((item) => `${item.producto}: ${item.cantidad}`).join(' · '),
      confirmLabel: 'Confirmar y enviar',
      danger: false,
    });
    if (!ok) { setGuardando(false); return; }

    try {
      await api.crearTicket({
        area,
        nota,
        items: items.map((item) => ({ productoId: item.productoId, cantidad: item.cantidad })),
      });
      onSaved();
    } catch (error) {
      onError(error.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => !guardando && onClose()}>
      <div className="modal modal-wide" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h3>Nueva solicitud</h3>
          <button className="icon-btn" onClick={onClose} disabled={guardando} title="Cerrar">
            <Icon name="cerrar" size={15} title="Cerrar" />
          </button>
        </div>
        <form className="form" onSubmit={guardar}>
          <fieldset className="form" disabled={guardando} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
          <div className="grid2">
            <label>
              Motivo
              <input
                value={area}
                onChange={(event) => setArea(event.target.value)}
                placeholder="Ej. Reposición de stock"
              />
            </label>
            <label>
              Nota (opcional)
              <input value={nota} onChange={(event) => setNota(event.target.value)} />
            </label>
          </div>

          {solicitables.length === 0 ? (
            <p className="muted">
              No hay productos habilitados para solicitud. Un administrador debe marcarlos como
              «Solicitable» en el inventario.
            </p>
          ) : (
            <div className="add-producto">
              <ProductSearch
                productos={solicitables}
                productoId={productoId}
                onSelect={seleccionarProducto}
              />
              <div className="add-row2">
                <div className="cant-field">
                  <span>Cant.</span>
                  <input
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={(event) => setCantidad(event.target.value)}
                    className="cant-input"
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-primary add-btn"
                  onClick={agregar}
                  disabled={!productoId}
                >
                  <Icon name="mas" size={13} strokeWidth={2} />
                  Agregar a la canasta
                </button>
              </div>
            </div>
          )}

          {items.length > 0 && (
            <div className="cart">
              <h4>Canasta del pedido · {items.length} productos</h4>
              <p className="muted">Revisa los productos y cantidades antes de enviar.</p>
              {items.map((item) => (
                <div key={item.productoId} className="cart-row">
                  <span className="cart-name">{item.producto}</span>
                  <span className="cart-qty">
                    {item.cantidad} {item.unidad}
                  </span>
                  <button
                    type="button"
                    className="icon-btn icon-btn--danger"
                    onClick={() => quitar(item.productoId)}
                    title={`Quitar ${item.producto}`}
                  >
                    <Icon name="cerrar" size={14} title={`Quitar ${item.producto}`} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="modal-foot">
            <button type="button" className="btn" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={items.length === 0}>
              {guardando ? 'Confirmando…' : 'Revisar y enviar solicitud'}
            </button>
          </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
}

