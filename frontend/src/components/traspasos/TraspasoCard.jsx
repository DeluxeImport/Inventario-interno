import { fmtFechaCorta } from '../../lib/format';
import Icon from '../common/Icon';
import EstadoTraspaso from './EstadoTraspaso';

export default function TraspasoCard({
  traspaso,
  esAlmacen,
  tiendaUsuario,
  onResponder,
  onCancelar,
  onDetalle,
}) {
  const pendiente = traspaso.estado === 'PENDIENTE';
  const esOrigen = Boolean(tiendaUsuario) && tiendaUsuario === traspaso.origenTienda;
  const esDestino = Boolean(tiendaUsuario) && tiendaUsuario === traspaso.destinoTienda;
  // Admin/almacén nunca responde ni cancela en nombre de una tienda: solo mira
  // y usa el botón de Detalles para copiar al ERP real.
  const puedeResponder = pendiente && esDestino;
  const puedeCancelar = pendiente && esOrigen;

  return (
    <article className="ticket-card traspaso-card">
      <div className="ticket-top">
        <span className="ticket-cod">{traspaso.codigo}</span>
        <span className="ticket-fecha">{fmtFechaCorta(traspaso.createdAt)}</span>
      </div>

      <div>
        <div className="ticket-meta traspaso-ruta">
          <span>
            <Icon name="tienda" size={14} />
            <strong>{traspaso.origenTienda}</strong>
          </span>
          <Icon name="flecha" size={13} />
          <span>
            <Icon name="tienda" size={14} />
            <strong>{traspaso.destinoTienda}</strong>
          </span>
        </div>

        <p className="traspaso-producto">
          <span className="traspaso-codprod">{traspaso.codigoProducto}</span>
          {traspaso.producto}
          <span className="traspaso-cant">
            {traspaso.cantidad}
          </span>
        </p>

        {traspaso.fotoUrl && (
          <a
            href={traspaso.fotoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="traspaso-foto"
          >
            <img src={traspaso.fotoUrl} alt={`Foto de ${traspaso.producto}`} />
          </a>
        )}

        {traspaso.nota && (
          <p className="ticket-nota">
            <Icon name="nota" size={14} />
            {traspaso.nota}
          </p>
        )}
        {traspaso.estado === 'RECHAZADO' && traspaso.motivoRechazo && (
          <p className="ticket-nota rechazo">
            <Icon name="errorCirculo" size={14} />
            {traspaso.motivoRechazo}
          </p>
        )}
        {traspaso.atendidoPor && !pendiente && (
          <p className="ticket-aten">Atendido por {traspaso.atendidoPor.nombre}</p>
        )}
      </div>

      <div className="ticket-right">
        <EstadoTraspaso estado={traspaso.estado} />
        <small>{traspaso.copiadoErp ? 'Marcado como subido al sistema real' : 'Sin marcar en el sistema real'}</small>
        {(puedeResponder || puedeCancelar) && (
          <div className="ticket-actions">
            {puedeCancelar && (
              <button className="btn btn-sm" onClick={() => onCancelar(traspaso)}>
                Cancelar
              </button>
            )}
            {puedeResponder && (
              <button className="btn btn-sm btn-primary" onClick={() => onResponder(traspaso)}>
                Responder
              </button>
            )}
          </div>
        )}
        {esAlmacen && onDetalle && (
          <button className="btn btn-primary traspaso-detalle-btn" onClick={() => onDetalle(traspaso)}>
            <Icon name="portapapeles" size={13} />
            Detalles
            {traspaso.copiadoErp && <Icon name="check" size={13} className="traspaso-copiado-ok" />}
          </button>
        )}
      </div>
    </article>
  );
}
