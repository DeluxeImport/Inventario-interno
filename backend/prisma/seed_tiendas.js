import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { TIENDAS as CATALOGO } from '../src/data/tiendas.js';

const prisma = new PrismaClient();

// Contraseña inicial común; cada tienda debería cambiarla al ingresar.
const PASS_INICIAL = 'tienda123';

// Catálogo importado de src/data/tiendas.js (única fuente de verdad).
const TIENDAS = CATALOGO.map(({ username, nombre }) => ({ username, tienda: nombre }));

async function main() {
  // Limpia el usuario de ejemplo si quedó
  await prisma.usuario.deleteMany({ where: { username: 'tmiraflores' } });

  const hash = await bcrypt.hash(PASS_INICIAL, 10);
  let creados = 0;
  for (const t of TIENDAS) {
    const existe = await prisma.usuario.findUnique({ where: { username: t.username } });
    if (existe) {
      console.log(`  - ${t.username}: ya existe, omitido.`);
      continue;
    }
    await prisma.usuario.create({
      data: {
        username: t.username,
        nombre: t.tienda,
        passwordHash: hash,
        rol: 'tienda',
        tienda: t.tienda,
      },
    });
    creados++;
    console.log(`  + ${t.username}  →  ${t.tienda}`);
  }
  console.log('============================================');
  console.log(`Tiendas creadas: ${creados}. Contraseña inicial de todas: ${PASS_INICIAL}`);
  console.log('(Cada tienda debe cambiar su contraseña al ingresar.)');
  console.log('============================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
