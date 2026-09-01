// TODO (Ejercicio - Parte A, punto 2): completa esta vista.
//
// Esta función recibirá el objeto "params" que tu Router extraiga de la
// URL, por ejemplo params = { id: "2" } para la ruta "/item/2".
//
// Pasos sugeridos:
//   1. Dentro de esta función (NO como import estático arriba del
//      archivo), haz: const { default: ItemsService } = await
//      import("../services/itemsService.js");
//   2. Crea una instancia: const service = new ItemsService();
//   3. Usa service.getById(params.id) para obtener el elemento.
//   4. Si no existe, devuelve un HTML simple indicando "no encontrado".
//   5. Si existe, devuelve un <div class="card"> con sus campos
//      (título, descripción, meta...).
//
// TODO: una vez que funcione, ajusta qué campos mostrar y cómo
// se llaman en pantalla, según tu tema.

// Dinamico: vista renderizada por el Router dentro de la raiz de shell (#app).
export default async function ItemDetailView(params) {
try{
  const { default: ItemsService } = await import(
    "../services/itemsService.js"
  );

  const service = new ItemsService();

  const item = await service.getById(params.id);

  if (!item) {
    return `
      <div class="card item-detail">
        <h2>Alimento no encontrado</h2>
        <p>No existe ningún alimento con el id ${params.id}.</p>
      </div>
    `;
  }

  return `
    <div class="card item-detail">
      <h2>${item.title}</h2>

      <img 
        src="${item.image}" 
        alt="${item.title}"
        class="item-detail-image"
      >

      <div class="item-detail-content">
        <div>
          <h3>Marca</h3>
          <p>${item.description}</p>
        </div>

        <div>
          <h3>Categoría</h3>
          <p>${item.meta}</p>
        </div>
      </div>

      <a href="/" data-link>← Volver a alimentos</a>
    </div>
  `;
}catch (error){
  return `
    <div class="card error">
      <h2>Error al cargar el alimento</h2>
      <p>No se pudo obtener el producto. Intenta nuevamente.</p>
    </div>
  `;
}}