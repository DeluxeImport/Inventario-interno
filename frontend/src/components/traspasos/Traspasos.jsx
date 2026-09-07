import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../api/client';
import { useConfirm } from '../../hooks/useConfirm';
import { activarNotificaciones, estadoNotificaciones } from '../../lib/push';
import Icon from '../common/Icon';
import DetalleTraspasoModal from './DetalleTraspasoModal';
import NuevoTraspasoModal from './NuevoTraspasoModal';
import ResponderTraspasoModal from './ResponderTraspasoModal';
import TraspasoCard from './TraspasoCard';
import { ESTADOS_TRASPASO, FILTROS_TRASPASO } from './traspasoConstants';

const PAGE_SIZE = 40;

export default function Traspasos({ user, onError, onChanged }) {
  const confirmar = useConfirm();
  const ultimaLista = useRef('');
  const peticion = useRef(0);
  const [hayCambios, setHayCambios] = useState(false);
  const [traspasos, setTraspasos] = useState([]);
  const [filtro, setFiltro] = useState('TODOS');
  const [filtroErp, setFiltroErp] = useState('TODOS');
  const [nuevo, setNuevo] = useState(false);
  const [respondiendo, setRespondiendo] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [notifEstado, setNotifEstado] = useState('no-soportado');
  const [activandoNotif, setActivandoNotif] = useState(false);
  const esAlmacen = user.rol === 'admin' || user.rol === 'usuario';

  useEffect(() => {
    estadoNotificaciones().then(setNotifEstado).catch(() => {});
  }, []);

  const activarNotif = async () => {
    setActivandoNotif(true);
    try {
      await activarNotificaciones();
      setNotifEstado('activo');
    } catch (error) {
      onError(error.message);
    } finally {
      setActivandoNotif(false);
    }
  };

  const cargar = useCallback(async () => {
    const version = ++peticion.current;
    try {
      const page = await api.traspasos(filtro, null, PAGE_SIZE, filtroErp);
      if (version !== peticion.current) return;
      ultimaLista.current = JSON.stringify(page.items);
      setHayCambios(false);
      setTraspasos(page.items);
      setNextCursor(page.nextCursor);
    } catch (error) {
      onError(error.message);
    }
  }, [filtro, filtroErp, onError]);

  const cargarMas = async () => {
    if (!nextCursor || loadingMore) return;
    const version = peticion.current;
    setLoadingMore(true);
    try {
      const page = await api.traspasos(filtro, nextCursor, PAGE_SIZE, filtroErp);
      if (version !== peticion.current) return;
      setTraspasos((actuales) => [...actuales, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch (error) {
      onError(error.message);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    cargar();
    let activo = true;
    const timer = setInterval(async () => {
      try {
        const page = await api.traspasos(filtro, null, PAGE_SIZE, filtroErp);
        if (activo) setHayCambios(JSON.stringify(page.items) !== ultimaLista.current);
      } catch { /* Se reintenta en la siguiente actualización. */ }
    }, 30000);
    return () => { activo = false; ++peticion.current; clearInterval(timer); };
  }, [cargar, filtro, filtroErp]);

  const cancelar = async (traspaso) => {
    const ok = await confirmar({
      title: `Cancelar ${traspaso.codigo}`,
      message: `${traspaso.destinoTienda} ya no podrá confirmar su recepción.`,
      confirmLabel: 'Cancelar traspaso',
    });
    if (!ok) return;
    try {
      await api.accionTraspaso(traspaso.id, 'cancelar');
      cargar();
      onChanged?.();
    } catch (error) {
      onError(error.message);
    }
  };

  return (
    <div>
      {hayCambios && <div className="toolbar" role="status">
        <span>Hay novedades en los traspasos.</span>
        <button className="btn btn-primary" onClick={cargar}>Actualizar lista</button>
      </div>}
      {notifEstado === 'inactivo' && (
        <div className="toolbar" role="status">
          <span>
            <Icon name="megafono" size={14} /> Activa las notificaciones para enterarte de los traspasos en tu celular.
          </span>
          <button className="btn btn-primary" onClick={activarNotif} disabled={activandoNotif}>
            {activandoNotif ? 'Activando…' : 'Activar notificaciones'}
          </button>
        </div>
      )}
      <div className="toolbar">
        <div className="chips">
          {FILTROS_TRASPASO.map((estado) => (
            <button
              key={estado}
              className={`chip ${filtro === estado ? 'chip-on' : ''}`}
              onClick={() => setFiltro(estado)}
              aria-pressed={filtro === estado}
            >
              {estado === 'TODOS' ? 'Todos' : ESTADOS_TRASPASO[estado][1]}
            </button>
          ))}
        </div>
        <label>
          Sistema real
          <select value={filtroErp} onChange={(e) => setFiltroErp(e.target.value)}>
            <option value="TODOS">Todos los registros</option>
            <option value="true">Marcados como subidos</option>
            <option value="false">Sin marcar como subidos</option>
          </select>
        </label>
        {user.rol === 'tienda' && (
          <button className="btn btn-primary" onClick={() => setNuevo(true)}>
            <Icon name="mas" size={13} strokeWidth={2} />
            Nuevo traspaso
          </button>
        )}
      </div>

      {traspasos.length === 0 ? (
        <p className="vacio">
          No hay traspasos {filtro !== 'TODOS' ? `en estado «${ESTADOS_TRASPASO[filtro][1]}»` : ''}.
        </p>
      ) : (
        <div className="tickets-lista">
          {traspasos.map((t) => (
            <TraspasoCard
              key={t.id}
              traspaso={t}
              esAlmacen={esAlmacen}
              tiendaUsuario={user.tienda}
              onResponder={setRespondiendo}
              onCancelar={cancelar}
              onDetalle={esAlmacen ? setDetalle : undefined}
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
        <NuevoTraspasoModal
          user={user}
          onClose={() => setNuevo(false)}
          onSaved={() => {
            setNuevo(false);
            cargar();
            onChanged?.();
          }}
          onError={onError}
        />
      )}

      {respondiendo && (
        <ResponderTraspasoModal
          traspaso={respondiendo}
          onClose={() => setRespondiendo(null)}
          onDone={() => {
            setRespondiendo(null);
            cargar();
            onChanged?.();
          }}
          onError={onError}
        />
      )}

      {detalle && (
        <DetalleTraspasoModal
          traspaso={detalle}
          onClose={() => setDetalle(null)}
          onUpdated={cargar}
          onError={onError}
        />
      )}
    </div>
  );
}
