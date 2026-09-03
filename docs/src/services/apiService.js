export const BASE_URL = "https://es.openfoodfacts.org/cgi/search.pl";

const TIMEOUT_MS = 4000;
const MAX_RETRIES = 5;


const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithTimeout(url, ms = TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);

  try {
    return await fetch(url, {signal: controller.signal});
  } finally {
    clearTimeout(timeoutId);
  }
}

export default class ApiService {
  async getProducts(searchTerm,retries = MAX_RETRIES) {
    try{

    const response = await fetchWithTimeout(
  `${BASE_URL}?search_terms=${searchTerm}&search_simple=1&action=process&json=1&page_size=6`
   );

    if (!response.ok)
      throw new Error("No se pudo obtener la información de los productos");

    const data = await response.json();

    return data.products.map((item) => ({
      id: item.code,
      title: item.product_name || "Producto sin nombre",
      description: item.brands || "Marca no especificada",
      image: item.image_front_small_url || "https://via.placeholder.com/150",
      meta: item.categories ? item.categories.split(",")[0] : "Alimentos",
    }));
  } catch(error) {
      const isNetworkError = error instanceof TypeError;
      if (isNetworkError && retries > 0) {
      console.log(`Reintentando... intento restante: ${retries}`);
      await delay(1000);
      return this.getProducts(searchTerm, retries - 1);
      }
      throw error;
    }
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
