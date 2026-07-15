const MAP = {
  OK: ['ok', 'Suficiente'],
  BAJO: ['bajo', 'Stock bajo'],
  AGOTADO: ['agotado', 'Agotado'],
};

export default function EstadoBadge({ estado }) {
  const [cls, label] = MAP[estado] || MAP.OK;
  return <span className={`badge badge-${cls}`}>{label}</span>;
}
