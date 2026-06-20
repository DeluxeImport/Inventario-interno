export const APP_NAME = 'Gestión de Inventario';

export const ROLES = { ADMIN: 'admin', USUARIO: 'usuario', TIENDA: 'tienda', LIDER: 'lider' };

// Áreas disponibles para los líderes de equipo.
export const AREAS = ['RR.HH', 'Marketing', 'Logística'];

// Responsables por defecto para registrar un movimiento (entrada/salida).
// Edita esta lista para añadir/quitar personas; aparecen en el desplegable del modal.
export const RESPONSABLES = ['Andrea', 'Yeimi (Logística)', 'Alexis', 'Cristopher', 'Kati'];

// Roles que solo crean solicitudes (tiendas y líderes de área).
export const REQUESTER_ROLES = [ROLES.TIENDA, ROLES.LIDER];
export const esSolicitante = (rol) => REQUESTER_ROLES.includes(rol);

// Módulos que ve cada rol.
export const PERMISOS = {
  admin: ['inventario', 'movimientos', 'tickets', 'dashboard', 'admin'],
  usuario: ['inventario', 'movimientos', 'tickets', 'dashboard'],
  tienda: ['tickets'],
  lider: ['tickets'],
};

export const puede = (rol, modulo) => (PERMISOS[rol] || PERMISOS.usuario).includes(modulo);

export const TABS = [
  ['inventario', 'Inventario'],
  ['movimientos', 'Movimientos'],
  ['tickets', 'Tickets'],
  ['dashboard', 'Dashboard'],
  ['admin', 'Administración'],
];

export const rolLabel = (user) => {
  if (user.rol === ROLES.ADMIN) return 'Administrador';
  if (user.rol === ROLES.TIENDA) return `Tienda${user.tienda ? ' · ' + user.tienda : ''}`;
  if (user.rol === ROLES.LIDER) return `Área${user.area ? ' · ' + user.area : ''}`;
  return 'Usuario';
};

// Nombre legible del origen/destino de un usuario solicitante (tienda o área).
export const destinoUsuario = (u) => u?.tienda || u?.area || null;
