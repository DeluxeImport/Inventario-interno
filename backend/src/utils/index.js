import { STOCK_ESTADOS } from '../constants/index.js';

// Obtiene la IP real del cliente (considera proxies vía x-forwarded-for).
export function getIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  let ip = (fwd ? String(fwd).split(',')[0] : req.socket?.remoteAddress) || '';
  ip = ip.replace('::ffff:', ''); // IPv4 mapeada en IPv6
  if (ip === '::1') ip = '127.0.0.1 (local)';
  return ip;
}

// Normaliza el tamaño de página: entero dentro de [1, max], con valor por defecto.
// Protege las consultas de listados de pedir cantidades absurdas al crecer el historial.
export function clampLimit(value, def = 100, max = 200) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n <= 0) return def;
  return Math.min(n, max);
}

// Agrega stock total y estado de alerta a un producto.
export function withEstado(p) {
  const stockTotal = p.stockCompleto + p.stockIncompleto;
  let estado = STOCK_ESTADOS.OK;
  if (stockTotal <= 0) estado = STOCK_ESTADOS.AGOTADO;
  else if (stockTotal <= p.stockMinimo) estado = STOCK_ESTADOS.BAJO;
  return { ...p, stockTotal, estado };
}

// Datos de usuario seguros para exponer al cliente (sin passwordHash).
export const publicUser = (u) => ({
  id: u.id,
  username: u.username,
  nombre: u.nombre,
  rol: u.rol,
  tienda: u.tienda,
  area: u.area,
  activo: u.activo,
  ultimoLogin: u.ultimoLogin,
  ultimaIp: u.ultimaIp,
  createdAt: u.createdAt,
});

// Destino de un ticket: la tienda o el área del solicitante.
export const destinoDeSolicitante = (solicitante) =>
  solicitante?.tienda || solicitante?.area || null;

// Código legible del ticket derivado de su id (TK-0001).
export const codigoTicket = (id) => 'TK-' + String(id).padStart(4, '0');

// Agrega el código legible al ticket.
export const ticketPublico = (t) => ({ ...t, codigo: codigoTicket(t.id) });
