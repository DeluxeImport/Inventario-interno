import { ESTADOS_TICKET } from './ticketConstants';

export default function EstadoTicket({ estado }) {
  const [clase, etiqueta] = ESTADOS_TICKET[estado] || ESTADOS_TICKET.PENDIENTE;

  return <span className={`badge badge-${clase}`}>{etiqueta}</span>;
}

