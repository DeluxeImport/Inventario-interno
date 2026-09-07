import { useEffect, useState } from 'react';
import { fmtFecha } from '../../lib/format';
import { api } from '../../api/client';
import Icon from '../common/Icon';
import { ESTADOS_TRASPASO } from './traspasoConstants';

// Una fila de detalle con su botón de copiar. Aislar el estado "copiado" (para
// el check momentáneo) por fila evita que copiar un campo afecte el ícono de
// los demás.
function Fila({ etiqueta, valor }) {
  const [copiado, setCopiado] = useState(false);
  if (!valor) return null;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(String(valor));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1200);
    } catch {
      // Portapapeles no disponible (permiso denegado, contexto no seguro, etc.):
      // no rompemos el flujo, el usuario puede seleccionar el texto a mano.
    }
  };

  return (
    <div className="detalle-fila">
      <span className="detalle-etiqueta">{etiqueta}</span>
      <span className="detalle-valor">{valor}</span>
      <button
        type="button"
        className="icon-btn detalle-copiar"
        onClick={copiar}
        title={`Copiar ${etiqueta.toLowerCase()}`}
      >
        <Icon name={copiado ? 'check' : 'portapapeles'} size={14} title="Copiar" />
      </button>
    </div>
  );
}

export default function DetalleTraspasoModal({ traspaso, onClose, onError, onUpdated }) {
  const [copiadoErp, setCopiadoErp] = useState(traspaso.copiadoErp);
  const [guardando, setGuardando] = useState(false);
  const [observacion, setObservacion] = useState('');
  const [historial, setHistorial] = useState([]);
  useEffect(() => {
    api.historialErpTraspaso(traspaso.id).then(setHistorial).catch((error) => onError(error.message));
  }, [traspaso.id, onError]);

  const toggleCopiado = async (checked) => {
    const anterior = copiadoErp;
    setCopiadoErp(checked);
    setGuardando(true);
    try {
      await api.marcarCopiadoTraspaso(traspaso.id, checked, observacion);
      setObservacion('');
      api.historialErpTraspaso(traspaso.id).then(setHistorial).catch((error) => onError(error.message));
      onUpdated?.();
    } catch (error) {
      setCopiadoErp(anterior);
      onError(error.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-head">
          <h3>Detalles de {traspaso.codigo}</h3>
          <button className="icon-btn" onClick={onClose} title="Cerrar">
            <Icon name="cerrar" size={15} title="Cerrar" />
          </button>
        </div>

        <div className="form">
          <p className="muted">
            Copia cada dato para registrarlo en el sistema real. Ningún campo se envía a ningún
            lado: solo se copian al portapapeles.
          </p>

          <div className="detalle-lista">
            <Fila etiqueta="Código" valor={traspaso.codigo} />
            <Fila etiqueta="Tienda origen" valor={traspaso.origenTienda} />
            <Fila etiqueta="Tienda destino" valor={traspaso.destinoTienda} />
            <Fila etiqueta="Producto" valor={traspaso.producto} />
            <Fila etiqueta="Código de producto" valor={traspaso.codigoProducto} />
            <Fila etiqueta="Cantidad" valor={traspaso.cantidad} />
            <Fila etiqueta="Nota" valor={traspaso.nota} />
            <Fila etiqueta="Estado" valor={ESTADOS_TRASPASO[traspaso.estado]?.[1] || traspaso.estado} />
            <Fila etiqueta="Solicitado por" valor={traspaso.solicitante?.nombre} />
            <Fila etiqueta="Atendido por" valor={traspaso.atendidoPor?.nombre} />
            <Fila etiqueta="Motivo de rechazo" valor={traspaso.motivoRechazo} />
            <Fila etiqueta="Fecha" valor={fmtFecha(traspaso.createdAt)} />
          </div>

          {traspaso.fotoUrl && (
            <a href={traspaso.fotoUrl} target="_blank" rel="noopener noreferrer">
              <img src={traspaso.fotoUrl} alt="" className="traspaso-foto-preview" />
            </a>
          )}

          <label className="check-row">
            <input
              type="checkbox"
              checked={copiadoErp}
              disabled={guardando}
              onChange={(e) => setCopiadoErp(e.target.checked)}
            />
            <span>
              <span>Ya lo pasé al sistema real</span>
              <small>Marca manual compartida. Confirma el registro en el sistema real antes de marcar; no cambia la recepción entre tiendas.</small>
            </span>
          </label>

          <label>
            Observación del registro en el ERP
            <textarea value={observacion} onChange={(e) => setObservacion(e.target.value)} maxLength={1000} disabled={guardando}
              placeholder="Motivo por el que no se subió, número del documento o corrección de una marca olvidada" />
          </label>
          <button type="button" className="btn btn-primary" disabled={guardando} onClick={() => toggleCopiado(copiadoErp)}>
            {guardando ? 'Guardando…' : 'Guardar revisión del ERP'}
          </button>
          {historial.length > 0 && <section aria-label="Historial de revisión del ERP">
            <h4>Últimas revisiones del ERP</h4>
            {historial.map((revision) => <p key={revision.id}>{revision.detalle}<br /><small>{revision.usuario.nombre} · {fmtFecha(revision.fecha)}</small></p>)}
          </section>}
          <div className="modal-foot">
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Listo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
