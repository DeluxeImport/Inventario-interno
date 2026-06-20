// Exporta TODOS los datos de la base actual (SQLite) a _dump.json.
// Se ejecuta ANTES de cambiar el provider a PostgreSQL.
import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'node:fs';

const p = new PrismaClient();

const dump = {
  usuarios: await p.usuario.findMany(),
  productos: await p.producto.findMany(),
  movimientos: await p.movimiento.findMany(),
  tickets: await p.ticket.findMany(),
  ticketItems: await p.ticketItem.findMany(),
  actividades: await p.actividad.findMany(),
};

writeFileSync(new URL('./_dump.json', import.meta.url), JSON.stringify(dump, null, 2));
console.log('Exportado a _dump.json:');
for (const [k, v] of Object.entries(dump)) console.log(`  ${k}: ${v.length}`);
await p.$disconnect();
