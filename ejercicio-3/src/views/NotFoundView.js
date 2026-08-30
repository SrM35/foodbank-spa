
// Dinamico: vista renderizada por el Router dentro de la raiz de shell (#app).
export default function NotFoundView() {
  return `
    <div class="card">
      <h2>404 — Página no encontrada</h2>
      <p>La ruta solicitada no existe.</p>
    </div>
  `;
}