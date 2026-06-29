import { prisma } from '../lib/prisma.js';
import { ticketPublico, codigoTicket, destinoDeSolicitante } from '../utils/index.js';
import { notFound, badRequest } from '../lib/AppError.js';
import { ROLES, TICKET_ESTADOS, MOV_TIPOS } from '../constants/index.js';

const includeTicket = {
  items: { include: { producto: true } },
  solicitante: { select: { nombre: true, username: true, tienda: true, area: true } },
  atendidoPor: { select: { nombre: true, username: true } },
};

// El admin ve todos los tickets; los demás solo los suyos. Filtro opcional por estado.
export async function listar(user, { estado } = {}) {
  const where = {};
  if (user.rol !== ROLES.ADMIN) where.solicitanteId = user.id;
  if (estado && estado !== 'TODOS') where.estado = estado;
  const tickets = await prisma.ticket.findMany({
    where,
    include: includeTicket,
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return tickets.map(ticketPublico);
}

export async function crear(user, { area, nota, items }) {
  const limpios = (items || [])
    .map((i) => ({ productoId: Number(i.productoId), cantidad: Number(i.cantidad) }))
    .filter((i) => i.productoId && i.cantidad > 0);
  if (limpios.length === 0) throw badRequest('Agrega al menos un producto a la solicitud.');

  const ids = limpios.map((i) => i.productoId);
  const prods = await prisma.producto.findMany({ where: { id: { in: ids } } });
  if (prods.length !== ids.length || prods.some((p) => !p.solicitable))
    throw badRequest('Uno de los productos no está habilitado para solicitudes.');

  const ticket = await prisma.ticket.create({
    data: {
      area: area?.trim() || null,
      nota: nota?.trim() || null,
      solicitanteId: user.id,
      items: { create: limpios },
    },
    include: includeTicket,
  });
  return ticketPublico(ticket);
}

// Aplica los ajustes de cantidad del admin (cantidadAprobada) a los ítems del ticket.
// Semántica:
//   cantidadAprobada > 0  → se entregará esa cantidad
//   cantidadAprobada = 0  → ítem RECHAZADO dentro del ticket (no descuenta stock,
//                            no se genera Movimiento al entregar)
async function aplicarAjustes(tx, ticket, items) {
  if (!Array.isArray(items)) return;
  for (const aj of items) {
    const item = ticket.items.find((t) => t.id === Number(aj.id));
    if (!item) continue;
    const cant = Number(aj.cantidad);
    if (!Number.isInteger(cant) || cant < 0)
      throw badRequest('Las cantidades aprobadas deben ser números enteros (0 = rechazar ítem).');
    await tx.ticketItem.update({ where: { id: item.id }, data: { cantidadAprobada: cant } });
  }
}

// Calcula la cantidad efectiva a entregar de un ítem (ajuste del admin o
// cantidad solicitada por defecto). `0` indica ítem rechazado.
const cantidadEfectiva = (it) => it.cantidadAprobada ?? it.cantidad;

// Procesa el ticket (solo admin desde la ruta): aprobar | rechazar | entregar.
// `items` permite ajustar las cantidades aprobadas; `observacion` es el criterio del admin.
// Devuelve { ticket, accionLog } para que la ruta registre la actividad.
export async function cambiarEstado(actor, id, { accion, observacion, items }) {
  const ticket = await prisma.ticket.findUnique({ where: { id }, include: includeTicket });
  if (!ticket) throw notFound('Ticket no encontrado.');
  if ([TICKET_ESTADOS.ENTREGADO, TICKET_ESTADOS.RECHAZADO].includes(ticket.estado))
    throw badRequest(`El ticket ya está ${ticket.estado.toLowerCase()}.`);

  const obs = observacion?.trim() || null;

  if (accion === 'aprobar') {
    const upd = await prisma.$transaction(async (tx) => {
      // Reclamo atómico: solo una operación puede transicionar el ticket (evita doble procesamiento).
      const claim = await tx.ticket.updateMany({
        where: { id, estado: { in: [TICKET_ESTADOS.PENDIENTE, TICKET_ESTADOS.APROBADO] } },
        data: { estado: TICKET_ESTADOS.APROBADO },
      });
      if (claim.count === 0)
        throw badRequest('El ticket ya fue procesado por otra operación. Recarga la lista.');
      await aplicarAjustes(tx, ticket, items);
      return tx.ticket.update({
        where: { id },
        data: {
          estado: TICKET_ESTADOS.APROBADO,
          atendidoPorId: actor.id,
          observacionAdmin: obs ?? ticket.observacionAdmin,
        },
        include: includeTicket,
      });
    });
    return { ticket: ticketPublico(upd), accionLog: 'Aprobó ticket' };
  }

  if (accion === 'rechazar') {
    // Reclamo atómico: evita que un ticket ya procesado se rechace por una segunda petición.
    const claim = await prisma.ticket.updateMany({
      where: { id, estado: { in: [TICKET_ESTADOS.PENDIENTE, TICKET_ESTADOS.APROBADO] } },
      data: { estado: TICKET_ESTADOS.RECHAZADO, atendidoPorId: actor.id, motivoRechazo: obs },
    });
    if (claim.count === 0)
      throw badRequest('El ticket ya fue procesado por otra operación. Recarga la lista.');
    const upd = await prisma.ticket.findUnique({ where: { id }, include: includeTicket });
    return { ticket: ticketPublico(upd), accionLog: 'Rechazó ticket' };
  }

  if (accion === 'entregar') {
    const destino = destinoDeSolicitante(ticket.solicitante);
    const result = await prisma.$transaction(async (tx) => {
      // Reclamo atómico ANTES de tocar stock: si otra entrega ya tomó el ticket, count===0
      // y abortamos (rollback), impidiendo el doble descuento de inventario.
      const claim = await tx.ticket.updateMany({
        where: { id, estado: { in: [TICKET_ESTADOS.PENDIENTE, TICKET_ESTADOS.APROBADO] } },
        data: { estado: TICKET_ESTADOS.ENTREGADO },
      });
      if (claim.count === 0)
        throw badRequest('El ticket ya fue procesado por otra operación. Recarga la lista.');
      await aplicarAjustes(tx, ticket, items);
      // Recargar ítems con la cantidad aprobada ya aplicada.
      const finales = await tx.ticketItem.findMany({
        where: { ticketId: id },
        include: { producto: true },
      });
      // Ítems con cantidad efectiva 0 = rechazados → se ignoran al entregar.
      // Solo los que tienen cantidad > 0 mueven stock y generan Movimiento.
      const aEntregar = finales.filter((it) => cantidadEfectiva(it) > 0);
      if (aEntregar.length === 0)
        throw badRequest(
          'Todos los ítems quedaron rechazados. Usa "Rechazar" para rechazar el ticket completo.'
        );
      for (const it of aEntregar) {
        const efectiva = cantidadEfectiva(it);
        if (it.producto.stockCompleto < efectiva)
          throw badRequest(
            `Stock insuficiente de "${it.producto.producto}". Disponible: ${it.producto.stockCompleto}, a entregar: ${efectiva}.`
          );
      }
      for (const it of aEntregar) {
        const efectiva = cantidadEfectiva(it);
        // Descuento atómico: solo descuenta si TODAVÍA hay stock suficiente en este instante.
        // El guard `stockCompleto >= efectiva` cierra la condición de carrera entre entregas
        // concurrentes (dos admins entregando el mismo producto a la vez no pueden sobregirar).
        const res = await tx.producto.updateMany({
          where: { id: it.productoId, stockCompleto: { gte: efectiva } },
          data: { stockCompleto: { decrement: efectiva } },
        });
        if (res.count === 0)
          throw badRequest(
            `Stock insuficiente de "${it.producto.producto}": otra operación modificó el inventario. Revisa el stock e intenta de nuevo.`
          );
        await tx.movimiento.create({
          data: {
            productoId: it.productoId,
            tipo: MOV_TIPOS.SALIDA,
            cantidad: efectiva,
            destino,
            responsable: actor.nombre,
            observacion: `Ticket ${codigoTicket(id)}`,
          },
        });
      }
      return tx.ticket.update({
        where: { id },
        data: {
          estado: TICKET_ESTADOS.ENTREGADO,
          atendidoPorId: actor.id,
          observacionAdmin: obs ?? ticket.observacionAdmin,
        },
        include: includeTicket,
      });
    });
    return { ticket: ticketPublico(result), accionLog: 'Entregó ticket' };
  }

  throw badRequest('Acción inválida.');
}
