import { ZodError } from 'zod';
import { AppError } from './AppError.js';
import { config } from '../config/env.js';

// Manejo central de errores: traduce errores conocidos a respuestas JSON consistentes.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    const msg = err.issues[0]?.message || 'Datos inválidos.';
    return res.status(400).json({ error: msg });
  }
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message });
  }
  // Errores conocidos de Prisma: se traducen a mensajes claros en vez de un 500 críptico.
  if (err?.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2003')
      return res.status(400).json({
        error:
          'No se puede eliminar: el registro está en uso por otros datos (por ejemplo, solicitudes asociadas).',
      });
    if (err.code === 'P2025')
      return res.status(404).json({ error: 'El registro no existe o ya fue eliminado.' });
    if (err.code === 'P2002')
      return res.status(400).json({ error: 'Ya existe un registro con ese valor.' });
  }
  // Otros errores no controlados: se loguea el detalle, pero en producción NO se filtra
  // el mensaje interno al cliente (evita exponer rutas, SQL, stack, etc.).
  console.error('[ERROR]', err);
  const msg = config.isProd ? 'Error interno del servidor.' : err?.message || 'Error interno del servidor.';
  return res.status(500).json({ error: msg });
}

// 404 para rutas no definidas.
export function notFoundHandler(_req, res) {
  res.status(404).json({ error: 'Ruta no encontrada.' });
}
