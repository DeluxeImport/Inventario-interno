#!/usr/bin/env bash
# ============================================================
#  Chequeo de "listo para desplegar" — Sistema de Inventario
#  Úsalo en la TERMINAL DEL SERVIDOR, dentro de la carpeta del proyecto:
#     bash check-deploy.sh
#  Te dice, punto por punto, qué está listo y qué te falta.
# ============================================================
set -u
cd "$(dirname "$0")" 2>/dev/null || exit 1

ok=0; warn=0; bad=0
OK()   { echo "  [ OK ]   $1"; ok=$((ok+1)); }
WARN() { echo "  [AVISO]  $1"; warn=$((warn+1)); }
BAD()  { echo "  [FALTA]  $1"; bad=$((bad+1)); }
titulo(){ echo; echo "== $1 =="; }

# Lee una variable del backend/.env (sin ejecutarlo). Quita comillas.
getenv() { grep -E "^$1=" backend/.env 2>/dev/null | head -1 | cut -d= -f2- | sed 's/^["'"'"']//; s/["'"'"']$//'; }

echo "============================================================"
echo "  Chequeo de despliegue — $(date '+%Y-%m-%d %H:%M')"
echo "  Carpeta: $(pwd)"
echo "============================================================"

# ---- 0. Estructura del proyecto ----
titulo "Proyecto"
[ -d backend ]  && OK "Carpeta backend/ presente"   || BAD "No se ve la carpeta backend/ (¿estás en la raíz del proyecto?)"
[ -d frontend ] && OK "Carpeta frontend/ presente"  || BAD "No se ve la carpeta frontend/"

# ---- 1. Node / npm / PM2 ----
titulo "Entorno (Node, npm, PM2)"
if command -v node >/dev/null 2>&1; then
  ver=$(node -v); maj=$(echo "$ver" | sed 's/v\([0-9]*\).*/\1/')
  if [ "${maj:-0}" -ge 18 ]; then OK "Node $ver"; else WARN "Node $ver (recomendado 18 o superior)"; fi
else BAD "Node.js no está instalado (instálalo desde el App Store de aaPanel)"; fi
command -v npm >/dev/null 2>&1 && OK "npm $(npm -v)" || BAD "npm no está disponible"
command -v pm2 >/dev/null 2>&1 && OK "PM2 instalado ($(pm2 -v))" || WARN "PM2 no está (úsalo o el gestor Node de aaPanel para mantener el backend encendido)"

# ---- 2. Configuración (.env) ----
titulo "Configuración (backend/.env)"
if [ -f backend/.env ]; then
  OK "backend/.env existe"
  JWT=$(getenv JWT_SECRET); DBU=$(getenv DATABASE_URL); NEV=$(getenv NODE_ENV); COR=$(getenv CORS_ORIGIN)
  if [ -z "$JWT" ]; then BAD "JWT_SECRET vacío"
  elif echo "$JWT" | grep -qi "reemplaza"; then BAD "JWT_SECRET sigue siendo el de ejemplo (genera uno real)"
  elif [ "${#JWT}" -lt 16 ]; then BAD "JWT_SECRET muy corto (${#JWT}); mínimo 16 caracteres"
  else OK "JWT_SECRET configurado (${#JWT} caracteres)"; fi
  [ -n "$DBU" ] && OK "DATABASE_URL configurado" || BAD "DATABASE_URL vacío"
  if [ "$NEV" = "production" ]; then OK "NODE_ENV=production"; else WARN "NODE_ENV=${NEV:-(vacío)} (en producción debe ser 'production')"; fi
  [ -n "$COR" ] && OK "CORS_ORIGIN fijado ($COR)" || WARN "CORS_ORIGIN vacío (acepta cualquier origen; en producción pon tu dominio)"
else
  BAD "Falta backend/.env  ->  cp backend/.env.example backend/.env  y complétalo"
fi

# ---- 3. Dependencias y Prisma ----
titulo "Dependencias / Base de datos"
[ -d backend/node_modules ]  && OK "Dependencias del backend instaladas" || BAD "Falta instalar backend  ->  cd backend && npm install"
[ -d frontend/node_modules ] && OK "Dependencias del frontend instaladas" || BAD "Falta instalar frontend ->  cd frontend && npm install"
if [ -d backend/node_modules/.prisma/client ] || [ -d backend/node_modules/@prisma/client ]; then
  OK "Cliente Prisma generado"
else WARN "Cliente Prisma no generado  ->  cd backend && npx prisma generate"; fi

# Tipo de base de datos y coherencia con el schema
DBU=$(getenv DATABASE_URL)
PROV=$(grep -E 'provider[[:space:]]*=' backend/prisma/schema.prisma 2>/dev/null | grep -m1 -oE '"(sqlite|postgresql|mysql)"' | tr -d '"')
case "$DBU" in
  file:*)
    [ "$PROV" = "sqlite" ] && OK "Base SQLite (provider=sqlite, coincide)" || WARN "DATABASE_URL es SQLite pero schema.prisma usa provider=$PROV"
    f="backend/prisma/$(echo "$DBU" | sed 's#^file:##; s#^\./##')"
    [ -f "$f" ] && OK "Archivo de base existe ($f)" || WARN "No se ve el archivo $f (corre las migraciones/seed)"
    ;;
  postgres*|postgresql*)
    [ "$PROV" = "postgresql" ] && OK "Base PostgreSQL (provider=postgresql, coincide)" || BAD "DATABASE_URL es Postgres pero schema.prisma usa provider=$PROV (cámbialo y corre prisma migrate)"
    WARN "Verifica que la base Postgres exista y sea accesible con esa URL"
    ;;
  "") : ;;
  *) WARN "No reconozco el tipo de DATABASE_URL" ;;
esac

# ---- 4. Build del frontend (lo que se publica) ----
titulo "Web compilada (frontend/dist)"
if [ -f frontend/dist/index.html ]; then OK "frontend/dist listo (la web está compilada)"
else BAD "Falta compilar la web  ->  cd frontend && npm run build"; fi

# ---- 5. ¿El backend está corriendo? ----
titulo "Servidor en marcha"
PORT=$(getenv PORT); PORT=${PORT:-4000}
if command -v ss >/dev/null 2>&1; then LST=$(ss -ltn 2>/dev/null); else LST=$(netstat -ltn 2>/dev/null); fi
if echo "$LST" | grep -q ":$PORT[[:space:]]"; then OK "Algo escucha en el puerto $PORT (parece que el backend ya corre)"
else WARN "Nada escucha en el puerto $PORT todavía (arráncalo con: cd backend && npm start)"; fi

# ---- Resumen ----
echo
echo "============================================================"
echo "  RESUMEN:  $ok OK   |   $warn avisos   |   $bad faltantes"
if [ "$bad" -gt 0 ]; then
  echo "  -> Aún FALTAN cosas (ver [FALTA] arriba) antes de desplegar."
elif [ "$warn" -gt 0 ]; then
  echo "  -> Casi listo. Revisa los [AVISO] (sobre todo NODE_ENV, CORS y dominio)."
else
  echo "  -> Todo en verde. Falta solo el dominio + SSL en aaPanel."
fi
echo "============================================================"
