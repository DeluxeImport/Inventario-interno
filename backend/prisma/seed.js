import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

const data = JSON.parse(readFileSync(join(__dirname, 'seed_data.json'), 'utf-8'));

async function main() {
  const count = await prisma.producto.count();
  if (count > 0) {
    console.log(`Ya existen ${count} productos. Seed omitido (la base ya tiene datos).`);
    return;
  }
  await prisma.producto.createMany({ data });
  console.log(`Sembrados ${data.length} productos desde el Excel original.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
