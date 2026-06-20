// Importa _dump.json a la base actual (PostgreSQL), preservando los IDs originales,
// y reajusta las secuencias para que los próximos autoincrement no choquen.
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';

const p = new PrismaClient();
const d = JSON.parse(readFileSync(new URL('./_dump.json', import.meta.url)));

// Orden respetando las llaves foráneas.
const pasos = [
  ['usuario', d.usuarios],
  ['producto', d.productos],
  ['movimiento', d.movimientos],
  ['ticket', d.tickets],
  ['ticketItem', d.ticketItems],
  ['actividad', d.actividades],
];

for (const [modelo, filas] of pasos) {
  if (!filas?.length) {
    console.log(`  ${modelo}: 0 (omitido)`);
    continue;
  }
  const r = await p[modelo].createMany({ data: filas });
  console.log(`  ${modelo}: ${r.count} insertados`);
}

// Reajustar secuencias (próximo id = MAX(id)+1).
const tablas = ['Usuario', 'Producto', 'Movimiento', 'Ticket', 'TicketItem', 'Actividad'];
for (const t of tablas) {
  await p.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"${t}"','id'), GREATEST(COALESCE((SELECT MAX(id) FROM "${t}"), 1), 1))`
  );
}
console.log('Secuencias reajustadas.');
await p.$disconnect();
