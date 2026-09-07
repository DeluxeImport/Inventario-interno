import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, extname, join, basename } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { asyncHandler } from '../lib/asyncHandler.js';
import { auth, soloTienda, soloAlmacen } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { traspasoCrearSchema, traspasoEstadoSchema, traspasoCopiadoSchema } from '../validators/schemas.js';
import { badRequest, forbidden } from '../lib/AppError.js';
import { ROLES } from '../constants/index.js';
import { getIp } from '../utils/index.js';
import { notificarWhatsapp } from '../lib/whatsapp.js';
import { notificarPush } from '../lib/push.js';
import * as traspasos from '../services/traspaso.service.js';
import * as actividad from '../services/actividad.service.js';

// Único punto de conversión id-de-ruta -> número: rechaza de entrada cualquier
// id no numérico en vez de dejar que llegue como NaN a Prisma (que lo
// devolvería como un 500 críptico en vez de un 400 claro).
const parseId = (raw) => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw badRequest('Identificador de traspaso inválido.');
  return id;
};

// Quién puede siquiera intentar adjuntar una foto (el detalle fino de si es
// SU traspaso lo valida el servicio): evita que un rol ajeno a traspasos
// (p. ej. líder de área) escriba archivos en disco sin ningún motivo.
const puedeAdjuntarFoto = (req, _res, next) => {
  if (req.user.rol === ROLES.TIENDA || req.user.rol === ROLES.ADMIN || req.user.rol === ROLES.USUARIO) return next();
  throw forbidden('No tienes permiso para adjuntar fotos a traspasos.');
};

// backend/src/routes -> backend/uploads/traspasos
const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadsDir = join(__dirname, '../../uploads/traspasos');
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

const TIPOS_PERMITIDOS = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    // Nunca se deriva del id de la URL: un nombre generado no depende de
    // ninguna entrada del cliente, así que no hay nada que sanitizar.
    filename: (req, file, cb) =>
      cb(null, `${randomUUID()}${TIPOS_PERMITIDOS[file.mimetype] || extname(file.originalname)}`),
  }),
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB: evidencia de un producto, no fotografía profesional
  fileFilter: (req, file, cb) => {
    if (!TIPOS_PERMITIDOS[file.mimetype]) return cb(badRequest('Solo se permiten imágenes JPG, PNG o WebP.'));
    cb(null, true);
  },
});

const router = Router();
router.use(auth);

router.get(
  '/',
  asyncHandler(async (req, res) => res.json(await traspasos.listar(req.user, req.query)))
);

// Solo las tiendas crean traspasos (a otra tienda).
router.post(
  '/',
  soloTienda,
  validate(traspasoCrearSchema),
  asyncHandler(async (req, res) => {
    const t = await traspasos.crear(req.user, req.body);
    await actividad.registrar(
      req.user.id,
      'Creó traspaso',
      `${t.codigo}: ${t.origenTienda} → ${t.destinoTienda} (${t.codigoProducto} ${t.producto})`,
      getIp(req)
    );
    notificarWhatsapp(
      `🔄 Nuevo traspaso ${t.codigo}: ${t.origenTienda} → ${t.destinoTienda} — ${t.cantidad} ${t.unidad || ''} de "${t.producto}" (cód. ${t.codigoProducto}).`
    );
    traspasos
      .usuariosParaNotificarCreacion(t.destinoTienda)
      .then((usuarioIds) =>
        notificarPush(usuarioIds, {
          titulo: `Nuevo traspaso ${t.codigo}`,
          cuerpo: `${t.origenTienda} → ${t.destinoTienda}: ${t.cantidad} ${t.unidad || ''} de "${t.producto}".`,
        })
      )
      .catch((e) => console.error('[push] no se pudo resolver destinatarios:', e.message));
    res.status(201).json(t);
  })
);

// Foto opcional, adjuntada por separado (multipart) para no mezclar JSON + archivo.
// El id se valida ANTES de multer: así un id inválido nunca llega a escribir
// un archivo. Si falla después (sin permiso, traspaso inexistente), sí se
// borra el que multer ya escribió: nunca queda un huérfano en disco.
router.post(
  '/:id/foto',
  puedeAdjuntarFoto,
  (req, _res, next) => {
    req.traspasoId = parseId(req.params.id);
    next();
  },
  upload.single('foto'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw badRequest('No se recibió ninguna imagen.');
    try {
      const { traspaso: t, fotoAnterior } = await traspasos.adjuntarFoto(
        req.user,
        req.traspasoId,
        `/uploads/traspasos/${req.file.filename}`
      );
      if (fotoAnterior) unlink(join(uploadsDir, basename(fotoAnterior))).catch(() => {});
      res.json(t);
    } catch (error) {
      await unlink(req.file.path).catch(() => {});
      throw error;
    }
  })
);

// Aceptar/rechazar (tienda destino) o cancelar (tienda origen); admin/almacén puede ambas.
// La autorización fina por tienda vive en el servicio, no aquí.
router.put(
  '/:id/estado',
  validate(traspasoEstadoSchema),
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const result = await traspasos.cambiarEstado(req.user, id, req.body);
    await actividad.registrar(req.user.id, result.accionLog, result.traspaso.codigo, getIp(req));
    const t = result.traspaso;
    const ESTADO_LABEL = { ACEPTADO: 'Recibido', RECHAZADO: 'Rechazado', CANCELADO: 'Cancelado' };
    const estado = ESTADO_LABEL[t.estado] || t.estado;
    notificarWhatsapp(`Traspaso ${t.codigo}: ${estado}. ${t.origenTienda} → ${t.destinoTienda}.${t.motivoRechazo ? ` Motivo: ${t.motivoRechazo}` : ''}`);
    // Solo a quien lo creó: el otro lado ya sabe (fue quien acaba de actuar).
    notificarPush([t.solicitanteId], {
      titulo: `Traspaso ${t.codigo}: ${estado}`,
      cuerpo: `${t.origenTienda} → ${t.destinoTienda}.${t.motivoRechazo ? ` Motivo: ${t.motivoRechazo}` : ''}`,
    });
    res.json(t);
  })
);

// Checklist de almacén: ya se replicó en el ERP real.
router.put(
  '/:id/copiado',
  soloAlmacen,
  validate(traspasoCopiadoSchema),
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const t = await traspasos.marcarCopiado(req.user, id, req.body.copiado, req.body.observacion);
    res.json(t);
  })
);

router.get('/:id/erp-historial', soloAlmacen, asyncHandler(async (req, res) => {
  res.json(await traspasos.historialErp(req.user, parseId(req.params.id)));
}));

export default router;
