import { BASE_PATH, API_BASE_URL } from "../config.js";

const ICON = `${BASE_PATH}/icons/manifest-icon-192.maskable.png`;
const USER_KEY = "foodbank_push_user";

export function supportsNotifications() {
  return "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
}
export function getPermission() {
  return supportsNotifications() ? Notification.permission : "unsupported";
}
export function getSavedPushUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
}

function urlBase64ToUint8Array(b64) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export async function getCurrentPushSubscription() {
  if (!supportsNotifications()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

async function sendSubscriptionToBackend(subscription, user) {
  const res = await fetch(`${API_BASE_URL}/push/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: user.email, nombre: user.nombre, subscription: subscription.toJSON() }),
  });
  if (!res.ok) throw new Error("El backend rechazó la suscripción");
}

export async function showLocalNotification(title, options = {}) {
  const reg = await navigator.serviceWorker.ready;
  return reg.showNotification(title, { icon: ICON, data: { url: "./" }, ...options });
}

export async function subscribeUserToPush({ nombre, email }) {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: permission };

  const user = { nombre: nombre.trim(), email: email.trim().toLowerCase() };
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();

  if (!sub) {
    const { publicKey } = await (await fetch(`${API_BASE_URL}/push/vapid-public-key`)).json();
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  await sendSubscriptionToBackend(sub, user);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  await showLocalNotification("Notificaciones activadas", {
    body: `Hola ${user.nombre}, recibirás avisos de nuevas donaciones.`,
    tag: "welcome-push",
  });
  return { ok: true };
}

export async function unsubscribeUserFromPush() {
  const sub = await getCurrentPushSubscription();
  if (!sub) return;
  try {
    await fetch(`${API_BASE_URL}/push/unsubscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
  } catch (e) { console.warn("[Push] baja no avisada al backend:", e); }
  await sub.unsubscribe();
}

export async function syncExistingPushSubscription() {
  if (!supportsNotifications() || getPermission() !== "granted") return;
  try {
    const user = getSavedPushUser();
    const sub = await getCurrentPushSubscription();
    if (user?.email && sub) await sendSubscriptionToBackend(sub, user);
  } catch (e) { console.warn("[Push] sync omitido:", e.message); }
}