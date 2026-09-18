import { refreshThemeButton } from "../theme.js";
import { getCookie, deleteCookie } from "../services/cookieService.js";

const LOCAL_KEY = "theme";
const SESSION_KEY = "lastSearch";
const COOKIE_KEY = "visitCount";

function getLocalValue() {
  try {
    return localStorage.getItem(LOCAL_KEY);
  } catch (error) {
    console.error("No se pudo leer localStorage:", error);
    return null;
  }
}

//sessionStorage
function getSessionValue() {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch (error) {
    console.error("No se pudo obtener sessionStorage:", error);
    return null;
  }
}

function getCookieValue() {
  try {
    return getCookie(COOKIE_KEY);
  } catch (error) {
    console.error("No se pudo leer la cookie:", error);
    return null;
  }
}

function updateScreenValue() {
  const value = getLocalValue();
  const sessionValue = getSessionValue();
  const cookieValue = getCookieValue();

  const element = document.getElementById("local-value");
  const sessionElement = document.getElementById("session-value");
  const cookieElement = document.getElementById("cookie-value");

  if (element) {
    element.textContent = value ?? "(vacío)";
  }

  if (sessionElement) {
    sessionElement.textContent = sessionValue ?? "(vacío)";
  }

  if (cookieElement) {
    cookieElement.textContent = cookieValue ?? "(vacío)";
  }
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-storage-action]");

  if (!button) return;

  const action = button.dataset.storageAction;

  if (action === "delete-local") {
    try {
      localStorage.removeItem(LOCAL_KEY);

      // Regresar visualmente al tema claro
      document.body.classList.remove("dark-theme");

      // Actualizar correctamente el botón
      refreshThemeButton();

      // Actualizar el valor mostrado
      updateScreenValue();
    } catch (error) {
      console.error("No se pudo eliminar el dato:", error);
    }
  }
  if (action === "delete-session") {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      updateScreenValue();
    } catch (error) {
      console.error("No se pudo eliminar el dato de sessionStorage:", error);
    }
  }
  if (action === "delete-cookie") {
    try {
      deleteCookie(COOKIE_KEY);
      updateScreenValue();
    } catch (error) {
      console.error("No se pudo eliminar la cookie:", error);
    }
  }
});

export default function StorageView() {
  const value = getLocalValue();
  const sessionValue = getSessionValue();
  const cookieValue = getCookieValue();

  return `
      <h2 class="page-title">Diagnóstico de almacenamiento</h2>

      <p>
        Esta sección permite consultar y limpiar la preferencia
        de tema guardada en localStorage.
      </p>

      <div class="storage-card">
        <h3>localStorage</h3>

        <p>
          Valor actual:
          <strong id="local-value">${value ?? "(vacío)"}</strong>
        </p>

        <p class="storage-meta">
          La preferencia permanece guardada aunque se recargue
          la página y puede compartirse entre pestañas del mismo sitio.
        </p>

        <button
          data-storage-action="delete-local"
          class="btn-secundario"
        >
          Limpiar localStorage
        </button>
      </div>
      <div class="storage-card">
        <h3>sessionStorage</h3>
        <p>
          Valor actual:
          <strong id="session-value">${sessionValue ?? "(vacío)"}</strong>
        </p>
        <button
          data-storage-action="delete-session"
          class="btn-secundario"
        >
          Limpiar sessionStorage
        </button>
      </div>
      <div class="storage-card">
        <h3>Cookie: contador de visitas</h3>
        <p>
          Visitas registradas:
          <strong id="cookie-value">${cookieValue ?? "(vacío)"}</strong>
        </p>
        <p class="storage-meta">
          Expira en 30 días desde la última visita: suficiente para
          reconocer a un usuario recurrente sin conservar el dato de
          forma indefinida.
        </p>
        <button
          data-storage-action="delete-cookie"
          class="btn-secundario"
        >
          Eliminar cookie
        </button>
      </div>
  `;
}