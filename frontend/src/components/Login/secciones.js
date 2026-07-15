import IconoAdmin from './icons/IconoAdmin';
import IconoArea from './icons/IconoArea';
import IconoTienda from './icons/IconoTienda';

// Configuración declarativa de cada sección del login. El picker la recorre
// y el form la consulta por su `key`. Esto evita switches dispersos por
// rol/sección en los componentes y mantiene los strings localizables en un
// solo lugar.
//
// `descripcion` se oculta en el picker cuando es vacía (decisión de producto:
// los trabajadores no deben saber qué módulos maneja Administración).
export const SECCIONES = {
  admin: {
    key: 'admin',
    titulo: 'Administración',
    subtitulo: 'Acceso del equipo de almacén',
    Icono: IconoAdmin,
    descripcion: '',
  },
  area: {
    key: 'area',
    titulo: 'Áreas',
    subtitulo: 'Portal de líderes de área',
    Icono: IconoArea,
    descripcion: 'Solicita productos para tu área (RR.HH, Marketing, Logística).',
  },
  tienda: {
    key: 'tienda',
    titulo: 'Tiendas',
    subtitulo: 'Portal de solicitudes',
    Icono: IconoTienda,
    descripcion: 'Crea y consulta tus solicitudes al almacén.',
  },
};

export const SECCION_KEYS = Object.keys(SECCIONES);
