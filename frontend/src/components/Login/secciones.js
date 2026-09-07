// Configuración declarativa de cada portal de acceso. El login los recorre
// como tabs y consulta el activo por su `key`. Esto evita switches dispersos
// por rol/sección en los componentes y mantiene los strings en un solo lugar.
export const SECCIONES = {
  admin: {
    key: 'admin',
    titulo: 'Administración',
    subtitulo: 'Acceso del equipo de almacén',
    icono: 'personas',
  },
  area: {
    key: 'area',
    titulo: 'Áreas',
    subtitulo: 'Portal de líderes de área',
    icono: 'edificio',
  },
  tienda: {
    key: 'tienda',
    titulo: 'Tiendas',
    subtitulo: 'Portal de solicitudes',
    icono: 'tienda',
  },
};

export const SECCION_KEYS = Object.keys(SECCIONES);
