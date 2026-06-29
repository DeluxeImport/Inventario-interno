import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaCnotlient();

const PASS_INICIAL = 'lider123';
const LIDERES = [
  { username: 'rrhh', nombre: 'Líder RR.HH', area: 'RR.HH' },
  { username: 'marketing', nombre: 'Líder Marketing', area: 'Marketing' },
  { username: 'logistica', nombre: 'Líder Logística', area: 'Logística' },
];

async function main() {
  const hash = await bcrypt.hash(PASS_INICIAL, 10);
  let creados = 0;
  for (const l of LIDERES) {
    const existe = await prisma.usuario.findUnique({ where: { username: l.username } });
    if (existe) {
      console.log(`  - ${l.username}: ya existe, omitido.`);
      continue;
    }
    await prisma.usuario.create({
      data: {
        username: l.username,
        nombre: l.nombre,
        passwordHash: hash,
        rol: 'lider',
        area: l.area,
      },
    });
    creados++;
    console.log(`  + ${l.username}  →  Área ${l.area}`);
  }
  console.log('============================================');
  console.log(`Líderes de área creados: ${creados}. Contraseña inicial: ${PASS_INICIAL}`);
  console.log('============================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
