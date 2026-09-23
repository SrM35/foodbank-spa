import {
  addFavorite,
  getFavorites,
  getFavoritesByCategory,
  deleteFavorite,
} from "../services/dbServices.js";

document.addEventListener("submit", async (event) => {
  if (event.target.id !== "favorite-form") return;
  event.preventDefault();

  const nameInput = document.getElementById("fav-name");
  const categorySelect = document.getElementById("fav-category");
  const feedbackEl = document.getElementById("fav-feedback");

  const newFavorite = {
    name: nameInput.value.trim(),
    category: categorySelect.value,
    addedAt: new Date().toLocaleDateString(),
  };

  try {
    await addFavorite(newFavorite);

    feedbackEl.style.color = "#108a11";
    feedbackEl.textContent = "¡Elemento guardado correctamente!";
    nameInput.value = "";

    await loadFavoritesList();
  } catch (error) {
    console.error("Error al guardar", error);
    feedbackEl.style.color = "#b91c1c";
    feedbackEl.textContent =
      "Error: No se pudo guardar el favorito en la base de datos.";
  } finally {
    setTimeout(() => {
      if (feedbackEl) {
        feedbackEl.textContent = "";
      }
    }, 3000);
  }
});

document.addEventListener("click", async (event) => {
  const deleteBtn = event.target.closest("[data-delete-fav]");
  if (!deleteBtn) return;

  const id = Number(deleteBtn.dataset.deleteFav);
  try {
    await deleteFavorite(id);
    await loadFavoritesList();
  } catch (error) {
    console.error("Error al eliminar de IndexedDB:", error);
  }
});

document.addEventListener("change", async (event) => {
  if (event.target.id === "filter-category") {
    await loadFavoritesList(event.target.value);
  }
});

async function loadFavoritesList(categoryFilter = "all") {
  const container = document.getElementById("favorites-list");
  if (!container) return;

  try {
    let items = [];
    if (categoryFilter === "all") {
      items = await getFavorites();
    } else {
      items = await getFavoritesByCategory(categoryFilter);
    }

    if (items.length === 0) {
      container.innerHTML = `<p style="color: #6b7280;">No hay elementos guardados en esta categoría.</p>`;
      return;
    }

    container.innerHTML = `
      <div class="grid">
        ${items
          .map(
            (item) => `
          <div class="card">
            <h3>${item.name}</h3>
            <p>Categoría: <strong>${item.category}</strong></p>
            <button class="btn-delete" data-delete-fav="${item.id}" style="border: none; cursor: pointer;">
              Eliminar
            </button>
          </div>
        `,
          )
          .join("")}
      </div>
    `;
  } catch (error) {
    console.error("Error al leer de IndexedDB:", error);
    container.innerHTML = `<p style="color: #b91c1c;">No se pudieron cargar los favoritos desde la base de datos local.</p>`;
  }
}

export default async function IndexedDBView() {
  setTimeout(() => loadFavoritesList(), 0);

  return `
    <div class="view-container">
      <h2 class="page-title">Favoritos</h2>
      
      <div class="card" style="margin-bottom: 2rem;">
        <h3>Agregar nuevo elemento</h3>
        <form id="favorite-form" style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
          <div>
            <label for="fav-name" style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Nombre del alimento:</label>
            <input type="text" id="fav-name" required placeholder="Ej. Avena integral" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem;" />
          </div>

          <div>
            <label for="fav-category" style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Categoría:</label>
            <select id="fav-category" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem;">
              <option value="Cereales">Cereales</option>
              <option value="Enlatados">Enlatados</option>
              <option value="Lácteos">Lácteos</option>
              <option value="Legumbres">Legumbres</option>
            </select>
          </div>

          <button type="submit" class="btn-link" style="border: none; cursor: pointer;">
            Guardar
          </button>
        </form>
        <p id="fav-feedback" style="margin-top: 1rem; font-weight: 600;"></p>
      </div>

      <div style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1rem;">
        <label for="filter-category" style="font-weight: 600;">Filtrar por categoría:</label>
        <select id="filter-category" style="padding: 0.5rem 1rem; border-radius: 0.5rem; border: 1px solid #d1d5db;">
          <option value="all">Todas las categorías</option>
          <option value="Cereales">Cereales</option>
          <option value="Enlatados">Enlatados</option>
          <option value="Lácteos">Lácteos</option>
          <option value="Legumbres">Legumbres</option>
        </select>
      </div>

      <div id="favorites-list">
        <p style="color: #6b7280;">Cargando elementos desde IndexedDB...</p>
      </div>
    </div>
  `;
}
