// Error de aplicación con código HTTP. El errorHandler lo traduce a respuesta JSON.
export class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'AppError';
    this.status = status;
  }
}

export const badRequest = (msg = 'Solicitud inválida.') => new AppError(msg, 400);
export const unauthorized = (msg = 'No autenticado.') => new AppError(msg, 401);
export const forbidden = (msg = 'Sin permisos.') => new AppError(msg, 403);
export const notFound = (msg = 'Recurso no encontrado.') => new AppError(msg, 404);
