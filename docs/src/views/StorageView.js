import { refreshThemeButton } from "../theme.js";

const LOCAL_KEY = "theme";
const SESSION_KEY = "lastSearch";

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

function updateScreenValue() {
  const value = getLocalValue();
  const sessionValue = getSessionValue();

  const element = document.getElementById("local-value");
  const sessionElement = document.getElementById("session-value");

  if (element) {
    element.textContent = value ?? "(vacío)";
  }

  if (sessionElement) {
    sessionElement.textContent = sessionValue ?? "(vacío)";
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
});

export default function StorageView() {
  const value = getLocalValue();
  const sessionValue = getSessionValue();

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
  `;
}
