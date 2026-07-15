export const APP_NAME = 'Gestión de Inventario';

export const ROLES = { ADMIN: 'admin', USUARIO: 'usuario', TIENDA: 'tienda', LIDER: 'lider' };

// Áreas disponibles para los líderes de equipo.
// Debe coincidir con AREAS en backend/src/constants/index.js.
export const AREAS = ['RR.HH', 'Marketing', 'Logística', 'Sistemas'];

// Responsables por defecto para registrar un movimiento (entrada/salida).
// Edita esta lista para añadir/quitar personas; aparecen en el desplegable del modal.
export const RESPONSABLES = ['Andrea', 'Yeimi (Logística)', 'Alexis', 'Cristopher', 'Kati', 'Miguel'];

// Roles que solo crean solicitudes (tiendas y líderes de área).
export const REQUESTER_ROLES = [ROLES.TIENDA, ROLES.LIDER];
export const esSolicitante = (rol) => REQUESTER_ROLES.includes(rol);

// Módulos que ve cada rol. «actualizaciones» y «manual» son de ayuda general:
// los ve cualquier usuario con sesión.
const AYUDA = ['actualizaciones', 'manual'];
export const PERMISOS = {
  admin: ['inventario', 'movimientos', 'tickets', 'dashboard', 'admin', ...AYUDA],
  usuario: ['inventario', 'movimientos', 'tickets', 'dashboard', ...AYUDA],
  tienda: ['tickets', ...AYUDA],
  lider: ['tickets', ...AYUDA],
};

export const puede = (rol, modulo) => (PERMISOS[rol] || []).includes(modulo);

export const TABS = [
  ['inventario', 'Inventario'],
  ['movimientos', 'Movimientos'],
  ['tickets', 'Tickets'],
  ['dashboard', 'Dashboard'],
  ['admin', 'Administración'],
  ['actualizaciones', 'Actualizaciones'],
  ['manual', 'Manual'],
];

// Descripción del rol bajo el nombre del usuario. Para el admin describimos su
// alcance en vez de repetir «Administrador» debajo de «Administrador».
export const rolLabel = (user) => {
  if (user.rol === ROLES.ADMIN) return 'Acceso total';
  if (user.rol === ROLES.TIENDA) return `Tienda${user.tienda ? ' · ' + user.tienda : ''}`;
  if (user.rol === ROLES.LIDER) return `Área${user.area ? ' · ' + user.area : ''}`;
  if (user.rol === ROLES.USUARIO) return 'Usuario';
  return 'Rol no permitido';
};

// Nombre legible del origen/destino de un usuario solicitante (tienda o área).
export const destinoUsuario = (u) => u?.tienda || u?.area || null;
