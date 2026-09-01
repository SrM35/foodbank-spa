export const BASE_URL = "https://es.openfoodfacts.org/cgi/search.pl";

export default class ApiService {
  async getProducts(searchTerm) {
    const response = await fetch(
      `${BASE_URL}?search_terms=${searchTerm}&search_simple=1&action=process&json=1&page_size=6`,
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
  }
}
