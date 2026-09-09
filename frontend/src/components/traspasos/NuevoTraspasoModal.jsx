import { useEffect, useRef, useState } from 'react';
import { api } from '../../api/client';
import { useConfirm } from '../../hooks/useConfirm';
import Icon from '../common/Icon';

export default function NuevoTraspasoModal({ user, onClose, onSaved, onError }) {
  const confirmar = useConfirm();
  const [tiendas, setTiendas] = useState([]);
  const [destinoTienda, setDestinoTienda] = useState('');
  const [nota, setNota] = useState('');
  const [items, setItems] = useState([]);
  const [producto, setProducto] = useState('');
  const [codigoProducto, setCodigoProducto] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [progreso, setProgreso] = useState(null);

  useEffect(() => {
    api
      .tiendas()
      .then((lista) => setTiendas(lista.filter((t) => t.nombre !== user.tienda)))
      .catch((error) => onError(error.message));
  }, [user.tienda, onError]);

  // Revoca todos los object URL (del borrador y de los ítems ya agregados) al desmontar.
  // El ref siempre apunta al estado más reciente: con deps vacías, el cleanup de un
  // useEffect normal solo vería el estado inicial (vacío), no lo que hay al cerrar.
  const estadoRef = useRef();
  estadoRef.current = { fotoPreview, items };
  useEffect(
    () => () => {
      const { fotoPreview: fp, items: actuales } = estadoRef.current;
      if (fp) URL.revokeObjectURL(fp);
      actuales.forEach((item) => item.fotoPreview && URL.revokeObjectURL(item.fotoPreview));
    },
    []
  );

  const elegirFoto = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFoto(f);
    setFotoPreview(URL.createObjectURL(f));
  };

  const agregar = () => {
    if (!producto.trim() || !codigoProducto.trim() || !Number.isSafeInteger(Number(cantidad)) || Number(cantidad) < 1) {
      onError('Completa el producto, su código y la cantidad antes de agregarlo.');
      return;
    }
    setItems((actuales) => [
      ...actuales,
      {
        id: `${Date.now()}-${actuales.length}`,
        producto: producto.trim(),
        codigoProducto: codigoProducto.trim(),
        cantidad: Number(cantidad),
        foto,
        fotoPreview,
      },
    ]);
    setProducto('');
    setCodigoProducto('');
    setCantidad(1);
    setFoto(null);
    setFotoPreview('');
  };

  const quitar = (id) =>
    setItems((actuales) => {
      const item = actuales.find((i) => i.id === id);
      if (item?.fotoPreview) URL.revokeObjectURL(item.fotoPreview);
      return actuales.filter((i) => i.id !== id);
    });

  const guardar = async (e) => {
    e.preventDefault();
    if (enviando) return;
    if (!destinoTienda) return onError('Selecciona la tienda destino.');
    if (items.length === 0) return onError('Agrega al menos un producto al traspaso.');

    const ok = await confirmar({
      title: `Enviar a ${destinoTienda}`,
      message: `${items.length} producto(s). Al confirmar, cada uno quedará como Entregado, pendiente de recepción del destino.`,
      confirmLabel: 'Confirmar y enviar',
      danger: false,
    });
    if (!ok) return;

    setEnviando(true);
    const pendientes = [...items];
    const fallidos = [];
    for (let i = 0; i < pendientes.length; i++) {
      const item = pendientes[i];
      setProgreso({ actual: i + 1, total: pendientes.length });
      try {
        const traspaso = await api.crearTraspaso({
          destinoTienda,
          producto: item.producto,
          codigoProducto: item.codigoProducto,
          cantidad: item.cantidad,
          nota,
        });
        if (item.foto) {
          try {
            await api.subirFotoTraspaso(traspaso.id, item.foto);
          } catch (error) {
            onError(`"${item.producto}" se envió, pero su foto no se pudo subir: ${error.message}`);
          }
        }
      } catch (error) {
        fallidos.push(item);
        onError(`"${item.producto}": ${error.message}`);
      }
    }
    setEnviando(false);
    setProgreso(null);

    if (fallidos.length === 0) {
      onSaved();
    } else {
      // Deja en la canasta solo lo que falló, para que se pueda corregir y reintentar
      // sin perder ni tener que re-tipear lo que ya se envió bien.
      setItems(fallidos);
      onSaved();
    }
  };

  return (
    <div className="modal-overlay" onClick={() => !enviando && onClose()}>
      <div className="modal modal-wide" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h3>Nuevo traspaso</h3>
          <button className="icon-btn" onClick={onClose} disabled={enviando} title="Cerrar">
            <Icon name="cerrar" size={15} title="Cerrar" />
          </button>
        </div>
        <form className="form" onSubmit={guardar}>
          <fieldset className="form" disabled={enviando} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
            <div className="grid2">
              <label>
                Tienda destino
                <select value={destinoTienda} onChange={(e) => setDestinoTienda(e.target.value)} required>
                  <option value="" disabled>
                    Selecciona una tienda…
                  </option>
                  {tiendas.map((t) => (
                    <option key={t.nombre} value={t.nombre}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Nota para todo el envío (opcional)
                <input value={nota} onChange={(e) => setNota(e.target.value)} />
              </label>
            </div>

            <div className="add-producto">
              <div className="grid2">
                <label>
                  Producto
                  <input
                    value={producto}
                    onChange={(e) => setProducto(e.target.value)}
                    placeholder="Ej. Secadora de pelo"
                  />
                </label>
                <label>
                  Código de producto
                  <input
                    value={codigoProducto}
                    onChange={(e) => setCodigoProducto(e.target.value)}
                    placeholder="Ej. SKU-1234"
                  />
                </label>
              </div>
              <div className="add-row2">
                <div className="cant-field">
                  <span>Cant.</span>
                  <input
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    className="cant-input"
                  />
                </div>
                <label className="add-foto">
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={elegirFoto} />
                  {fotoPreview ? <img src={fotoPreview} alt="" className="cart-thumb" /> : <Icon name="camara" size={16} />}
                </label>
                <button type="button" className="btn btn-primary add-btn" onClick={agregar}>
                  <Icon name="mas" size={13} strokeWidth={2} />
                  Agregar al traspaso
                </button>
              </div>
            </div>

            {items.length > 0 && (
              <div className="cart">
                {items.map((item) => (
                  <div key={item.id} className="cart-row">
                    {item.fotoPreview && <img src={item.fotoPreview} alt="" className="cart-thumb" />}
                    <span className="cart-name">
                      <strong>{item.codigoProducto}</strong> · {item.producto}
                    </span>
                    <span className="cart-qty">{item.cantidad}</span>
                    <button
                      type="button"
                      className="icon-btn icon-btn--danger"
                      onClick={() => quitar(item.id)}
                      title={`Quitar ${item.producto}`}
                    >
                      <Icon name="cerrar" size={14} title={`Quitar ${item.producto}`} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="modal-foot">
              <button type="button" className="btn" disabled={enviando} onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={enviando || items.length === 0}>
                {enviando
                  ? `Enviando ${progreso?.actual ?? 1}/${progreso?.total ?? items.length}…`
                  : `Enviar traspaso${items.length > 1 ? `s (${items.length})` : ''}`}
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
