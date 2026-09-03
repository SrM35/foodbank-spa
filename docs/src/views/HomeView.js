import ApiService from "../services/apiService.js";
import ItemCard from "../components/ItemCard.js";

export default async function HomeView() {

  const api = new ApiService();

  let items = [];
  let error = null;

  try {
    items = await api.getProducts("alimentos");
  } catch (e) {

    console.error(e);

    if (e.name === "AbortError") {
      error = "La solicitud tardó demasiado. Intenta nuevamente.";
    } 
    else if (e instanceof TypeError) {
      error = "No se pudo conectar con el servidor. Verifica tu conexión.";
    } 
    else if (e.status) {
      error = `El servidor respondió con un error (${e.status}). Intenta más tarde.`;
    } 
    else {
      error = "No pudimos cargar los alimentos. Intenta de nuevo más tarde.";
    }
  }

  const contenido = error
    ? `<p style="color:#b91c1c">${error}</p>`
    : `
        <div class="grid">
          ${items.map((item) => ItemCard(item)).join("")}
        </div>
      `;

  return `
    <div class="card">
      <h2>Alimentos disponibles</h2>
      ${contenido}
    </div>
  `;
}

