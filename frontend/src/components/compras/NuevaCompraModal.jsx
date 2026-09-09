import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';
import Icon from '../common/Icon';
import ProductSearch from '../tickets/ProductSearch';
import { useConfirm } from '../../hooks/useConfirm';

export default function NuevaCompraModal({ onClose, onSaved, onError }) {
  const confirmar = useConfirm();
  const [guardando, setGuardando] = useState(false);
  const [productos, setProductos] = useState([]);
  const [proveedor, setProveedor] = useState('');
  const [comprobante, setComprobante] = useState('');
  const [observacion, setObservacion] = useState('');
  const [items, setItems] = useState([]);
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [precioUnitario, setPrecioUnitario] = useState('');
  const seleccionarProducto = useCallback((id) => setProductoId(id), []);

  useEffect(() => {
    api.productosLista().then(setProductos).catch((error) => onError(error.message));
  }, [onError]);

  const productoActual = productos.find((p) => p.id === Number(productoId));
  const precioValido = precioUnitario !== '' && Number(precioUnitario) >= 0;
  const total = items.reduce((acc, it) => acc + it.cantidad * it.precioUnitario, 0);

  const agregar = () => {
    if (!productoActual || !Number.isSafeInteger(Number(cantidad)) || Number(cantidad) < 1 || !precioValido) return;

    setItems((actuales) => {
      const existente = actuales.find((item) => item.productoId === productoActual.id);
      if (existente) {
        return actuales.map((item) =>
          item.productoId === productoActual.id
            ? { ...item, cantidad: item.cantidad + Number(cantidad), precioUnitario: Number(precioUnitario) }
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
          precioUnitario: Number(precioUnitario),
        },
      ];
    });
    setProductoId('');
    setCantidad(1);
    setPrecioUnitario('');
  };

  const quitar = (id) => setItems((actuales) => actuales.filter((item) => item.productoId !== id));

  const guardar = async (event) => {
    event.preventDefault();
    if (guardando) return;
    if (!proveedor.trim()) return onError('Ingresa el proveedor.');
    if (items.length === 0) return onError('Agrega al menos un producto.');
    setGuardando(true);
    const ok = await confirmar({
      title: `Confirmar compra a ${proveedor}`,
      message: `${items.length} producto(s) · Total S/ ${total.toFixed(2)}`,
      confirmLabel: 'Confirmar y registrar',
      danger: false,
    });
    if (!ok) { setGuardando(false); return; }

    try {
      await api.crearCompra({
        proveedor,
        comprobante,
        observacion,
        items: items.map((item) => ({
          productoId: item.productoId,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
        })),
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
          <h3>Nueva compra</h3>
          <button className="icon-btn" onClick={onClose} disabled={guardando} title="Cerrar">
            <Icon name="cerrar" size={15} title="Cerrar" />
          </button>
        </div>
        <form className="form" onSubmit={guardar}>
          <fieldset className="form" disabled={guardando} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
            <div className="grid2">
              <label>
                Proveedor
                <input
                  value={proveedor}
                  onChange={(event) => setProveedor(event.target.value)}
                  placeholder="Ej. Distribuidora XYZ"
                  required
                />
              </label>
              <label>
                Comprobante (opcional)
                <input
                  value={comprobante}
                  onChange={(event) => setComprobante(event.target.value)}
                  placeholder="Ej. F001-0001234"
                />
              </label>
            </div>
            <label>
              Observación (opcional)
              <input value={observacion} onChange={(event) => setObservacion(event.target.value)} />
            </label>

            <div className="add-producto">
              <ProductSearch productos={productos} productoId={productoId} onSelect={seleccionarProducto} />
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
                <div className="cant-field">
                  <span>P. unitario (S/)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={precioUnitario}
                    onChange={(event) => setPrecioUnitario(event.target.value)}
                    className="cant-input"
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-primary add-btn"
                  onClick={agregar}
                  disabled={!productoId || !precioValido}
                >
                  <Icon name="mas" size={13} strokeWidth={2} />
                  Agregar a la compra
                </button>
              </div>
            </div>

            {items.length > 0 && (
              <div className="cart">
                {items.map((item) => (
                  <div key={item.productoId} className="cart-row">
                    <span className="cart-name">{item.producto}</span>
                    <span className="cart-qty">{item.cantidad} {item.unidad}</span>
                    <span className="cart-price">S/ {(item.cantidad * item.precioUnitario).toFixed(2)}</span>
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
                <div className="compra-total">
                  <span>Total</span>
                  <span>S/ {total.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="modal-foot">
              <button type="button" className="btn" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={items.length === 0}>
                {guardando ? 'Registrando…' : 'Registrar compra'}
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
