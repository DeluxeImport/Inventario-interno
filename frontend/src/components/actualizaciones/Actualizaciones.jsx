import { ACTUALIZACIONES } from '../../data/changelog';
import Icon from '../common/Icon';

const TIPO = {
  nuevo: ['badge-mov', 'Nuevo'],
  mejora: ['badge-ok', 'Mejora'],
  correccion: ['badge-bajo', 'Corrección'],
};

// Fecha larga y legible: "13 de julio de 2026".
const fmt = (iso) => {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export default function Actualizaciones() {
  return (
    <div className="novedades">
      <p className="novedades-intro">
        Cada mejora, novedad y corrección que hacemos al sistema queda registrada aquí, de la más
        reciente a la más antigua.
      </p>

      <ol className="timeline">
        {ACTUALIZACIONES.map((u, i) => {
          const [cls, label] = TIPO[u.tipo] || TIPO.mejora;
          return (
            <li key={u.version + i} className="tl-item">
              <span className="tl-punto" aria-hidden="true" />
              <div className="tl-card">
                <div className="tl-head">
                  <h3>{u.titulo}</h3>
                  <span className={`badge ${cls}`}>{label}</span>
                </div>
                <div className="tl-meta">
                  <span className="tl-version">v{u.version}</span>
                  <span>·</span>
                  <span>{fmt(u.fecha)}</span>
                </div>
                <ul className="tl-cambios">
                  {u.cambios.map((c, j) => (
                    <li key={j}>
                      <Icon name="check" size={14} />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
