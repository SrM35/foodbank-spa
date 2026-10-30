import {
  supportsNotifications,
  getPermission,
  enableNotifications
} from "./notifications.js";

const button = () => document.getElementById("notify-btn");

function paint() {
  const el = button();
  if (!el) return;

  if (!supportsNotifications()) {
    el.hidden = true;
    return;
  }

  const permission = getPermission();

  el.hidden = false;

  if (permission === "denied") {
    el.disabled = true;
    el.title = "Notificaciones bloqueadas";
    el.setAttribute("aria-label", el.title);

    el.innerHTML =
      '<span class="material-symbols-rounded">notifications_off</span>';

    let message = document.getElementById("notification-message");

    if (!message) {
      message = document.createElement("div");
      message.id = "notification-message";
      message.className = "notification-warning";

      message.innerHTML = `
        <span class="material-symbols-rounded">info</span>
        <div>
          <strong>Notificaciones bloqueadas</strong>
          <p>
            Para recibir avisos, permite las notificaciones
            desde la configuración de este sitio en tu navegador
            y recarga la página.
          </p>
        </div>
      `;

      document.body.appendChild(message);
      setTimeout(() => {
       message.remove();
      }, 6000);
    }

    return;
  }

  const labels = {
    default: "Activar notificaciones",
    granted: "Notificaciones activas",
  };

  el.disabled = permission === "granted";

  el.innerHTML = permission === "granted"
    ? '<span class="material-symbols-rounded">notifications_active</span>'
    : '<span class="material-symbols-rounded">notifications</span>';

  el.title = labels[permission];
  el.setAttribute("aria-label", labels[permission]);

  document.getElementById("notification-message")?.remove();
}

async function watchPermission() {
  try {
    const status = await navigator.permissions.query({
      name: "notifications"
    });
    status.onchange = paint;
  } catch (error) {
    console.warn(
      "[PWA] No se pudo observar el permiso de notificaciones: ",
      error
    );
  }
}

export function initNotificationButton() {
  paint();
  watchPermission();

  button()?.addEventListener("click", async () => {
    await enableNotifications();
    paint();
  });
}