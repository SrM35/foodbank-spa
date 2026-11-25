import Router from "./router/router.js";
// import HomeView from "./views/HomeView.js";
// import AboutView from "./views/AboutView.js";
// import ItemDetailView from "./views/ItemDetailView.js";
import { setupMobileMenu } from "./components/NavBar.js";
// import ContactView from "./views/ContactView.js";
import { loadTheme, setupTheme } from "./theme.js";
// import StorageView from "./views/StorageView.js";
import { setCookie, getCookie } from "./services/cookieService.js";
// import IndexedDBView from "./views/IndexedDBView.js";
// import ServiceWorkerView from "./views/ServiceWorkerView.js";
import { registerServiceWorker } from "./pwa/registerSW.js";
// import FetchLabView from "./views/FetchLabView.js";
import { initConnectionStatus } from "./pwa/connectionStatus.js";
import { initInstallPrompt } from "./pwa/installPrompt.js";
import { initInstallButton } from "./pwa/installButton.js";
// import InstallView from "./views/InstallView.js";
// import DonationView from "./views/DonationView.js";
import { setupDonationSync } from "./services/donationSync.js";
import { initNotificationButton } from "./pwa/notificationButton.js";


const VISITS_KEY = "visitCount";
const VISITS_EXPIRATION_DAYS = 30;
 
function trackVisit() {
  try {
    const current = getCookie(VISITS_KEY);
    const count = current ? parseInt(current, 10) + 1 : 1;
    setCookie(VISITS_KEY, count, VISITS_EXPIRATION_DAYS);
    return count;
  } catch (error) {
    console.warn("No se pudo registrar la cookie de visitas:", error);
    return null;
  }
}
 
trackVisit();

loadTheme();
setupTheme();
setupMobileMenu();


const routes = [
  { path: "/", load: () => import("./views/HomeView.js") },
  { path: "/acerca", load: () => import("./views/AboutView.js") },
  { path: "/item/:id", load: () => import("./views/ItemDetailView.js") },
  { path: "/contacto", load: () => import("./views/ContactView.js") },
  
  { path: "/storage", load: () => import("./views/StorageView.js") },
  { path: "/favoritos", load: () => import("./views/IndexedDBView.js") },
  { path: "/service-worker", load: () => import("./views/ServiceWorkerView.js") },
  { path: "/fetch-lab", load: () => import("./views/FetchLabView.js") },
  { path: "/donacion", load: () => import("./views/DonationView.js") },
  { path: "/instalacion", load: () => import("./views/InstallView.js") },
];

const app = document.getElementById("app-view");
const router = new Router(routes, app);

initInstallPrompt();
router.init();
setupDonationSync();

initConnectionStatus();
initInstallButton();
initNotificationButton();


window.addEventListener("load", () => {
  registerServiceWorker();
});