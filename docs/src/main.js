import Router from "./router/router.js";
import HomeView from "./views/HomeView.js";
import AboutView from "./views/AboutView.js";
import ItemDetailView from "./views/ItemDetailView.js";
import { setupMobileMenu } from "./components/NavBar.js";
import ContactView from "./views/ContactView.js";
import { loadTheme, setupTheme } from "./theme.js";
import StorageView from "./views/StorageView.js";
import { setCookie, getCookie } from "./services/cookieService.js";

// La ruta "/item/:id" ya está registrada aquí, pero el Router todavía
// no sabe hacer match con rutas dinámicas (ver TODO en router.js).
//
// TODO: si renombraste tu entidad (ej. "receta"), puedes
// cambiar aquí el path a algo como "/receta/:id" — solo asegúrate de
// que coincida con los enlaces generados en ItemCard.js.

const VISITS_KEY = "visitCount";
const VISITS_EXPIRATION_DAYS = 30;
 
function trackVisit() {
  const current = getCookie(VISITS_KEY);
  const count = current ? parseInt(current, 10) + 1 : 1;
  setCookie(VISITS_KEY, count, VISITS_EXPIRATION_DAYS);
  return count;
}
 
trackVisit();

loadTheme();
setupTheme();
setupMobileMenu();

const routes = [
  { path: "/", view: HomeView },
  { path: "/acerca", view: AboutView },
  { path: "/item/:id", view: ItemDetailView },
  { path: "/contacto", view: ContactView },
  { path: "/storage", view: StorageView },
];

const app = document.getElementById("app");
const router = new Router(routes, app);

router.init();
