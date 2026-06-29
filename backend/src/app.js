import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import { config } from './config/env.js';
import { errorHandler, notFoundHandler } from './lib/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import productosRoutes from './routes/productos.routes.js';
import movimientosRoutes from './routes/movimientos.routes.js';
import ticketsRoutes from './routes/tickets.routes.js';
import usuariosRoutes from './routes/usuarios.routes.js';
import actividadesRoutes from './routes/actividades.routes.js';
import catalogoRoutes from './routes/catalogo.routes.js';
import tiendasRoutes from './routes/tiendas.routes.js';

// Carpeta del frontend ya compilado (frontend/dist), relativa a este archivo (backend/src).
const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '../../frontend/dist');

// Limita los intentos de inicio de sesión por IP (mitiga fuerza bruta de credenciales).
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // 20 intentos por ventana por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesión. Espera unos minutos e intenta de nuevo.' },
});

export function createApp() {
  const app = express();
  // Confiamos solo en el PRIMER proxy (reverse proxy / hosting). `true` permitiría
  // falsificar X-Forwarded-For y burlar el rate-limit de login.
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '1mb' }));

  app.use('/api/auth/login', loginLimiter);
  app.use('/api/auth', authRoutes);
  app.use('/api/productos', productosRoutes);
  app.use('/api/movimientos', movimientosRoutes);
  app.use('/api/tickets', ticketsRoutes);
  app.use('/api/usuarios', usuariosRoutes);
  app.use('/api/actividades', actividadesRoutes);
  app.use('/api/tiendas', tiendasRoutes); // /publicas (sin auth, para login)
  app.use('/api', catalogoRoutes); // /categorias, /stats, /solicitables

  // 404 en JSON solo para rutas de API no encontradas.
  app.use('/api', notFoundHandler);

  // Servicio unificado: si existe el build del frontend, se sirve aquí mismo,
  // de modo que la web y la API corren en un solo proceso y puerto.
  if (existsSync(distDir)) {
    app.use(express.static(distDir));
    // Cualquier otra ruta (no /api) devuelve index.html para que la SPA funcione al recargar.
    app.get('*', (_req, res) => res.sendFile(join(distDir, 'index.html')));
  } else {
    app.use(notFoundHandler);
  }

  app.use(errorHandler);
  return app;
}
