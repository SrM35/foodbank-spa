import { BASE_PATH } from "../config.js";

export default async function DonationView() {
  return `
    <h2 class="page-title">Registrar nueva donación</h2>
    
    <div class="card">
      <form id="formulario-donacion" style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
        
        <div style="display: flex; flex-direction: column; gap: 0.3rem;">
          <label for="nombreDonante" style="font-weight: 600;">Nombre del donante</label>
          <input 
            type="text" 
            id="nombreDonante" 
            name="nombreDonante" 
            placeholder="Ej. Brenda Lara" 
            required 
            style="padding: 0.6rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 1rem;"
          />
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.3rem;">
          <label for="nombreProducto" style="font-weight: 600;">Producto</label>
          <input 
            type="text" 
            id="nombreProducto" 
            name="nombreProducto" 
            placeholder="Ej. Arroz" 
            required 
            style="padding: 0.6rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 1rem;"
          />
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.3rem;">
          <label for="categoriaProducto" style="font-weight: 600;">Categoría</label>
          <select 
            id="categoriaProducto" 
            name="categoriaProducto" 
            required 
            style="padding: 0.6rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 1rem;"
          >
            <option value="" disabled selected>Selecciona una categoría</option>
            <option value="Granos y Cereales">Granos y Cereales</option>
            <option value="Enlatados">Enlatados</option>
            <option value="Lácteos">Lácteos</option>
            <option value="Aceites y Mantecas">Aceites y Mantecas</option>
            <option value="Frutas y Verduras">Frutas y Verduras</option>
            <option value="Otros">Otros</option>
          </select>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.3rem;">
          <label for="cantidadProducto" style="font-weight: 600;">Cantidad (unidades / kg)</label>
          <input 
            type="number" 
            id="cantidadProducto" 
            name="cantidadProducto" 
            min="1" 
            placeholder="Ej. 25" 
            required 
            style="padding: 0.6rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 1rem;"
          />
        </div>

        <div class="storage-actions" style="margin-top: 0.5rem; display: flex; gap: 0.5rem;">
          <button type="submit" class="btn-link" style="border: none; cursor: pointer;">
            Guardar donación
          </button>
        </div>
      </form>

      <!-- Contenedor reservado para mensajes de estado -->
      <p id="mensaje-donacion" class="sw-result" style="margin-top: 1rem; font-weight: 600;"></p>
      
<p id="modo-sincronizacion" class="sw-result">
  Detectando modo de sincronización...
</p>

<h3>Donaciones pendientes</h3>

<ul id="donaciones-pendientes">
  <li>Cargando donaciones pendientes...</li>
</ul>

<button
  type="button"
  id="reintentar-donaciones"
  class="btn-link"
>
  Reintentar ahora
</button>

    </div>
  `;
}
