import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { esSolicitante } from '../../constants';

const ESTADOS = {
  PENDIENTE: ['bajo', 'Pendiente'],
  APROBADO: ['mov', 'Aprobado'],
  ENTREGADO: ['ok', 'Entregado'],
  RECHAZADO: ['agotado', 'Rechazado'],
};
const fmt = (f) => new Date(f).toLocaleString('es-PE');

function EstadoTicket({ estado }) {
  const [cls, label] = ESTADOS[estado] || ESTADOS.PENDIENTE;
  return <span className={`badge badge-${cls}`}>{label}</span>;
}

// ---------- Modal: nueva solicitud (carrito) ----------
function NuevoTicketModal({ onClose, onSaved, onError }) {
  const [solicitables, setSolicitables] = useState([]);
  const [area, setArea] = useState('');
  const [nota, setNota] = useState('');
  const [items, setItems] = useState([]);
  const [prodSel, setProdSel] = useState('');
  const [cant, setCant] = useState(1);

  useEffect(() => {
    api.solicitables().then(setSolicitables).catch((e) => onError(e.message));
  }, [onError]);

  const prodActual = solicitables.find((s) => s.id === Number(prodSel));

  const agregar = () => {
    const p = prodActual;
    if (!p || cant < 1) return;
    setItems((prev) => {
      const existe = prev.find((i) => i.productoId === p.id);
      if (existe)
        return prev.map((i) =>
          i.productoId === p.id ? { ...i, cantidad: i.cantidad + Number(cant) } : i
        );
      return [...prev, { productoId: p.id, producto: p.producto, unidad: p.unidad, cantidad: Number(cant) }];
    });
    setProdSel('');
    setCant(1);
  };

  const quitar = (id) => setItems((prev) => prev.filter((i) => i.productoId !== id));

  const guardar = async (e) => {
    e.preventDefault();
    if (items.length === 0) return onError('Agrega al menos un producto.');
    try {
      await api.crearTicket({
        area,
        nota,
        items: items.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })),
      });
      onSaved();
    } catch (err) {
      onError(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Nueva solicitud</h3>
          <button className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <form className="form" onSubmit={guardar}>
          <div className="grid2">
            <label>
              Motivo
              <input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Ej. Reposición de stock"
              />
            </label>
            <label>
              Nota (opcional)
              <input value={nota} onChange={(e) => setNota(e.target.value)} />
            </label>
          </div>

          {solicitables.length === 0 ? (
            <p className="muted">
              No hay productos habilitados para solicitud. Un administrador debe marcarlos como
              «Solicitable» en el inventario.
            </p>
          ) : (
            <div className="add-producto">
              <select
                className="add-select"
                value={prodSel}
                onChange={(e) => setProdSel(e.target.value)}
              >
                <option value="">Elegir producto...</option>
                {solicitables.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.producto} ({p.categoria}) · stock {p.stockCompleto}
                  </option>
                ))}
              </select>
              <div className="add-row2">
                <div className="cant-field">
                  <span>Cant.</span>
                  <input
                    type="number"
                    min="1"
                    value={cant}
                    onChange={(e) => setCant(e.target.value)}
                    className="cant-input"
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-primary add-btn"
                  onClick={agregar}
                  disabled={!prodSel}
                >
                  Agregar al pedido
                </button>
              </div>
            </div>
          )}

          {items.length > 0 && (
            <div className="cart">
              {items.map((i) => (
                <div key={i.productoId} className="cart-row">
                  <span className="cart-name">{i.producto}</span>
                  <span className="cart-qty">
                    {i.cantidad} {i.unidad}
                  </span>
                  <button type="button" className="icon-btn" onClick={() => quitar(i.productoId)}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="modal-foot">
            <button type="button" className="btn" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={items.length === 0}>
              Enviar solicitud
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------- Modal: procesar (admin ajusta cantidades + observación) ----------
function ProcesarTicketModal({ ticket, onClose, onDone, onError }) {
  const [items, setItems] = useState(
    ticket.items.map((it) => ({
      id: it.id,
      producto: it.producto?.producto,
      unidad: it.producto?.unidad,
      solicitada: it.cantidad,
      cantidad: it.cantidadAprobada ?? it.cantidad,
    }))
  );
  const [obs, setObs] = useState(ticket.observacionAdmin || '');
  const [busy, setBusy] = useState(false);
  const setCant = (id, v) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, cantidad: v } : i)));

  const ejecutar = async (accion) => {
    if (accion === 'rechazar' && !obs.trim()) {
      onError('Coloca una observación para rechazar la solicitud.');
      return;
    }
    if (
      accion === 'entregar' &&
      !window.confirm(`¿Entregar ${ticket.codigo}? Se descontará el stock con las cantidades indicadas.`)
    )
      return;
    setBusy(true);
    try {
      await api.accionTicket(ticket.id, accion, {
        observacion: obs,
        items: items.map((i) => ({ id: i.id, cantidad: Number(i.cantidad) })),
      });
      onDone();
    } catch (e) {
      onError(e.message);
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Procesar {ticket.codigo}</h3>
          <button className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="form">
          <p className="muted">
            Revisa y ajusta la cantidad a entregar de cada producto según tu criterio.
          </p>
          <div className="proc-items">
            {items.map((i) => (
              <div key={i.id} className="proc-row">
                <span className="proc-name">{i.producto}</span>
                <span className="proc-sol">
                  pidió {i.solicitada} {i.unidad}
                </span>
                <input
                  type="number"
                  min="1"
                  value={i.cantidad}
                  onChange={(e) => setCant(i.id, e.target.value)}
                  className="cant-input"
                />
                <span className="proc-uni">{i.unidad}</span>
              </div>
            ))}
          </div>
          <label>
            Observación / criterio
            <textarea
              rows="3"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Ej. Se aprueba 1 porque el stock es limitado y cubre la necesidad real."
            />
          </label>
          <div className="modal-foot proc-foot">
            <button className="btn btn-danger" disabled={busy} onClick={() => ejecutar('rechazar')}>
              Rechazar
            </button>
            <span className="proc-spacer" />
            <button className="btn" disabled={busy} onClick={() => ejecutar('aprobar')}>
              Aprobar
            </button>
            <button className="btn btn-ok" disabled={busy} onClick={() => ejecutar('entregar')}>
              Entregar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Tarjeta de ticket ----------
function TicketCard({ ticket, esAdmin, onProcesar }) {
  const procesable = ticket.estado === 'PENDIENTE' || ticket.estado === 'APROBADO';
  return (
    <div className="ticket-card">
      <div className="ticket-top">
        <div>
          <span className="ticket-cod">{ticket.codigo}</span>
          <EstadoTicket estado={ticket.estado} />
        </div>
        <span className="ticket-fecha">{fmt(ticket.createdAt)}</span>
      </div>
      <div className="ticket-meta">
        {(ticket.solicitante?.tienda || ticket.solicitante?.area) && (
          <span>
            {ticket.solicitante?.tienda ? '🏬' : '🏢'}{' '}
            <strong>{ticket.solicitante.tienda || ticket.solicitante.area}</strong>
          </span>
        )}
        <span>👤 {ticket.solicitante?.nombre}</span>
        {ticket.area && <span>🏷️ {ticket.area}</span>}
      </div>
      <ul className="ticket-items">
        {ticket.items.map((it) => {
          const ajustada = it.cantidadAprobada != null && it.cantidadAprobada !== it.cantidad;
          return (
            <li key={it.id}>
              <span>{it.producto?.producto}</span>
              {ajustada ? (
                <strong className="qty-adj">
                  <s>{it.cantidad}</s> → {it.cantidadAprobada} {it.producto?.unidad}
                </strong>
              ) : (
                <strong>
                  {it.cantidad} {it.producto?.unidad}
                </strong>
              )}
            </li>
          );
        })}
      </ul>
      {ticket.nota && <p className="ticket-nota">📝 {ticket.nota}</p>}
      {ticket.observacionAdmin && (
        <p className="ticket-nota criterio">📋 Criterio: {ticket.observacionAdmin}</p>
      )}
      {ticket.estado === 'RECHAZADO' && ticket.motivoRechazo && (
        <p className="ticket-nota rechazo">❌ {ticket.motivoRechazo}</p>
      )}
      {ticket.atendidoPor && ticket.estado !== 'PENDIENTE' && (
        <p className="ticket-aten">Atendido por {ticket.atendidoPor.nombre}</p>
      )}

      {esAdmin && procesable && (
        <div className="ticket-actions">
          <button className="btn btn-sm btn-primary" onClick={() => onProcesar(ticket)}>
            Procesar
          </button>
        </div>
      )}
    </div>
  );
}

// ---------- Vista principal ----------
export default function Tickets({ user, onError, onChanged }) {
  const [tickets, setTickets] = useState([]);
  const [filtro, setFiltro] = useState('TODOS');
  const [nuevo, setNuevo] = useState(false);
  const [procesando, setProcesando] = useState(null);
  const esAdmin = user.rol === 'admin';

  const cargar = useCallback(async () => {
    try {
      setTickets(await api.tickets(filtro));
    } catch (e) {
      onError(e.message);
    }
  }, [filtro, onError]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const filtros = ['TODOS', 'PENDIENTE', 'APROBADO', 'ENTREGADO', 'RECHAZADO'];

  return (
    <div>
      <div className="toolbar">
        <div className="chips">
          {filtros.map((f) => (
            <button
              key={f}
              className={`chip ${filtro === f ? 'chip-on' : ''}`}
              onClick={() => setFiltro(f)}
            >
              {f === 'TODOS' ? 'Todos' : ESTADOS[f][1]}
            </button>
          ))}
        </div>
        {esSolicitante(user.rol) && (
          <button className="btn btn-primary" onClick={() => setNuevo(true)}>
            + Nueva solicitud
          </button>
        )}
      </div>

      {tickets.length === 0 ? (
        <p className="muted center" style={{ padding: '40px 0' }}>
          No hay solicitudes {filtro !== 'TODOS' ? `en estado "${ESTADOS[filtro][1]}"` : ''}.
        </p>
      ) : (
        <div className="tickets-grid">
          {tickets.map((t) => (
            <TicketCard key={t.id} ticket={t} esAdmin={esAdmin} onProcesar={setProcesando} />
          ))}
        </div>
      )}

      {nuevo && (
        <NuevoTicketModal
          onClose={() => setNuevo(false)}
          onSaved={() => {
            setNuevo(false);
            cargar();
          }}
          onError={onError}
        />
      )}

      {procesando && (
        <ProcesarTicketModal
          ticket={procesando}
          onClose={() => setProcesando(null)}
          onDone={() => {
            setProcesando(null);
            cargar();
            onChanged?.();
          }}
          onError={onError}
        />
      )}
    </div>
  );
}
