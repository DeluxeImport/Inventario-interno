import { useState, useEffect, useRef } from 'react';
import Icon from './common/Icon';
import { ICONOS } from './Sidebar';
import { rolLabel } from '../constants';

// Cuántas secciones se muestran directamente en la barra antes de plegar el
// resto tras el botón «Más». Cuatro + Más = cinco ranuras, el máximo cómodo
// en la pantalla de un teléfono.
const MAX_DIRECTAS = 4;

const iniciales = (nombre = '') =>
  nombre.trim().split(/\s+/).slice(0, 2).map((p) => p[0] || '').join('').toUpperCase() || '?';

/**
 * Navegación inferior para móvil (patrón de app nativa). Muestra las secciones
 * principales como pestañas; las que no entran caen en una hoja «Más» que
 * también contiene la cuenta y el cierre de sesión.
 *
 * Se oculta por CSS en escritorio, donde manda la barra lateral.
 */
export default function BottomNav({ user, tabs, activeView, stats, ticketsPend, onSelect, onLogout }) {
  const [masAbierto, setMasAbierto] = useState(false);
  const masBtnRef = useRef(null);
  const sheetRef = useRef(null);
  const alertasStock = (stats?.bajoMinimo || 0) + (stats?.agotados || 0);

  const directas = tabs.slice(0, MAX_DIRECTAS);
  const enMas = tabs.slice(MAX_DIRECTAS);
  const activoEnMas = enMas.some(([k]) => k === activeView);

  // Devuelve el foco al botón que abrió la hoja: el usuario de teclado no
  // queda «perdido» tras cerrarla.
  const cerrar = () => {
    setMasAbierto(false);
    masBtnRef.current?.focus();
  };

  // Al abrir, mover el foco al primer elemento de la hoja; cerrar con Escape y
  // atrapar el Tab dentro de la hoja mientras está abierta.
  useEffect(() => {
    if (!masAbierto) return;
    sheetRef.current?.querySelector('button')?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') return cerrar();
      if (e.key !== 'Tab') return;
      const foco = sheetRef.current?.querySelectorAll('button');
      if (!foco || foco.length === 0) return;
      const primero = foco[0];
      const ultimo = foco[foco.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [masAbierto]);

  const contadorDe = (k) => {
    if (k === 'dashboard' && alertasStock > 0) return { n: alertasStock, alerta: false };
    if (k === 'tickets' && ticketsPend > 0) return { n: ticketsPend, alerta: true };
    return null;
  };

  const elegir = (k) => {
    onSelect(k);
    setMasAbierto(false);
  };

  return (
    <>
      <nav className="bottom-nav" aria-label="Navegación principal">
        {directas.map(([k, label]) => {
          const c = contadorDe(k);
          return (
            <button
              key={k}
              className={'bnav-tab' + (activeView === k ? ' bnav-on' : '')}
              onClick={() => elegir(k)}
              aria-current={activeView === k ? 'page' : undefined}
            >
              <span className="bnav-ico">
                <Icon name={ICONOS[k]} size={20} />
                {c && <span className={'bnav-dot' + (c.alerta ? ' bnav-dot--alerta' : '')}>{c.n}</span>}
              </span>
              <span className="bnav-label">{label}</span>
            </button>
          );
        })}

        <button
          ref={masBtnRef}
          className={'bnav-tab' + (masAbierto || activoEnMas ? ' bnav-on' : '')}
          onClick={() => (masAbierto ? cerrar() : setMasAbierto(true))}
          aria-haspopup="dialog"
          aria-expanded={masAbierto}
        >
          <span className="bnav-ico">
            <Icon name="puntos" size={20} />
          </span>
          <span className="bnav-label">Más</span>
        </button>
      </nav>

      {masAbierto && (
        <div className="sheet-overlay" onClick={cerrar}>
          <div
            ref={sheetRef}
            className="sheet"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Más opciones"
          >
            <div className="sheet-grip" aria-hidden="true" />

            {enMas.length > 0 && (
              <div className="sheet-group">
                {enMas.map(([k, label]) => (
                  <button
                    key={k}
                    className={'sheet-item' + (activeView === k ? ' sheet-item--on' : '')}
                    onClick={() => elegir(k)}
                  >
                    <Icon name={ICONOS[k]} size={18} />
                    {label}
                  </button>
                ))}
              </div>
            )}

            <div className="sheet-user">
              <span className="avatar" aria-hidden="true">{iniciales(user.nombre)}</span>
              <div className="user-info">
                <strong>{user.nombre}</strong>
                <span>{rolLabel(user)}</span>
              </div>
            </div>
            <button className="sheet-item sheet-item--danger" onClick={onLogout}>
              <Icon name="salir" size={18} />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </>
  );
}
