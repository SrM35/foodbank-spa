import { refreshThemeButton } from "../theme.js";

const LOCAL_KEY = "theme";

function getLocalValue() {
  try {
    return localStorage.getItem(LOCAL_KEY);
  } catch (error) {
    console.error("No se pudo leer localStorage:", error);
    return null;
  }
}

function updateScreenValue() {
  const value = getLocalValue();

  const element = document.getElementById("local-value");

  if (element) {
    element.textContent = value ?? "(vacío)";
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
});

export default function StorageView() {
  const value = getLocalValue();

  return `
    <div class="card">
      <h2>Diagnóstico de almacenamiento</h2>

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
    </div>
  `;
}