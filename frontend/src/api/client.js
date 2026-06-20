const BASE = '/api';
const TOKEN_KEY = 'inv_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Callback que se dispara cuando una sesión activa caduca (401 con token presente).
let onUnauthorized = () => {};
export const setOnUnauthorized = (fn) => (onUnauthorized = fn);

async function req(path, opts = {}) {
  const token = getToken();
  const res = await fetch(BASE + path, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...opts,
  });

  if (res.status === 401) {
    // Solo cerramos sesión si había un token (sesión expirada).
    // Sin token (p. ej. login fallido) propagamos el mensaje real del servidor.
    if (token) {
      clearToken();
      onUnauthorized();
      throw new Error('Sesión expirada. Vuelve a iniciar sesión.');
    }
    const e = await res.json().catch(() => ({ error: 'No autorizado' }));
    throw new Error(e.error || 'No autorizado');
  }

  if (!res.ok) {
    const e = await res.json().catch(() => ({ error: 'Error de red' }));
    throw new Error(e.error || 'Error desconocido');
  }
  return res.json();
}

export const api = {
  // Auth
  login: (username, password) =>
    req('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: () => req('/auth/me'),
  cambiarPassword: (actual, nueva) =>
    req('/auth/cambiar-password', { method: 'POST', body: JSON.stringify({ actual, nueva }) }),

  // Usuarios (admin)
  usuarios: () => req('/usuarios'),
  crearUsuario: (data) => req('/usuarios', { method: 'POST', body: JSON.stringify(data) }),
  editarUsuario: (id, data) => req(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  borrarUsuario: (id) => req(`/usuarios/${id}`, { method: 'DELETE' }),

  // Actividad (admin)
  actividades: (usuarioId) => req(`/actividades${usuarioId ? `?usuarioId=${usuarioId}` : ''}`),

  // Productos
  productos: (q = '', categoria = 'Todas') =>
    req(`/productos?q=${encodeURIComponent(q)}&categoria=${encodeURIComponent(categoria)}`),
  categorias: () => req('/categorias'),
  stats: () => req('/stats'),
  destinos: () => req('/destinos'),
  crearProducto: (data) => req('/productos', { method: 'POST', body: JSON.stringify(data) }),
  editarProducto: (id, data) => req(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  borrarProducto: (id) => req(`/productos/${id}`, { method: 'DELETE' }),

  // Movimientos (paginado por cursor: `cursor` = id del último movimiento ya cargado)
  movimientos: (productoId, { cursor } = {}) => {
    const qs = new URLSearchParams();
    if (productoId) qs.set('productoId', productoId);
    if (cursor) qs.set('cursor', cursor);
    const s = qs.toString();
    return req(`/movimientos${s ? `?${s}` : ''}`);
  },
  crearMovimiento: (data) => req('/movimientos', { method: 'POST', body: JSON.stringify(data) }),
  borrarMovimiento: (id) => req(`/movimientos/${id}`, { method: 'DELETE' }),

  // Tickets / solicitudes
  solicitables: () => req('/solicitables'),
  tickets: (estado) => req(`/tickets${estado && estado !== 'TODOS' ? `?estado=${estado}` : ''}`),
  crearTicket: (data) => req('/tickets', { method: 'POST', body: JSON.stringify(data) }),
  accionTicket: (id, accion, data = {}) =>
    req(`/tickets/${id}/estado`, {
      method: 'PUT',
      body: JSON.stringify({ accion, ...data }),
    }),
};
