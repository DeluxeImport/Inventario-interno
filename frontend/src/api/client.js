import { startLoadingFavicon, stopLoadingFavicon } from '../lib/loadingFavicon';

const BASE = '/api';
const TOKEN_KEY = 'inv_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Callback que se dispara cuando una sesión activa caduca (401 con token presente).
let onUnauthorized = () => {};
export const setOnUnauthorized = (fn) => (onUnauthorized = fn);

// Compatibilidad durante despliegues escalonados: la API anterior devolvía un arreglo,
// mientras que la API paginada devuelve { items, nextCursor, hasMore, total }.
// Normalizar aquí evita que una versión antigua del backend derribe toda la interfaz.
const normalizePage = (data) => {
  if (Array.isArray(data)) {
    return { items: data, nextCursor: null, hasMore: false, total: data.length };
  }
  const items = Array.isArray(data?.items) ? data.items : [];
  return {
    ...data,
    items,
    nextCursor: data?.nextCursor || null,
    hasMore: Boolean(data?.hasMore),
    total: Number.isFinite(data?.total) ? data.total : items.length,
  };
};

async function req(path, opts = {}) {
  startLoadingFavicon();
  try {
    const token = getToken();
    // FormData (subida de archivos): el navegador arma su propio Content-Type
    // con el boundary del multipart, así que no lo fijamos nosotros.
    const esFormData = opts.body instanceof FormData;
    const res = await fetch(BASE + path, {
      headers: {
        ...(esFormData ? {} : { 'Content-Type': 'application/json' }),
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
  } finally {
    stopLoadingFavicon();
  }
}

export const api = {
  // Auth
  login: (username, password, seccion) =>
    req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, seccion }),
    }),
  me: () => req('/auth/me'),
  tiendasPublicas: () => req('/tiendas/publicas'),
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
  productos: ({ q = '', categoria = 'Todas', cursor, limit = 50 } = {}) => {
    const qs = new URLSearchParams({ q, categoria, limit: String(limit) });
    if (cursor) qs.set('cursor', cursor);
    return req(`/productos?${qs}`).then(normalizePage);
  },
  categorias: () => req('/categorias'),
  stats: () => req('/stats'),
  destinos: () => req('/destinos'),
  crearProducto: (data) => req('/productos', { method: 'POST', body: JSON.stringify(data) }),
  editarProducto: (id, data) => req(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  borrarProducto: (id) => req(`/productos/${id}`, { method: 'DELETE' }),

  // Movimientos (paginado por cursor + filtros opcionales: desde, hasta, tipo, productoId)
  movimientos: ({ productoId, cursor, desde, hasta, tipo } = {}) => {
    const qs = new URLSearchParams();
    if (productoId) qs.set('productoId', productoId);
    if (cursor) qs.set('cursor', cursor);
    if (desde) qs.set('desde', desde);
    if (hasta) qs.set('hasta', hasta);
    if (tipo) qs.set('tipo', tipo);
    const s = qs.toString();
    return req(`/movimientos${s ? `?${s}` : ''}`);
  },
  crearMovimiento: (data) => req('/movimientos', { method: 'POST', body: JSON.stringify(data) }),
  borrarMovimiento: (id) => req(`/movimientos/${id}`, { method: 'DELETE' }),

  // Tickets / solicitudes
  solicitables: () => req('/solicitables'),
  tickets: (estado, cursor, limit = 40) => {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (estado && estado !== 'TODOS') qs.set('estado', estado);
    if (cursor) qs.set('cursor', cursor);
    return req(`/tickets?${qs}`).then(normalizePage);
  },
  crearTicket: (data) => req('/tickets', { method: 'POST', body: JSON.stringify(data) }),
  accionTicket: (id, accion, data = {}) =>
    req(`/tickets/${id}/estado`, {
      method: 'PUT',
      body: JSON.stringify({ accion, ...data }),
    }),

  // Traspasos (tienda a tienda)
  tiendas: () => req('/tiendas'),
  traspasos: (estado, cursor, limit = 40, copiadoErp = 'TODOS', direccion) => {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (estado && estado !== 'TODOS') qs.set('estado', estado);
    if (cursor) qs.set('cursor', cursor);
    if (copiadoErp !== 'TODOS') qs.set('copiadoErp', copiadoErp);
    if (direccion) qs.set('direccion', direccion);
    return req(`/traspasos?${qs}`).then(normalizePage);
  },
  crearTraspaso: (data) => req('/traspasos', { method: 'POST', body: JSON.stringify(data) }),
  subirFotoTraspaso: (id, file) => {
    const fd = new FormData();
    fd.append('foto', file);
    return req(`/traspasos/${id}/foto`, { method: 'POST', body: fd });
  },
  accionTraspaso: (id, accion, data = {}) =>
    req(`/traspasos/${id}/estado`, {
      method: 'PUT',
      body: JSON.stringify({ accion, ...data }),
    }),
  historialErpTraspaso: (id) => req(`/traspasos/${id}/erp-historial`),
  marcarCopiadoTraspaso: (id, copiado, observacion = '') =>
    req(`/traspasos/${id}/copiado`, { method: 'PUT', body: JSON.stringify({ copiado, observacion }) }),

  // Notificaciones push del navegador
  pushPublicKey: () => req('/push/public-key'),
  pushSuscribir: (subscription) => req('/push/subscribe', { method: 'POST', body: JSON.stringify(subscription) }),
  pushDesuscribir: (endpoint) => req('/push/unsubscribe', { method: 'POST', body: JSON.stringify({ endpoint }) }),
};
