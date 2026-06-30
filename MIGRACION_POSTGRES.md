# Migración de SQLite a PostgreSQL

Esta guía deja el sistema listo para que **8 tiendas accedan por internet** con
escrituras concurrentes reales. El código ya está endurecido (descuentos de stock
atómicos, índices, paginación, rate-limit, CORS, helmet); solo falta el corte de base
de datos, que se hace en una sola sesión cuando tú quieras.

> Estado actual del repositorio: `backend/prisma/schema.prisma` ya usa `postgresql`.
> Esta guía queda como referencia para entornos antiguos que aún tengan `dev.db`.

> El corte requiere Docker corriendo (o una base PostgreSQL de un proveedor). Por eso no
> se ejecutó automáticamente: no se toca tu `dev.db` actual hasta que tú decidas migrar.

## 1. Levantar PostgreSQL

Con Docker Desktop abierto, desde la carpeta `backend/`:

```bash
docker compose up -d
```

Esto crea la base `inventario` en `localhost:5432`. Los datos persisten en un volumen
aunque apagues el contenedor.

> Alternativa sin Docker: crea una base en Railway / Render / Neon y usa su URL de conexión.

## 2. Apuntar el backend a PostgreSQL

En `backend/.env`, cambia `DATABASE_URL`:

```env
DATABASE_URL="postgresql://inventario:inventario_local_pass@localhost:5432/inventario?schema=public"
```

## 3. Cambiar el proveedor en Prisma

En `backend/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"   // antes: "sqlite"
  url      = env("DATABASE_URL")
}
```

## 4. Ajuste de búsqueda case-insensitive (importante)

SQLite ignora mayúsculas/minúsculas por defecto; PostgreSQL **no**. Para que la búsqueda
de productos siga funcionando igual, edita `backend/src/services/producto.service.js`,
en la función `listar`:

```js
if (q) where.producto = { contains: q, mode: 'insensitive' }; // añadir mode
```

(En SQLite `mode: 'insensitive'` no es válido, por eso este cambio se aplica **junto con**
el corte a Postgres, no antes.)

## 5. Generar el esquema y sembrar datos

```bash
cd backend
npx prisma generate
npx prisma db push          # crea las tablas + índices en PostgreSQL
npm run db:setup            # o, si prefieres, corre los seeds uno a uno
```

`db:setup` ya ejecuta: generate + db push + seed + seed:admin + seed:tiendas + seed:areas.

## 6. (Opcional) Migrar los datos existentes de SQLite

Si ya tienes inventario cargado en `dev.db` que quieres conservar, la vía más simple:

1. Exporta desde SQLite a JSON con un pequeño script (puedo generártelo), o
2. Vuelve a sembrar desde el Excel/origen y recaptura los movimientos recientes.

Para un inventario que se resiembra desde Excel, normalmente la opción 1 no es necesaria.

## 7. Verificar

```bash
cd backend
node --test          # las pruebas del backend deben pasar
npm run dev          # arranca contra PostgreSQL
```

Inicia sesión (admin / admin123 si sembraste el admin) y confirma que productos,
movimientos, solicitudes y bitácora cargan.

## 8. Checklist de producción (al exponer a internet)

- [ ] **Cambiar las contraseñas por defecto** `admin123` (admin) y `tienda123`/`lider123` (tiendas/líderes) ANTES de exponer a internet.
- [ ] `NODE_ENV=production` en el `.env` del servidor.
- [ ] `JWT_SECRET` fuerte y distinto al de desarrollo.
- [ ] `CORS_ORIGIN` fijado al dominio real del frontend; en producción el backend no arranca sin este valor.
- [ ] Contraseñas nuevas con mínimo 8 caracteres.
- [ ] Cambiar `POSTGRES_PASSWORD` del docker-compose (o usar la clave del proveedor).
- [ ] HTTPS por delante (el proveedor de hosting o un proxy como Caddy/Nginx).
- [ ] Backups automáticos de la base (la mayoría de proveedores lo incluyen).
