
export default async function ContactView() {
  return `
    <h2 class="page-title">Contacto Food-Bank </h2>

    <div class="card">
      <h3>Encuentra el centro de acopio más cercano</h3>

      <p>
        Consulta los centros de acopio cercanos para saber dónde
        puedes llevar tus donaciones de alimentos.
        Tu ubicación solo se solicitará cuando presiones el botón.
      </p>

      <button type="button" id="buscar-centros" class="btn-link">
        Usar mi ubicación
      </button>

      <p id="estado-ubicacion" class="sw-result"
         role="status" aria-live="polite"></p>

      <div>
        <label for="direccion-usuario">
          O escribe tu dirección
        </label>
        <input
          type="text"
          id="direccion-usuario"
          placeholder="Coordenadas (latitud y longitud)"
        />
        <button type="button" id="buscar-por-direccion"
                class="btn-link">
          Buscar por dirección
        </button>
      </div>
      <p id="estado-permiso-contacto" class="sw-result">
  Consultando permiso...
</p>

      <div id="lista-centros"></div>
    </div>

    <div class="card">
      <h3>Contacto</h3>
      <p>¿Tienes dudas sobre las donaciones?</p>
      <p>
        Correo:
        <a href="mailto:foodbankBCS@gmail.com">
          foodbankBCS@gmail.com
        </a>
      </p>
      
    </div>
  `;
}
