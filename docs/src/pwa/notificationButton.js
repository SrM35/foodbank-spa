import {
  supportsNotifications, getPermission, getCurrentPushSubscription, getSavedPushUser,
  subscribeUserToPush, unsubscribeUserFromPush, syncExistingPushSubscription,
} from "./notifications.js";

const button = () => document.getElementById("notify-btn");
const icon = (name) => `<span class="material-symbols-rounded">${name}</span>`;

async function paint() {
  const el = button();
  if (!el) return;
  if (!supportsNotifications()) { el.hidden = true; return; }

  el.hidden = false;
  if (getPermission() === "denied") {
    el.disabled = true;
    el.title = "Notificaciones bloqueadas en el navegador";
    el.innerHTML = icon("notifications_off");
    return;
  }

  const active = getPermission() === "granted" && Boolean(await getCurrentPushSubscription());
  el.disabled = false;
  el.innerHTML = icon(active ? "notifications_active" : "notifications");
  el.title = active ? "Notificaciones activas (clic para desactivar)" : "Activar notificaciones";
  el.setAttribute("aria-label", el.title);
}

function openModal(onDone) {
  document.getElementById("push-modal")?.remove();
  const saved = getSavedPushUser();
  const overlay = document.createElement("div");
  overlay.id = "push-modal";
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:1rem;z-index:9999";
  overlay.innerHTML = `
    <div class="card" style="max-width:400px;width:100%;margin:0">
      <h3>Activar avisos de FoodBank</h3>
      <form id="push-form" style="display:flex;flex-direction:column;gap:.8rem">
        <input id="push-name" required placeholder="Nombre" value="${saved?.nombre || ""}" style="padding:.6rem">
        <input id="push-email" type="email" required placeholder="Correo" value="${saved?.email || ""}" style="padding:.6rem">
        <p id="push-error" style="color:#b91c1c;margin:0;font-size:.85rem"></p>
        <div style="display:flex;gap:.5rem;justify-content:flex-end">
          <button type="button" id="push-cancel" class="btn-secundario" style="padding:.6rem 1rem;border:none">Cancelar</button>
          <button type="submit" class="btn-link" style="border:none;cursor:pointer">Suscribirme</button>
        </div>
      </form>
    </div>`;
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.addEventListener("click", (e) => e.target === overlay && close());
  overlay.querySelector("#push-cancel").addEventListener("click", close);
  overlay.querySelector("#push-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = overlay.querySelector("#push-error");
    try {
      err.textContent = "Registrando dispositivo...";
      const r = await subscribeUserToPush({
        nombre: overlay.querySelector("#push-name").value,
        email: overlay.querySelector("#push-email").value,
      });
      if (!r.ok) { err.textContent = "Permiso denegado por el navegador."; return; }
      close();
      await onDone();
    } catch (error) {
      console.error("[Push]", error);
      err.textContent = `Error: ${error.message}`;
    }
  });
}

export function initNotificationButton() {
  paint();
  syncExistingPushSubscription();
  button()?.addEventListener("click", async () => {
    if (await getCurrentPushSubscription()) {
      if (confirm("¿Desactivar las notificaciones en este dispositivo?")) {
        await unsubscribeUserFromPush();
        await paint();
      }
      return;
    }
    openModal(paint);
  });
}