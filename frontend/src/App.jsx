import { useState, useEffect, useCallback } from 'react';
import { api, getToken, clearToken, setOnUnauthorized } from './api/client';
import { puede, TABS } from './constants';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Icon from './components/common/Icon';
import Inventario from './components/inventario/Inventario';
import Movimientos from './components/movimientos/Movimientos';
import Tickets from './components/tickets/Tickets';
import Dashboard from './components/dashboard/Dashboard';
import Admin from './components/admin/Admin';
import Actualizaciones from './components/actualizaciones/Actualizaciones';
import Manual from './components/manual/Manual';

const TITULOS = {
  inventario: 'Inventario',
  movimientos: 'Movimientos',
  tickets: 'Solicitudes',
  dashboard: 'Dashboard',
  admin: 'Administración',
  actualizaciones: 'Actualizaciones',
  manual: 'Manual',
};

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

// Subtítulo de la barra de título: un dato útil sobre la vista, no un eslogan.
function subtitulo(view, { stats, ticketsPend }) {
  if (view === 'inventario' && stats)
    return `${plural(stats.totalProductos, 'producto', 'productos')} en ${plural(
      Object.keys(stats.porCategoria).length,
      'categoría',
      'categorías'
    )}`;
  if (view === 'dashboard' && stats) {
    const alertas = stats.bajoMinimo + stats.agotados;
    return alertas > 0
      ? `${plural(alertas, 'producto necesita', 'productos necesitan')} reposición`
      : 'Todo el stock está por encima del mínimo';
  }
  if (view === 'tickets')
    return ticketsPend > 0
      ? `${plural(ticketsPend, 'solicitud pendiente', 'solicitudes pendientes')} de procesar`
      : 'Sin solicitudes pendientes';
  if (view === 'movimientos') return 'Historial de entradas y salidas';
  if (view === 'admin') return 'Usuarios y bitácora de actividad';
  if (view === 'actualizaciones') return 'Novedades y cambios del sistema';
  if (view === 'manual') return 'Guía de uso descargable en PDF';
  return null;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [view, setView] = useState('inventario');
  const [categorias, setCategorias] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [ticketsPend, setTicketsPend] = useState(0);

  // Valida la sesión guardada al cargar.
  useEffect(() => {
    setOnUnauthorized(() => {
      setUser(null);
      setView('inventario');
    });
    if (!getToken()) {
      setChecking(false);
      return;
    }
    api
      .me()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setChecking(false));
  }, []);

  const refrescarGlobal = useCallback(() => {
    if (user && puede(user.rol, 'inventario')) api.categorias().then(setCategorias).catch(() => {});
    if (user && puede(user.rol, 'dashboard')) api.stats().then(setStats).catch(() => {});
    api
      .tickets('PENDIENTE')
      .then((t) => setTicketsPend(t.length))
      .catch(() => {});
    setRefreshKey((k) => k + 1);
  }, [user]);

  useEffect(() => {
    if (user) refrescarGlobal();
  }, [user, refrescarGlobal]);

  const onError = useCallback((msg) => {
    setError(msg);
    setTimeout(() => setError(''), 5000);
  }, []);

  const logout = () => {
    clearToken();
    setUser(null);
    setView('inventario');
  };

  if (checking) return <div className="checking">Cargando…</div>;
  if (!user) return <Login onLogin={setUser} />;

  const tabs = TABS.filter(([k]) => puede(user.rol, k));
  // Si la vista actual no está permitida para el rol, usa la primera permitida.
  const activeView = tabs.some(([k]) => k === view) ? view : tabs[0][0];

  const onSelect = (k) => {
    setView(k);
    if (k !== 'inventario' && k !== 'admin') refrescarGlobal();
  };

  const sub = subtitulo(activeView, { stats, ticketsPend });

  return (
    <div className="app">
      <Sidebar
        user={user}
        tabs={tabs}
        activeView={activeView}
        stats={stats}
        ticketsPend={ticketsPend}
        onSelect={onSelect}
        onLogout={logout}
      />

      <div className="content-area">
        <header className="titlebar">
          <div>
            <h2>{TITULOS[activeView]}</h2>
            {sub && <p>{sub}</p>}
          </div>
        </header>

        {error && (
          <div className="error-bar" role="alert">
            <Icon name="errorCirculo" size={14} />
            {error}
          </div>
        )}

        <main>
          {activeView === 'inventario' && (
            <Inventario categorias={categorias} onChanged={refrescarGlobal} onError={onError} />
          )}
          {activeView === 'movimientos' && (
            <Movimientos onError={onError} refreshKey={refreshKey} onChanged={refrescarGlobal} />
          )}
          {activeView === 'tickets' && (
            <Tickets user={user} onError={onError} onChanged={refrescarGlobal} />
          )}
          {activeView === 'dashboard' && <Dashboard stats={stats} />}
          {activeView === 'admin' && user.rol === 'admin' && (
            <Admin currentUser={user} onError={onError} />
          )}
          {activeView === 'actualizaciones' && <Actualizaciones />}
          {activeView === 'manual' && <Manual user={user} />}
        </main>
      </div>

      <BottomNav
        user={user}
        tabs={tabs}
        activeView={activeView}
        stats={stats}
        ticketsPend={ticketsPend}
        onSelect={onSelect}
        onLogout={logout}
      />
    </div>
  );
}
