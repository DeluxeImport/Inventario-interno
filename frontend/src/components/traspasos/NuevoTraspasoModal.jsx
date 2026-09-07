import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import Icon from '../common/Icon';

export default function NuevoTraspasoModal({ user, onClose, onSaved, onError }) {
  const [tiendas, setTiendas] = useState([]);
  const [destinoTienda, setDestinoTienda] = useState('');
  const [producto, setProducto] = useState('');
  const [codigoProducto, setCodigoProducto] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [revisando, setRevisando] = useState(false);
  const [nota, setNota] = useState('');
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api
      .tiendas()
      .then((lista) => setTiendas(lista.filter((t) => t.nombre !== user.tienda)))
      .catch((error) => onError(error.message));
  }, [user.tienda, onError]);

  // Revoca el object URL anterior al elegir otra foto o al desmontar (evita fugas de memoria).
  useEffect(() => () => fotoPreview && URL.revokeObjectURL(fotoPreview), [fotoPreview]);

  const elegirFoto = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFoto(f);
    setFotoPreview(URL.createObjectURL(f));
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!destinoTienda || !producto.trim() || !codigoProducto.trim() || Number(cantidad) < 1) {
      onError('Completa la tienda destino, el producto, su código y la cantidad.');
      return;
    }
    if (!revisando) { setRevisando(true); return; }
    if (guardando) return;
    setGuardando(true);
    try {
      const traspaso = await api.crearTraspaso({
        destinoTienda,
        producto,
        codigoProducto,
        cantidad: Number(cantidad),
        nota,
      });
      if (foto) {
        try {
          await api.subirFotoTraspaso(traspaso.id, foto);
        } catch (error) {
          // El traspaso ya se creó; que falle la foto no debe verse como un fallo total.
          onError(`Traspaso creado, pero la foto no se pudo subir: ${error.message}`);
        }
      }
      onSaved();
    } catch (error) {
      onError(error.message);
      setGuardando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => !guardando && onClose()}>
      <div
        className="modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-head">
          <h3>Nuevo traspaso</h3>
          <button className="icon-btn" onClick={onClose} disabled={guardando} title="Cerrar">
            <Icon name="cerrar" size={15} title="Cerrar" />
          </button>
        </div>
        <form className="form" onSubmit={guardar}>
          <fieldset disabled={guardando || revisando} hidden={revisando} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }} className="form">
          <label>
            Tienda destino
            <select
              value={destinoTienda}
              onChange={(e) => setDestinoTienda(e.target.value)}
              required
            >
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

          <div className="grid2">
            <label>
              Producto
              <input
                value={producto}
                onChange={(e) => setProducto(e.target.value)}
                placeholder="Ej. Secadora de pelo"
                required
              />
            </label>
            <label>
              Código de producto
              <input
                value={codigoProducto}
                onChange={(e) => setCodigoProducto(e.target.value)}
                placeholder="Ej. SKU-1234"
                required
              />
            </label>
          </div>

          <div className="grid2">
            <label>
              Cantidad
              <input
                type="number"
                min="1"
                step="1"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                required
              />
            </label>
          </div>

          <label>
            Nota (opcional)
            <textarea rows="2" value={nota} onChange={(e) => setNota(e.target.value)} />
          </label>

          <label>
            Foto (opcional)
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={elegirFoto} />
          </label>
          {fotoPreview && <img src={fotoPreview} alt="" className="traspaso-foto-preview" />}

          </fieldset>
          {revisando && (
            <section className="cart" aria-label="Canasta del traspaso">
              <h4>Revisa tu traspaso</h4>
              <p>{user.tienda} → {destinoTienda}</p>
              <p><strong>{codigoProducto} · {producto}</strong> — Cantidad: {cantidad}</p>
              {nota && <p>{nota}</p>}
              {fotoPreview && <img src={fotoPreview} alt="Producto a enviar" className="traspaso-foto-preview" />}
              <p>Al confirmar quedará como Entregado, pendiente de recepción del destino.</p>
              <button type="button" className="btn" disabled={guardando} onClick={() => setRevisando(false)}>Editar</button>
            </section>
          )}
          <div className="modal-foot">
            <button type="button" className="btn" disabled={guardando} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? 'Enviando…' : revisando ? 'Confirmar y enviar' : 'Revisar traspaso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
