// Favicon animado para peticiones en curso: la "C" de Coral con un arco que
// orbita y un punto que la recorre, alternando entre el coral de marca y el
// azul ultramar en cada vuelta. Se activa/desactiva por conteo de referencias
// para que varias peticiones simultáneas no lo corten a mitad de camino
// (ver startLoadingFavicon/stopLoadingFavicon, usados en api/client.js).

const SIZE = 64;
const CENTER = SIZE / 2;
const C_RADIUS = 20;
const C_STROKE = 9;
const ORBIT_RADIUS = 28;
const ORBIT_STROKE = 4.5;
const C_GAP = (56 * Math.PI) / 180;
const TRAIL_LENGTH = Math.PI * 0.85;
const STEP = 0.2;
const FRAME_MS = 60;
const STATIC_HREF = '/favicon.png';
// El backend suele responder en pocos milisegundos: sin este piso, la
// animación arranca y termina entre dos pintados del navegador y nunca
// llega a verse. Se sostiene un mínimo, aunque la petición ya haya acabado.
const MIN_VISIBLE_MS = 600;

const ACCENT = [235, 100, 69];
const NAVY = [46, 44, 126];

// El PNG del favicon (y el trazo del anillo animado) tienen fondo
// transparente: sobre la pestaña oscura de Chrome/Edge en modo oscuro del
// sistema se pierden. En ese modo, respaldamos con un disco blanco detrás;
// en modo claro no se toca nada.
const darkQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
const isDarkMode = () => darkQuery?.matches ?? false;
let darkFaviconHref = null;

function buildDarkFavicon() {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 512;
      const cx = c.getContext('2d');
      cx.fillStyle = '#ffffff';
      cx.beginPath();
      cx.arc(256, 256, 256, 0, Math.PI * 2);
      cx.fill();
      cx.drawImage(img, 0, 0, 512, 512);
      resolve(c.toDataURL('image/png'));
    };
    img.src = STATIC_HREF;
  });
}

async function resolveStaticHref() {
  if (!isDarkMode()) return STATIC_HREF;
  if (!darkFaviconHref) darkFaviconHref = await buildDarkFavicon();
  return darkFaviconHref;
}

let canvas = null;
let ctx = null;
let link = null;
let timer = null;
let refCount = 0;
let angle = 0;
let colorPhase = 0;
let activeSince = 0;
let pendingStop = null;

function ensureSetup() {
  if (canvas) return;
  canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  ctx = canvas.getContext('2d');

  link = document.querySelector('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
}

// Aplica el favicon estático correcto para el tema actual, salvo que haya
// una animación de carga en curso (no la interrumpe a medio giro).
async function applyStaticFavicon() {
  ensureSetup();
  if (timer) return;
  link.href = await resolveStaticHref();
}

darkQuery?.addEventListener('change', () => {
  darkFaviconHref = null;
  applyStaticFavicon();
});
applyStaticFavicon();

function drawFrame() {
  ctx.clearRect(0, 0, SIZE, SIZE);

  if (isDarkMode()) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // La "C": marca fija en coral, siempre presente como ancla visual.
  ctx.lineCap = 'round';
  ctx.lineWidth = C_STROKE;
  ctx.strokeStyle = `rgb(${ACCENT.join(',')})`;
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, C_RADIUS, C_GAP, Math.PI * 2 - C_GAP);
  ctx.stroke();

  // Cometa orbital: el color activo va del carril anterior al vigente,
  // así el cambio de color se ve como un barrido, no como un salto.
  const from = colorPhase ? ACCENT : NAVY;
  const to = colorPhase ? NAVY : ACCENT;
  const mix = Math.min(angle / (Math.PI * 2), 1);
  const trailColor = from.map((c, i) => Math.round(c + (to[i] - c) * mix));

  const segments = 20;
  for (let i = 0; i < segments; i++) {
    const t0 = angle + (TRAIL_LENGTH * i) / segments;
    const t1 = angle + (TRAIL_LENGTH * (i + 1)) / segments;
    const alpha = (0.08 + 0.92 * (i / segments)).toFixed(3);
    ctx.beginPath();
    ctx.strokeStyle = `rgba(${trailColor.join(',')}, ${alpha})`;
    ctx.lineWidth = ORBIT_STROKE;
    ctx.arc(CENTER, CENTER, ORBIT_RADIUS, t0, t1);
    ctx.stroke();
  }

  // Punto guía en la cabeza del cometa.
  const headAngle = angle + TRAIL_LENGTH;
  const dotX = CENTER + ORBIT_RADIUS * Math.cos(headAngle);
  const dotY = CENTER + ORBIT_RADIUS * Math.sin(headAngle);
  ctx.beginPath();
  ctx.fillStyle = `rgb(${trailColor.join(',')})`;
  ctx.arc(dotX, dotY, ORBIT_STROKE * 0.85, 0, Math.PI * 2);
  ctx.fill();
}

function tick() {
  angle += STEP;
  if (angle >= Math.PI * 2) {
    angle -= Math.PI * 2;
    colorPhase = colorPhase ? 0 : 1;
  }
  drawFrame();
  link.href = canvas.toDataURL('image/png');
}

export function startLoadingFavicon() {
  ensureSetup();
  refCount += 1;
  if (pendingStop) {
    clearTimeout(pendingStop);
    pendingStop = null;
  }
  if (!timer) {
    angle = 0;
    colorPhase = 0;
    activeSince = performance.now();
    timer = setInterval(tick, FRAME_MS);
  }
}

export function stopLoadingFavicon() {
  refCount = Math.max(0, refCount - 1);
  if (refCount > 0) return;

  const remaining = MIN_VISIBLE_MS - (performance.now() - activeSince);
  if (remaining > 0) {
    pendingStop = setTimeout(finishStop, remaining);
  } else {
    finishStop();
  }
}

function finishStop() {
  pendingStop = null;
  if (refCount > 0 || !timer) return;
  clearInterval(timer);
  timer = null;
  resolveStaticHref().then((href) => {
    // Si otra petición arrancó mientras se resolvía el href, no lo pises.
    if (!timer) link.href = href;
  });
}
