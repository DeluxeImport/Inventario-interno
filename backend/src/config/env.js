import { z } from 'zod';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Carga el .env (ubicado en la raíz del backend) hacia process.env
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  process.loadEnvFile(join(__dirname, '../../.env'));
} catch {
  // Si no existe .env se asume que las variables ya están en el entorno.
}

const schema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatorio'),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.string().default('development'),
  JWT_SECRET: z
    .string()
    .min(
      16,
      'JWT_SECRET es obligatorio y debe tener al menos 16 caracteres. Genera uno con: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
    ),
  JWT_EXPIRES_IN: z.string().default('12h'),
  // Orígenes permitidos para CORS, separados por coma (ej. "https://inventario.midominio.com").
  // Si se omite, se permite cualquier origen (cómodo en desarrollo / red local).
  CORS_ORIGIN: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Configuración inválida (.env):');
  for (const issue of parsed.error.issues) console.error('  -', issue.message);
  process.exit(1);
}

export const config = {
  databaseUrl: parsed.data.DATABASE_URL,
  port: parsed.data.PORT,
  nodeEnv: parsed.data.NODE_ENV,
  isProd: parsed.data.NODE_ENV === 'production',
  jwtSecret: parsed.data.JWT_SECRET,
  jwtExpiresIn: parsed.data.JWT_EXPIRES_IN,
  // Array de orígenes permitidos, o `true` (cualquier origen) si no se configuró.
  corsOrigin: parsed.data.CORS_ORIGIN
    ? parsed.data.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
    : true,
};
