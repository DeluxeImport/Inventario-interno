// Catálogo único de tiendas que usan el portal.
// Consumido por:
//  - GET /api/tiendas/publicas (carrusel público del login)
//  - prisma/seed_tiendas.js (creación de cuentas iniciales)
// Para agregar/quitar una tienda: edita este archivo y re-corre el seed.
//
// Campos:
//  - slug:     identificador estable (filename del logo en public/tiendas/<slug>.png)
//  - username: credencial de login (campo Usuario.username en DB)
//  - nombre:   etiqueta legible mostrada en UI y guardada en Usuario.tienda
export const TIENDAS = Object.freeze([
  { slug: 'capitanbarber', username: 'capitanbarber', nombre: 'Capitán Barber' },
  { slug: 'coralbarber',   username: 'coralbarber',   nombre: 'Coral Barber' },
  { slug: 'coralstore',    username: 'coralstore',    nombre: 'Coral Store' },
  { slug: 'coralnails',    username: 'coralnails',    nombre: 'Coral Nails' },
  { slug: 'cosmeticos',    username: 'cosmeticos',    nombre: 'Cosméticos Trujillo' },
  { slug: 'deluxeimport',  username: 'deluxe',        nombre: 'Deluxe Import' },
  { slug: 'missbeauty',    username: 'missbeauty',    nombre: 'Miss Beauty' },
  { slug: 'novabelleza',   username: 'nova',          nombre: 'Nova Belleza' },
]);

// Vista pública: solo lo necesario para renderizar el carrusel.
export const tiendasPublicas = () => TIENDAS.map(({ slug, nombre }) => ({ slug, nombre }));
