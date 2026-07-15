// Muro de Actualizaciones.
//
// Historial de cambios del sistema, mantenido a mano. Para publicar una
// novedad, agrega un objeto AL PRINCIPIO del array (el más reciente arriba):
//   { fecha, version, titulo, tipo, cambios: [ ... ] }
// `tipo` colorea la etiqueta: 'nuevo' | 'mejora' | 'correccion'.

export const ACTUALIZACIONES = [
  {
    fecha: '2026-07-13',
    version: '1.3',
    titulo: 'Manual y muro de Actualizaciones',
    tipo: 'nuevo',
    cambios: [
      'Nuevo Manual del sistema descargable en PDF, paso a paso y en lenguaje sencillo.',
      'Este muro de Actualizaciones, donde queda registrado cada cambio que hacemos.',
      'El área «Sistemas» pasó a ser un área oficial: aparece como destino de stock y para líderes.',
    ],
  },
  {
    fecha: '2026-07-13',
    version: '1.2',
    titulo: 'Tres portales de acceso',
    tipo: 'nuevo',
    cambios: [
      'El login ahora separa tres portales: Administración, Áreas y Tiendas.',
      'Cada cuenta entra solo por su portal; si te equivocas, el sistema te indica el correcto.',
    ],
  },
  {
    fecha: '2026-07-12',
    version: '1.1',
    titulo: 'Nueva interfaz y adaptación a móvil',
    tipo: 'mejora',
    cambios: [
      'Rediseño completo de la interfaz, más limpia y consistente, con modo claro y oscuro.',
      'Iconos propios en lugar de emojis en toda la aplicación.',
      'En el teléfono aparece una barra de accesos abajo, con un botón «Más» para el resto.',
      'En tablet y computadora se usa una barra lateral con las secciones agrupadas.',
      'Las tablas se leen mejor: estados resaltados y números alineados.',
    ],
  },
  {
    fecha: '2026-07-12',
    version: '1.0.1',
    titulo: 'Correcciones',
    tipo: 'correccion',
    cambios: [
      'Se corrigió el desplazamiento vertical: ahora las listas largas se recorren sin cortarse.',
      'Se corrigió la categoría «Bonificaciones», que estaba mal escrita.',
      'Se corrigió la instalación inicial que dejaba sin crear a los líderes de área.',
    ],
  },
];
