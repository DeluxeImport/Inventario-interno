import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';
import { esSolicitante } from '../../constants';
import Icon from '../common/Icon';
import NuevoTicketModal from './NuevoTicketModal';
import ProcesarTicketModal from './ProcesarTicketModal';
import TicketCard from './TicketCard';
import { ESTADOS_TICKET, FILTROS_TICKET } from './ticketConstants';

const PAGE_SIZE = 40;

export default function Tickets({ user, onError, onChanged }) {
  const [tickets, setTickets] = useState([]);
  const [filtro, setFiltro] = useState('TODOS');
  const [nuevo, setNuevo] = useState(false);
  const [procesando, setProcesando] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const esAdmin = user.rol === 'admin';

  const cargar = useCallback(async () => {
    try {
      const page = await api.tickets(filtro, null, PAGE_SIZE);
      setTickets(page.items);
      setNextCursor(page.nextCursor);
    } catch (error) {
      onError(error.message);
    }
  }, [filtro, onError]);

  const cargarMas = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await api.tickets(filtro, nextCursor, PAGE_SIZE);
      setTickets((actuales) => [...actuales, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch (error) {
      onError(error.message);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <div>
      <div className="toolbar">
        <div className="chips">
          {FILTROS_TICKET.map((estado) => (
            <button
              key={estado}
              className={`chip ${filtro === estado ? 'chip-on' : ''}`}
              onClick={() => setFiltro(estado)}
              aria-pressed={filtro === estado}
            >
              {estado === 'TODOS' ? 'Todas' : ESTADOS_TICKET[estado][1]}
            </button>
          ))}
        </div>
        {esSolicitante(user.rol) && (
          <button className="btn btn-primary" onClick={() => setNuevo(true)}>
            <Icon name="mas" size={13} strokeWidth={2} />
            Nueva solicitud
          </button>
        )}
      </div>

      {tickets.length === 0 ? (
        <p className="vacio">
          No hay solicitudes {filtro !== 'TODOS' ? `en estado «${ESTADOS_TICKET[filtro][1]}»` : ''}.
        </p>
      ) : (
        <div className="tickets-lista">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              esAdmin={esAdmin}
              onProcesar={setProcesando}
            />
          ))}
        </div>
      )}

      {nextCursor && (
        <div className="center" style={{ padding: '12px' }}>
          <button className="btn btn-sm" onClick={cargarMas} disabled={loadingMore}>
            {loadingMore ? 'Cargando…' : 'Cargar más'}
          </button>
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
