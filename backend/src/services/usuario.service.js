import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { publicUser } from '../utils/index.js';
import { badRequest, notFound } from '../lib/AppError.js';
import { ROLES, ROLES_LIST, AREAS } from '../constants/index.js';
import { assertPasswordAllowed } from '../security/passwordPolicy.js';

const normRol = (r) => (ROLES_LIST.includes(r) ? r : ROLES.USUARIO);

// Un usuario rol "tienda" necesita su tienda y un rol "lider" necesita su área:
// sin ese dato sus solicitudes quedarían sin destino. Valida el estado final.
function validarDestino(rol, tienda, area) {
  if (rol === ROLES.TIENDA && !tienda)
    throw badRequest('Debes indicar la tienda para un usuario de rol tienda.');
  if (rol === ROLES.LIDER && !area)
    throw badRequest('Debes indicar el área para un usuario de rol líder.');
}

export async function listar() {
  const users = await prisma.usuario.findMany({ orderBy: { createdAt: 'asc' } });
  return users.map(publicUser);
}

// Posibles destinos de una salida de stock: tiendas registradas + áreas fijas.
export async function destinos() {
  const rows = await prisma.usuario.findMany({
    where: { tienda: { not: null } },
    distinct: ['tienda'],
    select: { tienda: true },
    orderBy: { tienda: 'asc' },
  });
  const tiendas = rows.map((r) => r.tienda).filter(Boolean);
  return { tiendas, areas: AREAS };
}

export async function crear(data) {
  const existe = await prisma.usuario.findUnique({ where: { username: data.username.trim() } });
  if (existe) throw badRequest('Ese nombre de usuario ya existe.');

  const rol = normRol(data.rol);
  const tienda = data.tienda?.trim() || null;
  const area = data.area?.trim() || null;
  validarDestino(rol, tienda, area);
  assertPasswordAllowed(data.password);

  const passwordHash = await bcrypt.hash(data.password, 10);
  const nuevo = await prisma.usuario.create({
    data: {
      username: data.username.trim(),
      nombre: data.nombre.trim(),
      passwordHash,
      rol,
      tienda,
      area,
    },
  });
  return publicUser(nuevo);
}

export async function actualizar(id, data) {
  const actual = await prisma.usuario.findUnique({ where: { id } });
  if (!actual) throw notFound('Usuario no encontrado.');

  const patch = {};
  if (data.nombre != null) patch.nombre = data.nombre.trim();
  if (data.rol != null) patch.rol = normRol(data.rol);
  if (data.tienda != null) patch.tienda = data.tienda.trim() || null;
  if (data.area != null) patch.area = data.area.trim() || null;
  if (data.activo != null) patch.activo = !!data.activo;
  if (data.password) {
    assertPasswordAllowed(data.password);
    patch.passwordHash = await bcrypt.hash(data.password, 10);
  }

  // Valida el estado final (mezcla de lo existente con el cambio) para no dejar
  // una tienda sin tienda o un líder sin área tras editar el rol o el destino.
  validarDestino(
    patch.rol ?? actual.rol,
    'tienda' in patch ? patch.tienda : actual.tienda,
    'area' in patch ? patch.area : actual.area
  );

  const upd = await prisma.usuario.update({ where: { id }, data: patch });
  return publicUser(upd);
}

export async function eliminar(id, actorId) {
  if (id === actorId) throw badRequest('No puedes eliminar tu propio usuario.');
  return prisma.usuario.delete({ where: { id } });
}
