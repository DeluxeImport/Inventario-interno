// Catálogo visual del carrusel del login (asset del frontend).
//
// Los PNG correspondientes viven en `public/tiendas/<slug>.png`. Mantener
// este array sincronizado con esa carpeta es responsabilidad del frontend.
//
// Espejo informativo de `backend/src/data/tiendas.js`. No se consume vía
// API a propósito: un carrusel decorativo no debe romperse si el backend
// está caído durante el login.
export const TIENDAS_CARRUSEL = Object.freeze([
  { slug: 'capitanbarber', nombre: 'Capitán Barber' },
  { slug: 'coralbarber',   nombre: 'Coral Barber' },
  { slug: 'coralstore',    nombre: 'Coral Store' },
  { slug: 'coralnails',    nombre: 'Coral Nails' },
  { slug: 'cosmeticos',    nombre: 'Cosméticos Trujillo' },
  { slug: 'deluxeimport',  nombre: 'Deluxe Import' },
  { slug: 'missbeauty',    nombre: 'Miss Beauty' },
  { slug: 'novabelleza',   nombre: 'Nova Belleza' },
]);
