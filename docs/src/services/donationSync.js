import {
  enqueueDonation,
  getPendingActions,
  deletePendingAction,
} from "./dbServices.js";

const SYNC_TAG = "foodbank-sync-donations";
const API_URL = "https://jsonplaceholder.typicode.com/posts";
const LOCK_NAME = "foodbank-donation-sync";
const FETCH_TIMEOUT_MS = 8000;
const AUTO_RETRY_MS = 20000;

const RETRY_DELAYS = [1500, 4000, 8000, 15000, 30000];

let initialized = false;
let retrying = false;
let refreshTimers = [];
let lastPendingCount = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ---------- Modal ---------- */

function injectModalStyles() {
  if (document.getElementById("donacion-modal-styles")) return;

  const style = document.createElement("style");
  style.id = "donacion-modal-styles";
  style.textContent = `
    .donacion-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      z-index: 9999;
    }
    .donacion-modal {
      background: #ffffff;
      color: #111827;
      border-radius: 14px;
      padding: 1.75rem 1.5rem 1.5rem;
      max-width: 380px;
      width: 100%;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
      animation: donacion-modal-in 0.18s ease-out;
    }
    .donacion-modal-icon {
      font-size: 2.6rem;
      line-height: 1;
      margin-bottom: 0.6rem;
    }
    .donacion-modal h3 {
      margin: 0 0 0.5rem;
      font-size: 1.25rem;
    }
    .donacion-modal p {
      margin: 0 0 1.25rem;
      line-height: 1.45;
      color: #374151;
    }
    .donacion-modal button {
      background: #15803d;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 0.65rem 1.6rem;
      font-size: 1rem;
      cursor: pointer;
    }
    .donacion-modal button:hover {
      background: #166534;
    }
    @keyframes donacion-modal-in {
      from { opacity: 0; transform: scale(0.94); }
      to   { opacity: 1; transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
}

function closeModal() {
  document.getElementById("donacion-modal-overlay")?.remove();
  document.removeEventListener("keydown", onModalKeydown);
}

function onModalKeydown(event) {
  if (event.key === "Escape") closeModal();
}

function showModal({ icon, title, text }) {
  injectModalStyles();
  closeModal();

  const overlay = document.createElement("div");
  overlay.id = "donacion-modal-overlay";
  overlay.className = "donacion-modal-overlay";

  const box = document.createElement("div");
  box.className = "donacion-modal";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-labelledby", "donacion-modal-title");

  const iconEl = document.createElement("div");
  iconEl.className = "donacion-modal-icon";
  iconEl.textContent = icon;

  const titleEl = document.createElement("h3");
  titleEl.id = "donacion-modal-title";
  titleEl.textContent = title;

  const textEl = document.createElement("p");
  textEl.textContent = text;

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Entendido";
  button.addEventListener("click", closeModal);

  box.append(iconEl, titleEl, textEl, button);
  overlay.appendChild(box);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeModal();
  });

  document.body.appendChild(overlay);
  document.addEventListener("keydown", onModalKeydown);
  button.focus();
}

function showSentModal(count) {
  showModal({
    icon: ":D",
    title: count === 1 ? "¡Gracias! Tu donacion fue enviada" : "¡Donaciones enviadas!",
    text:
      count === 1
        ? "Tu donacion ya llegó al banco de alimentos."
        : `Se enviaron ${count} donaciones que estaban esperando.`,
  });
}

function showSavedOfflineModal() {
  showModal({
    icon: "D:",
    title: "Donación guardada",
    text: "Ahorita no hay internet, pero tu donacion esta guardada en este dispositivo. Se enviara sola cuando regrese la conexion.",
  });
}

/* ---------- Mensajes en pantalla ---------- */

function showMessage(message, isError = false) {
  const element = document.getElementById("mensaje-donacion");

  if (element) {
    element.textContent = message;
    element.style.color = isError ? "#b91c1c" : "#166534";
  }
}

function showMode() {
  const element = document.getElementById("modo-sincronizacion");
  if (!element) return;

  const supported = "SyncManager" in window && "serviceWorker" in navigator;

  element.textContent = supported
    ? "Modo: envío automático. Si no hay internet, tus donaciones se mandan solas cuando regrese."
    : "Modo: envío manual. Tus donaciones se mandan al volver el internet, al abrir la app o al pulsar «Reintentar ahora».";
}

/* ---------- Lista de pendientes ---------- */

async function getPendingDonations() {
  const items = await getPendingActions();
  return items.filter((item) => item.type === "donation");
}

async function renderPending() {
  try {
    const donations = await getPendingDonations();

    // Si bajo la cantidad de pendientes, es que se enviaron.
    if (lastPendingCount !== null && donations.length < lastPendingCount) {
      showSentModal(lastPendingCount - donations.length);
      if (donations.length === 0) {
        showMessage("Todas tus donaciones fueron enviadas.");
      }
    }
    lastPendingCount = donations.length;

    const list = document.getElementById("donaciones-pendientes");
    if (!list) return;

    list.replaceChildren();

    if (donations.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No hay donaciones pendientes.";
      list.appendChild(li);
      return;
    }

    for (const item of donations) {
      const li = document.createElement("li");
      const payload = item.payload || {};

      li.textContent =
        `${payload.nombreDonante || "Donante"} — ` +
        `${payload.nombreProducto || "Producto"} — ` +
        `${payload.cantidadProducto ?? 0} unidades/kg · Esperando envío`;

      list.appendChild(li);
    }
  } catch (error) {
    console.error("[Donaciones] Error al leer las donaciones guardadas:", error);

    const list = document.getElementById("donaciones-pendientes");
    if (!list) return;
    list.replaceChildren();
    const li = document.createElement("li");
    li.textContent = "No pudimos mostrar tus donaciones pendientes. Intenta recargar la página.";
    list.appendChild(li);
  }
}

function refreshPendingSoon() {
  refreshTimers.forEach(clearTimeout);
  refreshTimers = [500, 1500, 3000, 6000].map((ms) =>
    setTimeout(renderPending, ms)
  );
}

/* ---------- Envío ---------- */

async function registerBackgroundSync() {
  if (!("serviceWorker" in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;

    if (
      "SyncManager" in window &&
      registration.sync &&
      typeof registration.sync.register === "function"
    ) {
      await registration.sync.register(SYNC_TAG);
      return true;
    }
  } catch (error) {
    console.warn("No se pudo registrar Background Sync:", error);
  }

  return false;
}

// Sin internet real, un fetch puede quedarse colgado: le ponemos tiempo límite.
async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// El candado evita que la página y el Service Worker manden lo mismo a la vez.
async function withLock(task) {
  if (navigator.locks && typeof navigator.locks.request === "function") {
    return navigator.locks.request(LOCK_NAME, task);
  }
  return task();
}

// Un intento de envío desde la página. Devuelve true si todo se envió.
async function sendPendingOnce() {
  try {
    await withLock(async () => {
      // Se lee DENTRO del candado: lo que ya mandó el Service Worker no se repite.
      const items = await getPendingActions();

      for (const item of items) {
        if (item.type !== "donation") continue;

        const response = await fetchWithTimeout(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.payload),
        });

        if (!response.ok) {
          throw new Error(`Error HTTP ${response.status}`);
        }

        // Borrar solo después de que el servidor confirme.
        await deletePendingAction(item.id);
      }
    });

    return true;
  } catch (error) {
    console.warn("[Donaciones] Intento de envío fallido:", error);
    return false;
  }
}

// Intenta enviar varias veces con pausas, por si la red aún no está lista.
async function syncWithRetries() {
  if (retrying) return;
  retrying = true;

  try {
    for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
      const pending = await getPendingDonations();
      if (pending.length === 0) {
        await renderPending();
        return;
      }

      showMessage("Enviando tus donaciones...");

      const ok = await sendPendingOnce();
      await renderPending();

      if (ok) return;

      if (attempt < RETRY_DELAYS.length) {
        showMessage(
          "Todavía no hay conexión. Tus donaciones están guardadas y lo intentaremos de nuevo.",
          true
        );
        await sleep(RETRY_DELAYS[attempt]);
      }
    }

    showMessage(
      "Seguimos sin conexión. Tus donaciones están guardadas y se enviarán en cuanto regrese el internet.",
      true
    );
  } finally {
    retrying = false;
  }
}

// Botón «Reintentar ahora».
async function retrySync() {
  // Además de reintentar desde la página, avisamos al Service Worker.
  await registerBackgroundSync();

  const pending = await getPendingDonations().catch(() => []);
  if (pending.length === 0) {
    showMessage("No hay donaciones pendientes por enviar.");
    await renderPending();
    return;
  }

  await syncWithRetries();
}

// Cuando vuelve el internet (se envía solo, sin picar nada).
async function handleOnline() {
  const pending = await getPendingDonations().catch(() => []);
  if (pending.length === 0) return;

  showMessage("Volvió el internet. Enviando tus donaciones...");

  // Red de respaldo para cuando la app esté cerrada.
  await registerBackgroundSync();

  // Pequeña pausa: el navegador avisa antes de que la red esté lista.
  await sleep(1500);
  await syncWithRetries();
}

// Revisión periódica: por si el navegador nunca avisa que volvió el internet.
function startAutoRetry() {
  setInterval(async () => {
    if (retrying) return;

    try {
      const pending = await getPendingDonations();
      if (pending.length > 0) {
        await syncWithRetries();
      }
    } catch (error) {
      console.warn("[Donaciones] Revisión automática falló:", error);
    }
  }, AUTO_RETRY_MS);
}

function watchDonationView() {
  const app = document.getElementById("app-view");
  if (!app) return;

  const refreshIfPresent = () => {
    if (document.getElementById("donaciones-pendientes")) {
      showMode();
      renderPending();
    }
  };

  const observer = new MutationObserver(refreshIfPresent);
  observer.observe(app, { childList: true });

  refreshIfPresent();
}

/* ---------- Inicio ---------- */

function setupDonationSync() {
  if (initialized) return;
  initialized = true;

  document.addEventListener("submit", async (event) => {
    if (event.target.id !== "formulario-donacion") return;

    event.preventDefault();

    const form = event.target;
    if (!form.reportValidity()) return;

    const data = new FormData(form);

    const donation = {
      nombreDonante: String(data.get("nombreDonante") || "").trim(),
      nombreProducto: String(data.get("nombreProducto") || "").trim(),
      categoriaProducto: String(data.get("categoriaProducto") || ""),
      cantidadProducto: Number(data.get("cantidadProducto")),
    };

    try {
   
      await enqueueDonation(donation);

      form.reset();
      await renderPending();

   
      await registerBackgroundSync();

      showMessage("Donación guardada. Enviando...");

  
      const sent = await sendPendingOnce();
      await renderPending();

      if (!sent) {
        showMessage(
          "Donación guardada. Se enviará sola cuando regrese el internet.",
          true
        );
        showSavedOfflineModal();

        sleep(RETRY_DELAYS[0]).then(syncWithRetries);
      }
    } catch (error) {
      console.error("Error al guardar la donación:", error);
      showMessage("No pudimos guardar tu donación. Inténtalo de nuevo.", true);
    }
  });

  document.addEventListener("click", (event) => {
    if (event.target.closest("#reintentar-donaciones")) {
      retrySync();
    }
  });

  window.addEventListener("online", handleOnline);

  window.addEventListener("pageshow", () => {
    showMode();
    renderPending();
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "DONATIONS_SYNCED") {
        renderPending();
      }
    });
  }

  watchDonationView();
  startAutoRetry();

  getPendingDonations()
    .then((pending) => {
      if (pending.length > 0) {
        showMessage("Enviando donaciones que habían quedado pendientes...");
        return syncWithRetries();
      }
    })
    .catch((error) => console.warn("[Donaciones] Revisión inicial falló:", error));
}

export { setupDonationSync };