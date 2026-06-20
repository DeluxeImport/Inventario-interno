# 📦 Gestión de Inventario — Sistema web interno

Sistema full-stack para el control interno del almacén de productos de utilería.
Datos precargados desde el Excel original (70 productos en 7 categorías).

## Tecnología

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Base de datos:** SQLite (vía Prisma ORM)

## Funciones

- ✅ **Login administrativo** — acceso con usuario y contraseña (contraseñas encriptadas con bcrypt + sesión JWT).
- ✅ **Gestión de usuarios** (solo admin) — crear, editar, activar/desactivar y eliminar usuarios.
- ✅ **Roles y permisos:**
  - **Administrador:** acceso total (inventario, movimientos, tickets, dashboard, usuarios y bitácora).
  - **Usuario (almacén):** ve todo menos el panel de administración.
  - **Tienda:** acceso restringido — **solo** crea solicitudes (Tickets) y ve las suyas. No ve inventario, movimientos ni dashboard (bloqueado también a nivel de API). Cada usuario Tienda tiene un nombre de tienda que aparece en sus tickets.
- ✅ **Registro de IP** — se guarda la IP y la fecha del último inicio de sesión de cada usuario.
- ✅ **Bitácora de actividad** — registra quién hizo qué (login, productos, movimientos, usuarios) y desde qué IP, con filtro por usuario.
- ✅ **Tickets / Solicitudes** — cualquier usuario pide productos al inventario; solo se pueden solicitar productos marcados como *Solicitable* (🎫). Un mismo ticket admite varios productos (carrito). Solo el admin **aprueba / entrega / rechaza**; al **entregar**, descuenta el stock automáticamente (genera salidas con referencia al ticket). Estados: Pendiente → Aprobado → Entregado, o Rechazado.
- ✅ **Registrar entradas y salidas** — cada movimiento ajusta el stock automáticamente (con fecha, responsable y observación).
- ✅ **Alertas de stock mínimo** — productos en *Stock bajo* o *Agotado* se resaltan y se listan en el Dashboard.
- ✅ **Buscar y filtrar** — por nombre de producto y por categoría.
- ✅ **Agregar / editar / eliminar** productos del catálogo.

## 🔑 Acceso inicial

Al instalar se crea un usuario administrador:

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | `admin123` | Administrador |

### Tiendas (8 usuarios, contraseña inicial `tienda123`)

| Usuario | Tienda |
|---------|--------|
| `cosmeticos` | Cosmeticos |
| `deluxe` | Deluxe Import |
| `coralnails` | Coral Nails |
| `missbeauty` | Miss Beauty |
| `coralbarber` | Coral Barber |
| `capitanbarber` | Capitan Barber |
| `coralstore` | Coral Store |
| `nova` | Nova |

> **Solo las tiendas crean solicitudes (tickets).** El administrador **no** puede crear solicitudes: únicamente las procesa (Aprobar → Entregar) o las Rechaza con una observación obligatoria.

> **Importante:** cambia las contraseñas después del primer ingreso. Desde *Administración → Usuarios → Editar* puedes cambiar la contraseña y crear más usuarios.
> El secreto de las sesiones está en `backend/.env` (`JWT_SECRET`) — conviene reemplazarlo por uno propio largo y aleatorio.

## Cómo usarlo (Windows)

### 1. Instalar (solo la primera vez)
Doble clic en **`instalar.bat`** — instala dependencias, crea la base de datos y carga los 70 productos.

### 2. Iniciar
Doble clic en **`iniciar.bat`** — abre el backend y el frontend.
Luego entra en el navegador a: **http://localhost:5180**

Para detener: cierra las dos ventanas de consola.

## Arquitectura

Proyecto organizado en capas, con responsabilidades separadas.

### Backend (`backend/src/`) — arquitectura por capas

```
src/
├── index.js               Punto de entrada (arranca el servidor)
├── app.js                 Crea la app Express y monta routers + manejo de errores
├── config/env.js          Carga y VALIDA variables de entorno con zod
├── lib/
│   ├── prisma.js          Instancia única de Prisma
│   ├── asyncHandler.js    Envuelve handlers async → errores al manejador central
│   ├── AppError.js        Errores de aplicación con código HTTP
│   └── errorHandler.js    Manejo central de errores (zod / AppError / Prisma)
├── constants/index.js     ROLES, ESTADOS, TIPOS (sin strings mágicos)
├── utils/index.js         getIp, withEstado, publicUser, codigoTicket
├── middleware/
│   ├── auth.js            auth, adminOnly, denyTienda, tiendaOnly
│   └── validate.js        Valida req.body con un esquema zod
├── validators/schemas.js  Esquemas zod de cada endpoint
├── services/              Lógica de negocio (uno por entidad)
│   ├── auth · producto · movimiento · ticket · usuario · actividad
└── routes/                Capa HTTP delgada (un router por recurso)
    ├── auth · productos · movimientos · tickets · usuarios · actividades · catalogo
tests/unit.test.js         Tests de la lógica crítica (node --test)
```

Flujo de una petición: **route** (HTTP + validación) → **service** (negocio + Prisma) → **DB**.
Errores: se lanzan como `AppError`/`ZodError` y los traduce un único `errorHandler`.

### Frontend (`frontend/src/`) — componentes por dominio

```
src/
├── main.jsx · App.jsx           Shell: sesión, layout y enrutado por vista
├── constants.js                 Permisos por rol, pestañas, etiquetas
├── api/client.js                Cliente HTTP (token, manejo de 401)
├── lib/format.js                Utilidades de formato
└── components/
    ├── Login.jsx · Header.jsx
    ├── common/        Modal, EstadoBadge
    ├── inventario/    Inventario, ProductoModal, MovimientoModal
    ├── movimientos/   Movimientos
    ├── dashboard/     Dashboard
    ├── tickets/       Tickets
    └── admin/         Admin, Usuarios, UsuarioModal, Bitacora
```

## Desarrollo

- **Variables de entorno:** copia `backend/.env.example` a `backend/.env`. `JWT_SECRET` es obligatorio (mínimo 16 caracteres); genera uno con
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. Si falta o es inválido, el servidor no arranca y avisa qué falta.
- **Tests:** `cd backend && npm test` (usa el runner nativo de Node, sin dependencias extra).
- **Validación:** todas las entradas de la API se validan con **zod**; las contraseñas se guardan con **bcrypt** y las sesiones usan **JWT**.

## Notas

- Los movimientos de **entrada/salida** ajustan el campo **Stock completo**. El **Stock incompleto** (paquetes abiertos) se edita manualmente desde el botón *Editar*.
- El **Stock total** = completo + incompleto. La alerta salta cuando `total ≤ mínimo`.
- La base de datos vive en `backend/prisma/dev.db`. Para reiniciar todo desde cero, borra ese archivo y vuelve a correr `instalar.bat`.
