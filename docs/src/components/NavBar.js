// Un "componente" en este contexto vanilla es simplemente una función que
// devuelve un fragmento de HTML (string) o un nodo del DOM. No hay JSX,
// pero la idea de "una función = una pieza de UI reutilizable" es la misma
// que en React.

// Shell: solo actualiza el estado visual
// de los enlaces del nav que ya estan en el
// index.html

import { BASE_PATH } from "../config.js";

export default function renderActiveLink(path) {
  document.querySelectorAll("nav a[data-link]").forEach((link) => {
    const linkPath = new URL(link.href).pathname.replace(BASE_PATH, "") || "/";
    link.classList.toggle("active", linkPath === path);
  });

  const sidebar = document.getElementById("sidebar");
  if (sidebar) {
    sidebar.classList.remove("open");
  }
}

export function setupMobileMenu() {
  const menuBtn = document.getElementById("menu-btn");
  const sidebar = document.getElementById("sidebar");

  if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
    document.addEventListener("click", (event) => {
      const clickedOutside =
        !sidebar.contains(event.target) && !menuBtn.contains(event.target);

      if (sidebar.classList.contains("open") && clickedOutside) {
        sidebar.classList.remove("open");
      }
    });
  }
}
