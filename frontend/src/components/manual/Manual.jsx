import Icon from '../common/Icon';
import { esSolicitante } from '../../constants';

// El PDF completo se sirve desde `public/manual.pdf`; la guía visual para
// solicitantes desde `public/guia-solicitud.png`.
const PDF_URL = '/manual.pdf';
const GUIA_URL = '/guia-solicitud.jpg';

const CONTENIDO = [
  'Cómo iniciar sesión en cada portal (Administración, Áreas, Tiendas).',
  'Consultar el inventario, buscar y filtrar productos.',
  'Registrar entradas y salidas de stock.',
  'Crear una solicitud y cómo el administrador la procesa.',
  'Leer el panel y las alertas de reposición.',
  'Administrar usuarios y consultar la bitácora.',
];

// Manual según el rol: tiendas y áreas ven la guía visual para pedir; el equipo
// de almacén y administración ve el manual completo en PDF.
export default function Manual({ user }) {
  return esSolicitante(user.rol) ? <GuiaSolicitud /> : <ManualPDF />;
}

// ---------- Tiendas y áreas: guía visual ----------
function GuiaSolicitud() {
  return (
    <div className="manual">
      <div className="manual-hero">
        <span className="manual-hero-ico" aria-hidden="true">
          <Icon name="libro" size={26} />
        </span>
        <div className="manual-hero-txt">
          <h3>Cómo generar una solicitud</h3>
          <p>Guía paso a paso para pedir productos al almacén.</p>
        </div>
        <a className="btn btn-primary manual-descargar" href={GUIA_URL} target="_blank" rel="noreferrer">
          <Icon name="descarga" size={14} className="rot" />
          Ver en grande
        </a>
      </div>

      <div className="guia-imagen">
        <img src={GUIA_URL} alt="Guía paso a paso para crear una nueva solicitud" />
      </div>
    </div>
  );
}

// ---------- Almacén y administración: manual completo en PDF ----------
function ManualPDF() {
  return (
    <div className="manual">
      <div className="manual-hero">
        <span className="manual-hero-ico" aria-hidden="true">
          <Icon name="libro" size={26} />
        </span>
        <div className="manual-hero-txt">
          <h3>Manual del sistema</h3>
          <p>Guía paso a paso, en lenguaje sencillo, para usar la aplicación.</p>
        </div>
        <a className="btn btn-primary manual-descargar" href={PDF_URL} download="Manual-Gestion-de-Inventario.pdf">
          <Icon name="descarga" size={14} />
          Descargar PDF
        </a>
      </div>

      <div className="manual-contenido">
        <h4>Qué encontrarás dentro</h4>
        <ul>
          {CONTENIDO.map((c, i) => (
            <li key={i}>
              <Icon name="check" size={14} />
              {c}
            </li>
          ))}
        </ul>
      </div>

      <div className="manual-vista-head">
        <span>Vista previa</span>
        <a href={PDF_URL} target="_blank" rel="noreferrer">
          Abrir en pestaña nueva
          <Icon name="descarga" size={13} className="rot" />
        </a>
      </div>
      <div className="manual-vista">
        <object data={PDF_URL} type="application/pdf" aria-label="Vista previa del manual">
          <p className="manual-fallback">
            Tu navegador no puede mostrar la vista previa aquí.{' '}
            <a href={PDF_URL} target="_blank" rel="noreferrer">
              Abre el manual en una pestaña nueva
            </a>
            .
          </p>
        </object>
      </div>
    </div>
  );
}
