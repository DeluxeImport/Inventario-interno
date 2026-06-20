import { useState, useEffect, useCallback } from 'react';
import { api, getToken, clearToken, setOnUnauthorized } from './api/client';
import { puede, TABS } from './constants';
import Login from './components/Login';
import Header from './components/Header';
import Inventario from './components/inventario/Inventario';
import Movimientos from './components/movimientos/Movimientos';
import Tickets from './components/tickets/Tickets';
import Dashboard from './components/dashboard/Dashboard';
import Admin from './components/admin/Admin';

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

  if (checking) return <div className="checking">Cargando...</div>;
  if (!user) return <Login onLogin={setUser} />;

  const tabs = TABS.filter(([k]) => puede(user.rol, k));
  // Si la vista actual no está permitida para el rol, usa la primera permitida.
  const activeView = tabs.some(([k]) => k === view) ? view : tabs[0][0];

  const onSelect = (k) => {
    setView(k);
    if (k !== 'inventario' && k !== 'admin') refrescarGlobal();
  };

  return (
    <div className="app">
      <Header
        user={user}
        tabs={tabs}
        activeView={activeView}
        stats={stats}
        ticketsPend={ticketsPend}
        onSelect={onSelect}
        onLogout={logout}
      />

      {error && <div className="error-bar">{error}</div>}

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
      </main>
    </div>
  );
}
