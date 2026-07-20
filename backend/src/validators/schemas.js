import { z } from 'zod';
import { MOV_TIPOS, ROLES_LIST, SECCIONES_LIST } from '../constants/index.js';
import { PASSWORD_MIN_LENGTH, PASSWORD_POLICY_MESSAGE } from '../security/passwordPolicy.js';

// ----- Auth -----
export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Usuario y contraseña son obligatorios.'),
  password: z.string().min(1, 'Usuario y contraseña son obligatorios.'),
  seccion: z.enum(SECCIONES_LIST, 'Sección inválida.'),
});

const OBLIGATORIO_PRODUCTO = 'Categoría y producto son obligatorios.';
const OBLIGATORIO_USUARIO = 'Usuario, nombre y contraseña son obligatorios.';

// Stock: entero no negativo (no se permiten existencias negativas).
const stockNoNegativo = z.coerce
  .number()
  .int('El stock debe ser un número entero.')
  .min(0, 'El stock no puede ser negativo.');

const precioNoNegativo = z.coerce.number().min(0, 'El precio no puede ser negativo.');

// Rol válido contra la lista de roles permitidos (evita roles arbitrarios).
const rolValido = z
  .string()
  .refine((r) => ROLES_LIST.includes(r), 'Rol inválido.');

const passwordSeguro = z.string().min(PASSWORD_MIN_LENGTH, PASSWORD_POLICY_MESSAGE);

// ----- Productos -----
export const productoCrearSchema = z.object({
  categoria: z.string().trim().min(1, OBLIGATORIO_PRODUCTO),
  producto: z.string().trim().min(1, OBLIGATORIO_PRODUCTO),
  unidad: z.string().optional(),
  stockCompleto: stockNoNegativo.optional(),
  stockIncompleto: stockNoNegativo.optional(),
  stockMinimo: stockNoNegativo.optional(),
  precio: precioNoNegativo.optional(),
  solicitable: z.boolean().optional(),
});

export const productoEditarSchema = z.object({
  categoria: z.string().trim().min(1).optional(),
  producto: z.string().trim().min(1).optional(),
  unidad: z.string().optional(),
  stockCompleto: stockNoNegativo.optional(),
  stockIncompleto: stockNoNegativo.optional(),
  stockMinimo: stockNoNegativo.optional(),
  precio: precioNoNegativo.optional(),
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
  password: passwordSeguro,
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
  password: passwordSeguro.optional(),
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
    .array(
      z.object({
        id: z.coerce.number().int(),
        // 0 es válido: significa "rechazar este ítem dentro del ticket".
        cantidad: z.coerce.number().int().min(0, 'La cantidad no puede ser negativa.'),
      })
    )
    .optional(),
});
