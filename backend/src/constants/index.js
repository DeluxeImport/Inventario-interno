export const ROLES = {
  ADMIN: 'admin',
  USUARIO: 'usuario',
  TIENDA: 'tienda',
  LIDER: 'lider',
};
export const ROLES_LIST = Object.values(ROLES);

// Roles que solicitan (crean tickets) y NO acceden al almacén: tiendas y líderes de área.
export const REQUESTER_ROLES = [ROLES.TIENDA, ROLES.LIDER];

// Áreas disponibles para los líderes de equipo.
// Fuente de verdad: debe coincidir con AREAS en frontend/src/constants.js.
export const AREAS = ['RR.HH', 'Marketing', 'Logística', 'Sistemas'];

export const TICKET_ESTADOS = {
  PENDIENTE: 'PENDIENTE',
  APROBADO: 'APROBADO',
  ENTREGADO: 'ENTREGADO',
  RECHAZADO: 'RECHAZADO',
};

export const MOV_TIPOS = {
  ENTRADA: 'ENTRADA',
  SALIDA: 'SALIDA',
};

export const STOCK_ESTADOS = {
  OK: 'OK',
  BAJO: 'BAJO',
  AGOTADO: 'AGOTADO',
};

// Portales del login. Cada rol pertenece a UNO solo y el backend se niega a
// emitir token si el cliente eligió el portal equivocado.
//   admin / usuario → Administración
//   lider           → Áreas
//   tienda          → Tiendas
export const SECCIONES = {
  ADMIN: 'admin',
  AREA: 'area',
  TIENDA: 'tienda',
};
export const SECCIONES_LIST = Object.values(SECCIONES);

// Etiqueta legible de cada portal (para mensajes de error de cruce de portal).
export const SECCION_LABEL = {
  [SECCIONES.ADMIN]: 'Administración',
  [SECCIONES.AREA]: 'Áreas',
  [SECCIONES.TIENDA]: 'Tiendas',
};

export const seccionDeRol = (rol) => {
  if (rol === ROLES.TIENDA) return SECCIONES.TIENDA;
  if (rol === ROLES.LIDER) return SECCIONES.AREA;
  return SECCIONES.ADMIN; // admin y usuario (almacén)
};
