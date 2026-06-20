import { z } from 'zod';
import { MOV_TIPOS, ROLES_LIST } from '../constants/index.js';

const OBLIGATORIO_PRODUCTO = 'Categoría y producto son obligatorios.';
const OBLIGATORIO_USUARIO = 'Usuario, nombre y contraseña son obligatorios.';

// Stock: entero no negativo (no se permiten existencias negativas).
const stockNoNegativo = z.coerce
  .number()
  .int('El stock debe ser un número entero.')
  .min(0, 'El stock no puede ser negativo.');

// Rol válido contra la lista de roles permitidos (evita roles arbitrarios).
const rolValido = z
  .string()
  .refine((r) => ROLES_LIST.includes(r), 'Rol inválido.');

// ----- Productos -----
export const productoCrearSchema = z.object({
  categoria: z.string().trim().min(1, OBLIGATORIO_PRODUCTO),
  producto: z.string().trim().min(1, OBLIGATORIO_PRODUCTO),
  unidad: z.string().optional(),
  stockCompleto: stockNoNegativo.optional(),
  stockIncompleto: stockNoNegativo.optional(),
  stockMinimo: stockNoNegativo.optional(),
  solicitable: z.boolean().optional(),
});

export const productoEditarSchema = z.object({
  categoria: z.string().trim().min(1).optional(),
  producto: z.string().trim().min(1).optional(),
  unidad: z.string().optional(),
  stockCompleto: stockNoNegativo.optional(),
  stockIncompleto: stockNoNegativo.optional(),
  stockMinimo: stockNoNegativo.optional(),
  solicitable: z.boolean().optional(),
});

// ----- Movimientos -----
export const movimientoSchema = z.object({
  productoId: z.coerce.number().int().positive('Datos del movimiento inválidos.'),
  tipo: z.enum([MOV_TIPOS.ENTRADA, MOV_TIPOS.SALIDA], 'Datos del movimiento inválidos.'),
  cantidad: z.coerce.number().int().positive('Datos del movimiento inválidos.'),
  destino: z.string().optional(),
  responsable: z.string().optional(),
  observacion: z.string().optional(),
});

// ----- Usuarios -----
export const usuarioCrearSchema = z.object({
  username: z.string().trim().min(1, OBLIGATORIO_USUARIO),
  nombre: z.string().trim().min(1, OBLIGATORIO_USUARIO),
  password: z.string().min(4, 'La contraseña debe tener al menos 4 caracteres.'),
  rol: rolValido.optional(),
  tienda: z.string().optional(),
  area: z.string().optional(),
});

export const usuarioEditarSchema = z.object({
  nombre: z.string().trim().min(1).optional(),
  rol: rolValido.optional(),
  tienda: z.string().optional(),
  area: z.string().optional(),
  activo: z.boolean().optional(),
  password: z.string().optional(),
});

// ----- Tickets -----
export const ticketCrearSchema = z.object({
  area: z.string().optional(),
  nota: z.string().optional(),
  items: z
    .array(
      z.object({
        productoId: z.coerce.number().int().positive('Producto inválido en la solicitud.'),
        cantidad: z.coerce
          .number()
          .int('La cantidad debe ser un número entero.')
          .positive('La cantidad debe ser mayor a 0.'),
      })
    )
    .optional(),
});

export const ticketEstadoSchema = z.object({
  accion: z.enum(['aprobar', 'rechazar', 'entregar'], 'Acción inválida.'),
  observacion: z.string().optional(),
  items: z
    .array(z.object({ id: z.coerce.number().int(), cantidad: z.coerce.number().int() }))
    .optional(),
});
