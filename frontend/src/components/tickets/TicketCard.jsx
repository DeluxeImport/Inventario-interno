import { fmtFechaCorta } from '../../lib/format';
import Icon from '../common/Icon';
import EstadoTicket from './EstadoTicket';

export default function TicketCard({ ticket, esAdmin, onProcesar }) {
  const procesable = ticket.estado === 'PENDIENTE' || ticket.estado === 'APROBADO';
  const origen = ticket.solicitante?.tienda || ticket.solicitante?.area;
  const esTienda = Boolean(ticket.solicitante?.tienda);
  const nombre = ticket.solicitante?.nombre;
  const mostrarNombre = nombre && nombre !== origen;

  return (
    <article className="ticket-card">
      <div className="ticket-top">
        <span className="ticket-cod">{ticket.codigo}</span>
        <span className="ticket-fecha">{fmtFechaCorta(ticket.createdAt)}</span>
      </div>

      <div>
        <div className="ticket-meta">
          {origen && (
            <span>
              <Icon name={esTienda ? 'tienda' : 'edificio'} size={14} />
              <strong>{origen}</strong>
            </span>
          )}
          {mostrarNombre && (
            <span>
              <Icon name="persona" size={14} />
              {nombre}
            </span>
          )}
          {ticket.area && (
            <span>
              <Icon name="etiqueta" size={14} />
              {ticket.area}
            </span>
          )}
        </div>

        <ul className="ticket-items">
          {ticket.items.map((item) => {
            const rechazado = item.cantidadAprobada === 0;
            const ajustada =
              !rechazado &&
              item.cantidadAprobada != null &&
              item.cantidadAprobada !== item.cantidad;

            return (
              <li key={item.id} className={rechazado ? 'ticket-item--rechazado' : undefined}>
                <span>{item.producto?.producto}</span>
                {rechazado ? (
                  <strong className="qty-rech">
                    <s>
                      {item.cantidad} {item.producto?.unidad}
                    </s>
                    <span className="badge badge-agotado">Rechazado</span>
                  </strong>
                ) : ajustada ? (
                  <strong className="qty-adj">
                    <s>{item.cantidad}</s>
                    <Icon name="volver" size={12} className="flip" />
                    {item.cantidadAprobada} {item.producto?.unidad}
                  </strong>
                ) : (
                  <strong>
                    {item.cantidad} {item.producto?.unidad}
                  </strong>
                )}
              </li>
            );
          })}
        </ul>

        {ticket.nota && (
          <p className="ticket-nota">
            <Icon name="nota" size={14} />
            {ticket.nota}
          </p>
        )}
        {ticket.observacionAdmin && (
          <p className="ticket-nota criterio">
            <Icon name="lista" size={14} />
            Criterio: {ticket.observacionAdmin}
          </p>
        )}
        {ticket.estado === 'RECHAZADO' && ticket.motivoRechazo && (
          <p className="ticket-nota rechazo">
            <Icon name="errorCirculo" size={14} />
            {ticket.motivoRechazo}
          </p>
        )}
        {ticket.atendidoPor && ticket.estado !== 'PENDIENTE' && (
          <p className="ticket-aten">Atendido por {ticket.atendidoPor.nombre}</p>
        )}
      </div>

      <div className="ticket-right">
        <EstadoTicket estado={ticket.estado} />
        {esAdmin && procesable && (
          <div className="ticket-actions">
            <button className="btn btn-sm btn-primary" onClick={() => onProcesar(ticket)}>
              Procesar
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

