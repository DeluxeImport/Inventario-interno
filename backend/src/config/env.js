import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildConfig } from './buildConfig.js';

// Carga el .env (ubicado en la raíz del backend) hacia process.env
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  process.loadEnvFile(join(__dirname, '../../.env'));
} catch {
  // Si no existe .env se asume que las variables ya están en el entorno.
}

function loadConfig() {
  try {
    return buildConfig(process.env);
  } catch (err) {
    console.error('❌ Configuración inválida (.env):');
    if (err?.issues) {
      for (const issue of err.issues) console.error('  -', issue.message);
    } else {
      console.error('  -', err.message || 'Configuración inválida.');
    }
    process.exit(1);
  }
}

export const config = loadConfig();
