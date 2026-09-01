import ItemsService from "../services/itemsService.js";
import ItemCard from "../components/ItemCard.js";

// TODO: si renombraste "item" a algo de tu tema, ajusta también
// el título de esta vista.

// Dinamico: vista renderizada por el Router dentro de la raiz de shell (#app).
export default async function HomeView() {
  try{
  
  const service = new ItemsService();
  const items = await service.getAll();
  
  return `
    <h2>Alimentos disponibles</h2>
    <div class="grid">
      ${items.map((item) => ItemCard(item)).join("")}
    </div>
  `;
}catch (error) {
    return `
      <div class="card error">
        <h2>Error al cargar los alimentos</h2>
        <p>No se pudieron obtener los productos. Intenta nuevamente.</p>
      </div>
    `;
  }
}