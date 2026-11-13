console.log("[SW] Script en ejecución");

console.log("[SW] Contexto global: ", self.constructor.name);

//No tiene acceso
console.log("[SW] typeof window => ", typeof window);
console.log("[SW] typeof document => ", typeof document);
console.log("[SW] typeof localStorage => ", typeof localStorage);

//Sí tiene acceso
console.log("[SW] typeof indexedDB => ", typeof indexedDB);
console.log("[SW] typeof caches => ", typeof caches);

//Scope del service worker
console.log("[SW] Scope => ", self.registration.scope);

const CACHE_VERSION = "app-shell-13";

// const API_ORIGIN = "https://jsonplaceholder.typicode.com";
const API_ORIGIN = "http://localhost:3000";
const CDN_ORIGIN = "https://cdn.jsdelivr.net";
const ALLOWED_ORIGINS = [self.location.origin, CDN_ORIGIN];

const NOTIFICATION_ICON = new URL("./icons/manifest-icon-192.maskable.png", self.registration.scope).href;

const APP_SHELL = [
  "./",
  "./index.html",
  "./404.html",
  "./styles/shell.css",
  "./styles/main.css",
  "./src/main.js",
  "./src/config.js",
  "./src/router/router.js",
  "./src/theme.js",
  "./src/components/NavBar.js",
  "./src/components/ItemCard.js",
  "./src/pwa/registerSW.js",
  "./src/pwa/connectionStatus.js",
  "./src/pwa/installPrompt.js",
  "./src/pwa/installButton.js",
  "./src/views/InstallView.js",
  "./src/views/HomeView.js",
  "./src/views/AboutView.js",
  "./src/views/ContactView.js",
  "./src/views/StorageView.js",
  "./src/views/IndexedDBView.js",
  "./src/views/ServiceWorkerView.js",
  "./src/views/FetchLabView.js",
  "./src/views/NotFoundView.js",
  "./src/views/ItemDetailView.js",
  "./src/services/apiService.js",
  "./src/services/cookieService.js",
  "./src/services/dbServices.js",
  "./src/services/itemsService.js",
  "./src/utils/slugify.js",
  "./data/productos.json",
  "./data/novedades.json",
  "./manifest.json",
  "./icons/manifest-icon-192.maskable.png",
  "./icons/manifest-icon-512.maskable.png",
  "./icons/apple-icon-180.png",
  `${CDN_ORIGIN}/npm/idb@8/+esm`,
  "./src/views/DonationView.js",
  "./src/services/donationSync.js",
  "./src/pwa/contactLocation.js",
  "./src/pwa/geolocation.js",
  "./src/pwa/share.js",
  "./src/pwa/notifications.js",
  "./src/pwa/notificationButton.js"
];

self.addEventListener("install", (event) => {
  console.log("[SW] install => precacheando", CACHE_VERSION);

  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)));

}); 

self.addEventListener("activate", (event) => {
  console.log("[SW] activate => versión activa", CACHE_VERSION);

  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames.filter((name) => name !== CACHE_VERSION)
      .map((name) => {
        console.log("[SW] Borrando caché vieja", name);
        return caches.delete(name);
      })
    )).then(() => self.clients.claim())
  );
})

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    console.log("[SW] Mensaje SKIP_WAITING recibido, forzando activación");
    self.skipWaiting();
  }
});

function shouldHandle(request) {
  if(request.method !== "GET")
    return false;

  if (!ALLOWED_ORIGINS.includes(new URL(request.url).origin))
    return false;

  if(request.cache === "only-if-cached" && request.mode !== "same-origin")
    return false;

  return true;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if(!shouldHandle(request)){
    reportFetch(request, "ignored");
    return;
  }

  event.respondWith(handleRequest(event));
})

async function handleRequest(event) {
  const { request } = event;
  const cache = await caches.open(CACHE_VERSION);
  const key = request.mode === "navigate" ? "./index.html" : request;

  const strategy = pickStrategy(request);
  return strategy(event, cache, key);

}

function pickStrategy(request) {

  const url = new URL(request.url);

  if (url.pathname.endsWith("/data/productos.json")) return networkFirst;
  if (url.pathname.endsWith("/data/novedades.json")) return staleWhileRevalidate;

  return cacheFirst;
}

async function cacheFirst(event, cache, key) {
  const { request } = event;

  const cached = await cache.match(key);
  if (cached) {
    console.log("[SW] Cache First · HIT => ", request.url);
    reportFetch(request, "cache", "cache-first");
    return cached;
  }

  console.log("[SW] Cache First · MISS => ", request.url);
  try {
    const response = await fromNetwork(request);

    if (response.ok) {
      event.waitUntil(cache.put(key, response.clone()));
    }

    reportFetch(request, "network", "cache-first");
    return response;
  } catch (error) {
    reportFetch(request, "fallback", "cache-first");
    return offlineFallback();
  }
}

async function networkFirst(event, cache, key) {
  const { request } = event;

  try {
    const response = await fromNetwork(request);

    if (response.ok) {
      event.waitUntil(cache.put(key, response.clone()));
    }

    console.log("[SW] Network First · red => ", request.url);
    reportFetch(request, "network", "network-first");
    return response;
  } catch (error) {
    const cached = await cache.match(key);

    if (cached) {
      console.log("[SW] Network First · red caída, uso caché => ", request.url);
      reportFetch(request, "cache", "network-first");
      return cached;
    }

    reportFetch(request, "fallback", "network-first");
    return offlineFallback();
  }
}

async function staleWhileRevalidate(event, cache, key) {
  const { request } = event;

  const cached = await cache.match(key);

  const revalidation = fromNetwork(request)
    .then(async (response) => {
      if (response.ok) {
        await cache.put(key, response.clone());
        reportFetch(request, "updated", "stale-while-revalidate");
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    event.waitUntil(revalidation);
    console.log("[SW] SWR · entrego caché y actualizo en segundo plano => ", request.url);
    reportFetch(request, "cache", "stale-while-revalidate");
    return cached;
  }

  const response = await revalidation;
  if (response) {
    reportFetch(request, "network", "stale-while-revalidate");
    return response;
  }

  reportFetch(request, "fallback", "stale-while-revalidate");
  return offlineFallback();
}

function fromNetwork(request) {
  return fetch(request, { cache: "no-store" });
}

function offlineFallback() {
  return new Response(
    JSON.stringify({ offline: true, message: "Sin conexión y sin copia en caché" }),
    {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "Content-Type": "application/json; charset=utf-8" },
    }
  );
}

function reportFetch(request, source, strategy) {
  self.clients.matchAll({ type: "window" }).then((clients) => {
    const path = request.url.replace(self.location.origin, "");
    clients.forEach((client) =>
      client.postMessage({ type: "FETCH_LOG", method: request.method, path, strategy, source })
    );
  });
}


const DONATION_SYNC_TAG = "foodbank-sync-donations";

// const DONATION_API_URL =
//   "https://jsonplaceholder.typicode.com/posts";
const DONATION_API_URL = `${API_ORIGIN}/api/donaciones`;

const DONATION_LOCK_NAME = "foodbank-donation-sync";

function openDonationDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("foodbank_spa_db", 2);

    request.onsuccess = () => resolve(request.result);

    request.onerror = () => reject(request.error);

    // La aplicación es responsable de actualizar la DB.
    request.onupgradeneeded = () => {
      request.transaction.abort();

      reject(
        new Error(
          "La base de datos debe actualizarse desde la aplicación."
        )
      );
    };
  });
}

async function readOutbox() {
  const db = await openDonationDB();

  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("outbox", "readonly");

      const request = tx.objectStore("outbox").getAll();

      request.onsuccess = () => resolve(request.result);

      request.onerror = () => reject(request.error);

      tx.onabort = () => reject(tx.error);
    });

  } finally {
    db.close();
  }
}

async function removeOutboxItem(id) {
  const db = await openDonationDB();

  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction("outbox", "readwrite");

      tx.objectStore("outbox").delete(id);

      tx.oncomplete = resolve;

      tx.onerror = () => reject(tx.error);

      tx.onabort = () => reject(tx.error);
    });

  } finally {
    db.close();
  }
}

// Envía las donaciones pendientes y cuenta las exitosas.

async function sendOutboxItems() {
  const items = await readOutbox();

  let sentCount = 0;

  for (const item of items) {
    if (item.type !== "donation") continue;

    const response = await fetch(DONATION_API_URL, {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(item.payload)
    });

    if (!response.ok) {
      throw new Error("No se pudo enviar la donación.");
    }

    await removeOutboxItem(item.id);

    sentCount++;
  }

  return sentCount;
}


async function showDonationNotification(count) {
  if (
    Notification.permission !== "granted" ||
    count === 0
  ) {
    return;
  }

  const body = count === 1
    ? "Tu donación pendiente se sincronizó correctamente."
    : `${count} donaciones pendientes se sincronizaron correctamente.`;

  try {
    await self.registration.showNotification(
      "¡Donaciones sincronizadas!",
      {
        body,

        icon: NOTIFICATION_ICON,

       tag: "donations-synced",

        data: {
          url: "donacion"
        }
      }
    );

    console.log("[SW] Notificación de donaciones enviada");

  } catch (error) {
    console.error("[SW] Error mostrando notificación:", error);
  }
}


async function syncDonationOutbox() {
  let sentCount = 0;

  // Evita que dos procesos sincronicen al mismo tiempo.
  if (
    self.navigator.locks &&
    typeof self.navigator.locks.request === "function"
  ) {
    sentCount = await self.navigator.locks.request(
      DONATION_LOCK_NAME,
      sendOutboxItems
    );

  } else {
    sentCount = await sendOutboxItems();
  }

  // Si no se envió nada, no mostramos notificación.
  if (sentCount === 0) {
    console.log("[SW] No hay donaciones pendientes.");
    return;
  }

  // Avisar a las ventanas abiertas.
  const clients = await self.clients.matchAll({
    type: "window"
  });

  clients.forEach((client) => {
    client.postMessage({
      type: "DONATIONS_SYNCED"
    });
  });

  // Mostrar notificación después de sincronizar.
  await showDonationNotification(sentCount);
}



self.addEventListener("sync", (event) => {
  console.log("[SW] sync =>", event.tag);

  if (event.tag === DONATION_SYNC_TAG) {
    event.waitUntil(syncDonationOutbox());
  }
});


self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const target = new URL(
    event.notification.data?.url || "./",
    self.registration.scope
  ).href;

  event.waitUntil(openOrFocus(target));
});

async function openOrFocus(target) {
  const windows = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true
  });

  const existing = windows.find((client) =>
    client.url.startsWith(self.registration.scope)
  );

  if (existing) {
    await existing.navigate(target);
    await existing.focus();
    return;
  }

  return self.clients.openWindow(target);
}

self.addEventListener("push", (event) => {
  let payload = { title: "FoodBank ", body: "Tienes una nueva actualización.", tag: "foodbank-general", url: "./" };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: NOTIFICATION_ICON,
      tag: payload.tag,
      data: { url: payload.url || "./" },
    })
  );
});