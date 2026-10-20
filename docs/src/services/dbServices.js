
import { openDB } from "https://cdn.jsdelivr.net/npm/idb@8/+esm";

const DB_NAME = "foodbank_spa_db";
const DB_VERSION = 2;
const STORE_NAME = "favorites";
const OUTBOX_STORE = "outbox";

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    // Conservar el almacén de favoritos.
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      const store = db.createObjectStore(STORE_NAME, {
        keyPath: "id",
        autoIncrement: true,
      });

      store.createIndex("by_category", "category", {
        unique: false,
      });
    }

    // Crear la cola de donaciones pendientes.
    if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
      db.createObjectStore(OUTBOX_STORE, {
        keyPath: "id",
        autoIncrement: true,
      });
    }
  },
});

// FAVORITOS
export async function addFavorite(favorite) {
  const db = await dbPromise;
  return db.put(STORE_NAME, favorite);
}

export async function getFavorites() {
  const db = await dbPromise;
  return db.getAll(STORE_NAME);
}

export async function getFavoritesByCategory(category) {
  const db = await dbPromise;
  return db.getAllFromIndex(STORE_NAME, "by_category", category);
}

export async function deleteFavorite(id) {
  const db = await dbPromise;
  return db.delete(STORE_NAME, id);
}

// COLA DE DONACIONES
export async function enqueueDonation(donation) {
  const db = await dbPromise;

  return db.add(OUTBOX_STORE, {
    type: "donation",
    payload: donation,
    createdAt: new Date().toISOString(),
    status: "pending",
  });
}

export async function getPendingActions() {
  const db = await dbPromise;
  return db.getAll(OUTBOX_STORE);
}

export async function getPendingCount() {
  const db = await dbPromise;
  return db.count(OUTBOX_STORE);
}

export async function deletePendingAction(id) {
  const db = await dbPromise;
  return db.delete(OUTBOX_STORE, id);
}
