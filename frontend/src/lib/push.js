import { api } from '../api/client';

// El navegador exige la clave del servidor en Uint8Array, pero la API la da
// en base64 URL-safe: hay que convertirla.
function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalizado = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(normalizado);
  return Uint8Array.from([...bin].map((c) => c.charCodeAt(0)));
}

export const soportaPush = () => 'serviceWorker' in navigator && 'PushManager' in window;

// 'no-soportado' | 'denegado' | 'activo' | 'inactivo'
export async function estadoNotificaciones() {
  if (!soportaPush()) return 'no-soportado';
  if (Notification.permission === 'denied') return 'denegado';
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = reg && (await reg.pushManager.getSubscription());
  return sub ? 'activo' : 'inactivo';
}

// Pide permiso, registra el service worker y suscribe este navegador.
export async function activarNotificaciones() {
  if (!soportaPush()) throw new Error('Este navegador no admite notificaciones push.');

  // Primero se confirma que el servidor tiene push configurado: pedir el
  // permiso del navegador para nada (y "gastarlo" si el usuario lo rechaza)
  // sería peor que avisar antes de interrumpir.
  const { publicKey } = await api.pushPublicKey();
  if (!publicKey) throw new Error('Las notificaciones push no están configuradas en el servidor.');

  const permiso = await Notification.requestPermission();
  if (permiso !== 'granted') throw new Error('No diste permiso para las notificaciones.');

  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  // Si ya había una suscripción con una clave VAPID distinta (p. ej. cambiaste
  // las claves del servidor), reutilizarla revienta con InvalidStateError.
  // Se da de baja primero para volver a suscribir limpio.
  const previa = await reg.pushManager.getSubscription();
  if (previa) await previa.unsubscribe();

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
  await api.pushSuscribir(sub.toJSON());
}

// Baja la suscripción de este navegador (no toca las de otros dispositivos del usuario).
export async function desactivarNotificaciones() {
  if (!soportaPush()) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = reg && (await reg.pushManager.getSubscription());
  if (!sub) return;
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  await api.pushDesuscribir(endpoint).catch(() => {});
}
