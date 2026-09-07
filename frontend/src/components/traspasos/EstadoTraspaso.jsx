import { ESTADOS_TRASPASO } from './traspasoConstants';

export default function EstadoTraspaso({ estado }) {
  const [clase, etiqueta] = ESTADOS_TRASPASO[estado] || ESTADOS_TRASPASO.PENDIENTE;

  return <span className={`badge badge-${clase}`}>{etiqueta}</span>;
}
