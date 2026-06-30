import { badRequest } from '../lib/AppError.js';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_POLICY_MESSAGE = `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;

export function isPasswordAllowed(password) {
  return typeof password === 'string' && password.length >= PASSWORD_MIN_LENGTH;
}

export function assertPasswordAllowed(password) {
  if (!isPasswordAllowed(password)) throw badRequest(PASSWORD_POLICY_MESSAGE);
}
