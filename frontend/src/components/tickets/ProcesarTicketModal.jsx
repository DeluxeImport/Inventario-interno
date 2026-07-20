import { useState } from 'react';
import { api } from '../../api/client';
import Icon from '../common/Icon';

export default function ProcesarTicketModal({ ticket, onClose, onDone, onError }) {
  const [items, setItems] = useState(
    ticket.items.map((item) => ({
      id: item.id,
      producto: item.producto?.producto,
      unidad: item.producto?.unidad,
      solicitada: item.cantidad,
      cantidad: item.cantidadAprobada ?? item.cantidad,
    }))
  );
  const [observacion, setObservacion] = useState(ticket.observacionAdmin || '');
  const [procesando, setProcesando] = useState(false);

  const cambiarCantidad = (id, cantidad) =>
    setItems((actuales) =>
      actuales.map((item) => (item.id === id ? { ...item, cantidad } : item))
    );
  const todosRechazados = items.every((item) => Number(item.cantidad) === 0);

  const ejecutar = async (accion) => {
    if (accion === 'rechazar' && !observacion.trim()) {
      onError('Coloca una observación para rechazar la solicitud.');
      return;
    }
    if (accion === 'entregar' && todosRechazados) {
      onError('Todos los ítems están rechazados. Usa "Rechazar" para rechazar el ticket completo.');
      return;
    }
    if (
      accion === 'entregar' &&
      !window.confirm(`¿Entregar ${ticket.codigo}? Se descontará el stock con las cantidades indicadas.`)
    ) {
      return;
    }

    setProcesando(true);
    try {
      await api.accionTicket(ticket.id, accion, {
        observacion,
        items: items.map((item) => ({ id: item.id, cantidad: Number(item.cantidad) })),
      });
      onDone();
    } catch (error) {
      onError(error.message);
      setProcesando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h3>Procesar {ticket.codigo}</h3>
          <button className="icon-btn" onClick={onClose} title="Cerrar">
            <Icon name="cerrar" size={15} title="Cerrar" />
          </button>
        </div>
        <div className="form">
          <p className="muted">
            Ajusta la cantidad a entregar. Pon <strong>0</strong> o rechaza el ítem para no
            descontar stock de ese producto.
          </p>
          <div className="proc-items">
            {items.map((item) => {
              const rechazado = Number(item.cantidad) === 0;
              return (
                <div key={item.id} className={'proc-row' + (rechazado ? ' proc-row--rechazado' : '')}>
                  <span className="proc-name">{item.producto}</span>
                  <span className="proc-sol">
                    pidió {item.solicitada} {item.unidad}
                  </span>
                  {rechazado ? (
                    <span className="proc-rechazado">Rechazado</span>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      value={item.cantidad}
                      onChange={(event) => cambiarCantidad(item.id, event.target.value)}
                      className="cant-input"
                      aria-label={`Cantidad de ${item.producto}`}
                    />
                  )}
                  <span className="proc-uni">{item.unidad}</span>
                  {rechazado ? (
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => cambiarCantidad(item.id, item.solicitada)}
                    >
                      Restaurar
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="icon-btn icon-btn--danger"
                      onClick={() => cambiarCantidad(item.id, 0)}
                      title={`Rechazar ${item.producto}`}
                    >
                      <Icon name="prohibido" size={15} title={`Rechazar ${item.producto}`} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <label>
            Observación / criterio
            <textarea
              rows="3"
              value={observacion}
              onChange={(event) => setObservacion(event.target.value)}
              placeholder="Ej. Se rechazan las bolsas pequeñas porque no hay stock disponible."
            />
          </label>
          <div className="modal-foot proc-foot">
            <button className="btn btn-danger" disabled={procesando} onClick={() => ejecutar('rechazar')}>
              Rechazar
            </button>
            <span className="proc-spacer" />
            <button className="btn" disabled={procesando} onClick={() => ejecutar('aprobar')}>
              Aprobar
            </button>
            <button
              className="btn btn-ok"
              disabled={procesando || todosRechazados}
              onClick={() => ejecutar('entregar')}
            >
              Entregar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

