import { openDB } from "https://cdn.jsdelivr.net/npm/idb@8/+esm";

const DB_NAME = "foodbank_spa_db";
const DB_VERSION = 1;
const STORE_NAME = "favorites";

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      const store = db.createObjectStore(STORE_NAME, {
        keyPath: "id",
        autoIncrement: true
      });

      store.createIndex("by_category", "category", {
        unique: false
      });
    }
  }
});

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

  return db.getAllFromIndex(
    STORE_NAME,
    "by_category",
    category
  );
}

export async function deleteFavorite(id) {
  const db = await dbPromise;
  return db.delete(STORE_NAME, id);
}