import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123'; // contraseña inicial — cámbiala desde el sistema

async function main() {
  const existe = await prisma.usuario.findUnique({ where: { username: ADMIN_USER } });
  if (existe) {
    console.log(`El usuario "${ADMIN_USER}" ya existe. No se hizo nada.`);
    return;
  }
  const passwordHash = await bcrypt.hash(ADMIN_PASS, 10);
  await prisma.usuario.create({
    data: { username: ADMIN_USER, nombre: 'Administrador', passwordHash, rol: 'admin' },
  });
  console.log('====================================');
  console.log(' Usuario administrador creado:');
  console.log(`   Usuario:     ${ADMIN_USER}`);
  console.log(`   Contraseña:  ${ADMIN_PASS}`);
  console.log(' (Cámbiala luego de iniciar sesión)');
  console.log('====================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
