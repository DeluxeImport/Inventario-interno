import { z } from 'zod';

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
  CORS_ORIGIN: z.string().optional(),
  // Notificaciones por WhatsApp vía CallMeBot (opcional). Si faltan, se desactiva.
  CALLMEBOT_PHONE: z.string().optional(),
  CALLMEBOT_APIKEY: z.string().optional(),
});

const parseCorsOrigins = (value) =>
  (value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

export function buildConfig(env = process.env) {
  const parsed = schema.safeParse(env);
  if (!parsed.success) throw parsed.error;

  const corsOrigins = parseCorsOrigins(parsed.data.CORS_ORIGIN);
  if (parsed.data.NODE_ENV === 'production' && corsOrigins.length === 0) {
    throw new Error('CORS_ORIGIN es obligatorio en producción.');
  }

  return {
    databaseUrl: parsed.data.DATABASE_URL,
    port: parsed.data.PORT,
    nodeEnv: parsed.data.NODE_ENV,
    isProd: parsed.data.NODE_ENV === 'production',
    jwtSecret: parsed.data.JWT_SECRET,
    jwtExpiresIn: parsed.data.JWT_EXPIRES_IN,
    corsOrigin: corsOrigins.length > 0 ? corsOrigins : true,
    whatsapp: {
      enabled: Boolean(parsed.data.CALLMEBOT_PHONE && parsed.data.CALLMEBOT_APIKEY),
      phone: parsed.data.CALLMEBOT_PHONE || null,
      apikey: parsed.data.CALLMEBOT_APIKEY || null,
    },
  };
}
