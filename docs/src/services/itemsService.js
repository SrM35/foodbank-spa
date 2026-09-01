// Servicio "mock": simula una fuente de datos (podría ser un fetch real
// a una API). Exportación por defecto a propósito: la importarás de
// forma DINÁMICA en ItemDetailView.js.
//
// ── TODO ─────────────────────────────────────────────
// Reemplaza el arreglo ITEMS por los datos de tu propio tema (mínimo 4
// elementos, mínimo 3 campos cada uno). Puedes renombrar "ItemsService"
// y "Item" si quieres (ej. RecetasService / Receta), pero no es
// obligatorio: lo que se califica son los datos y los campos, no el
// nombre de la clase.
//
// Ejemplo si tu tema fuera "recetas":
//   { id: "1", title: "Tacos al pastor", description: "...", meta: "30 min" }

// const ITEMS = [
//   {
//     id:"1",
//     title:"Arroz",
//     description:"Arroz blanco para la alimentación.",
//     meta:"Categoria: Granos",
//   },
//   {
//     id:"2",
//     title:"Frijol",
//     description:"Frijol peruano para preparar diferentes comidas.",
//     meta:"Categoria: Legumbres",
//   },
//   {
//     id:"3",
//     title:"Atun enlatado",
//     description:"Atun enlatado como fuente de proteina de facil preparacion.",
//     meta:"Categoria: Enlatados",
//   },
//   {
//     id:"4",
//     title:"Pan bimbo",
//     description:"Pan de caja para preparar sandwiches y acompañar comidas.",
//     meta:"Categoria: Lacteos",
//   },
//   {
//     id:"5",
//     title:"Gelatina",
//     description:"Gelatina para postres.",
//     meta:"Categoria: Postres",
//   }
// ];

export const BASE_URL =
  "https://es.openfoodfacts.org/cgi/search.pl";

export default class ItemsService {

  async getAll() {
    const response = await fetch(
      `${BASE_URL}?search_terms=alimentos&search_simple=1&action=process&json=1&page_size=6`
    );

    if (!response.ok) {
      throw new Error("No se pudo obtener la información de los productos");
    }

    const data = await response.json();

    return data.products.map((item) => ({
      id: item.code,
      title: item.product_name || "Producto sin nombre",
      description: item.brands || "Marca no especificada",
      image:
        item.image_front_small_url ||
        "https://via.placeholder.com/150",
      meta: item.categories
        ? item.categories.split(",")[0]
        : "Alimentos",
    }));
  }

  async getById(id) {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${id}.json`
    );

    if (!response.ok) {
      throw new Error("No se pudo obtener el producto");
    }

    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      return null;
    }

    const item = data.product;

    return {
      id: item.code,
      title: item.product_name || "Producto sin nombre",
      description: item.brands || "Marca no especificada",
      image:
        item.image_front_small_url ||
        "https://via.placeholder.com/150",
      meta: item.categories
        ? item.categories.split(",")[0]
        : "Alimentos",
    };
  }
}

// export default class ItemsService {
//   async getAll() {
//     return ITEMS;
//   }

//   async getById(id) {
//     return ITEMS.find((item) => item.id === id) ?? null;
//   }
// }