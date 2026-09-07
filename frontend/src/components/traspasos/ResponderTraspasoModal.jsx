import { useState } from 'react';
import { api } from '../../api/client';
import { useConfirm } from '../../hooks/useConfirm';
import Icon from '../common/Icon';

export default function ResponderTraspasoModal({ traspaso, onClose, onDone, onError }) {
  const confirmar = useConfirm();
  const [motivo, setMotivo] = useState('');
  const [procesando, setProcesando] = useState(false);

  const responder = async (accion) => {
    if (accion === 'rechazar' && !motivo.trim()) {
      onError('Indica el motivo del rechazo.');
      return;
    }
    if (accion === 'aceptar') {
      const ok = await confirmar({
        title: `Confirmar recepción de ${traspaso.codigo}`,
        message: `Confirmas la recepción de ${traspaso.cantidad} de "${traspaso.producto}" desde ${traspaso.origenTienda}.`,
        confirmLabel: 'Confirmar recepción',
        danger: false,
      });
      if (!ok) return;
    }

    setProcesando(true);
    try {
      await api.accionTraspaso(traspaso.id, accion, { motivo });
      onDone();
    } catch (error) {
      onError(error.message);
      setProcesando(false);
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
          <h3>Responder {traspaso.codigo}</h3>
          <button className="icon-btn" onClick={onClose} title="Cerrar">
            <Icon name="cerrar" size={15} title="Cerrar" />
          </button>
        </div>
        <div className="form">
          <p className="traspaso-resumen">
            <strong>{traspaso.origenTienda}</strong> te envió{' '}
            <strong>
              {traspaso.cantidad}
            </strong>{' '}
            de «{traspaso.producto}» <span className="traspaso-codprod">{traspaso.codigoProducto}</span>.
          </p>

          {traspaso.fotoUrl && (
            <a href={traspaso.fotoUrl} target="_blank" rel="noopener noreferrer">
              <img src={traspaso.fotoUrl} alt="" className="traspaso-foto-preview" />
            </a>
          )}

          {traspaso.nota && (
            <p className="ticket-nota">
              <Icon name="nota" size={14} />
              {traspaso.nota}
            </p>
          )}

          <label>
            Motivo (obligatorio solo si rechazas)
            <textarea
              rows="2"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej. No tenemos ese producto disponible."
            />
          </label>

          <div className="modal-foot">
            <button
              className="btn btn-danger"
              disabled={procesando}
              onClick={() => responder('rechazar')}
            >
              Rechazar
            </button>
            <span className="proc-spacer" />
            <button
              className="btn btn-primary"
              disabled={procesando}
              onClick={() => responder('aceptar')}
            >
              Confirmar recepción
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
