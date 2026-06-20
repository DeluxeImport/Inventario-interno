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
export const AREAS = ['RR.HH', 'Marketing', 'Logística'];

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
