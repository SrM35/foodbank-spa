// Dinamico: vista renderizada por el Router dentro de la raiz de shell (#app).
export default function NotFoundView() {
  return `
    <div>
      <h2 class="page-title">404 — Página no encontrada</h2>
      <p class="card">La ruta solicitada no existe.</p>
    </div>
  `;
}
