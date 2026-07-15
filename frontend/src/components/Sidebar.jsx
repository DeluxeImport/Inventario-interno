import Icon from './common/Icon';
import { rolLabel, APP_NAME } from '../constants';

// Icono de cada sección. Mantener sincronizado con TABS en constants.js.
// Exportado para que la barra inferior móvil use los mismos iconos.
export const ICONOS = {
  inventario: 'caja',
  movimientos: 'transfer',
  tickets: 'ticket',
  dashboard: 'grafico',
  admin: 'personas',
  actualizaciones: 'megafono',
  manual: 'libro',
};

// La barra lateral agrupa las secciones por naturaleza: el trabajo diario
// arriba, la configuración del sistema, y la ayuda al final.
const GRUPO = (k) => {
  if (k === 'admin') return 'Sistema';
  if (k === 'actualizaciones' || k === 'manual') return 'Ayuda';
  return 'Almacén';
};

const iniciales = (nombre = '') =>
  nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] || '')
    .join('')
    .toUpperCase() || '?';

export default function Sidebar({ user, tabs, activeView, stats, ticketsPend, onSelect, onLogout }) {
  const alertasStock = (stats?.bajoMinimo || 0) + (stats?.agotados || 0);
  const grupos = [];
  for (const tab of tabs) {
    const nombre = GRUPO(tab[0]);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo?.nombre === nombre) ultimo.tabs.push(tab);
    else grupos.push({ nombre, tabs: [tab] });
  }
  // Con un solo grupo el encabezado no aporta información: se omite.
  const mostrarTitulos = grupos.length > 1;

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="logo">
          <Icon name="caja" size={16} strokeWidth={1.8} />
        </span>
        <div>
          <h1>{APP_NAME}</h1>
          <p>Control interno</p>
        </div>
      </div>

      {grupos.map((g) => (
        <nav key={g.nombre} aria-label={g.nombre}>
          {mostrarTitulos && <div className="nav-title">{g.nombre}</div>}
          {g.tabs.map(([k, label]) => (
            <button
              key={k}
              className={activeView === k ? 'nav-on' : ''}
              onClick={() => onSelect(k)}
              aria-current={activeView === k ? 'page' : undefined}
              // El nombre accesible sobrevive aunque la etiqueta se oculte en móvil.
              title={label}
              aria-label={label}
            >
              <Icon name={ICONOS[k]} size={16} />
              <span className="nav-label">{label}</span>
              {k === 'dashboard' && alertasStock > 0 && <span className="dot">{alertasStock}</span>}
              {k === 'tickets' && ticketsPend > 0 && (
                <span className="dot dot--alerta">{ticketsPend}</span>
              )}
            </button>
          ))}
        </nav>
      ))}

      <div className="sidebar-foot">
        <div className="user-box">
          <span className="avatar" aria-hidden="true">
            {iniciales(user.nombre)}
          </span>
          <div className="user-info">
            <strong>{user.nombre}</strong>
            <span>{rolLabel(user)}</span>
          </div>
          <button className="icon-btn" onClick={onLogout} title="Cerrar sesión">
            <Icon name="salir" size={15} title="Cerrar sesión" />
          </button>
        </div>
      </div>
    </aside>
  );
}
