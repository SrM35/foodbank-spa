const badge = () => document.querySelectorAll(".connection-status");

function paint() {
  const elements = badge();
  if (!elements.length) return;

  const online = navigator.onLine;

  elements.forEach((el) => {
    el.textContent = online ? "En línea" : "Sin conexión";
    el.classList.toggle("is-offline", !online);
  });
}

export function initConnectionStatus() {
  paint();
  window.addEventListener("online", paint);
  window.addEventListener("offline", paint);
}