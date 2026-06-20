import { useState } from 'react';
import { rolLabel, APP_NAME } from '../constants';

export default function Header({ user, tabs, activeView, stats, ticketsPend, onSelect, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSelect = (k) => {
    onSelect(k);
    setMenuOpen(false);
  };

  return (
    <header>
      <div className="brand">
        <span className="logo">📦</span>
        <div>
          <h1>{APP_NAME}</h1>
          <p>Control interno de productos</p>
        </div>
      </div>
      <button
        className={`hamburger ${menuOpen ? 'active' : ''}`}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Menú"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      <nav className={menuOpen ? 'open' : ''}>
        {tabs.map(([k, label]) => (
          <button key={k} className={activeView === k ? 'nav-on' : ''} onClick={() => handleSelect(k)}>
            {label}
            {k === 'dashboard' && stats?.bajoMinimo + stats?.agotados > 0 && (
              <span className="dot">{stats.bajoMinimo + stats.agotados}</span>
            )}
            {k === 'tickets' && ticketsPend > 0 && <span className="dot">{ticketsPend}</span>}
          </button>
        ))}
      </nav>
      <div className="user-box">
        <div className="user-info">
          <strong>{user.nombre}</strong>
          <span>{rolLabel(user)}</span>
        </div>
        <button className="btn btn-sm" onClick={onLogout} title="Cerrar sesión">
          Salir
        </button>
      </div>
    </header>
  );
}
