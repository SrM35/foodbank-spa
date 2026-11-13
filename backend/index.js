import "dotenv/config";
import express from "express";
import cors from "cors";
import * as webpush from "web-push";
import Database from "better-sqlite3";
import fs from "node:fs/promises";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const PORT = process.env.PORT || 3000;

const {
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
  VAPID_SUBJECT = "mailto:foodbankBCS@gmail.com",
  ALLOWED_ORIGIN,
  NODE_ENV,
} = process.env;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error("Faltan VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY en .env");
  process.exit(1);
}
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

mkdirSync(DATA_DIR, { recursive: true });
const db = new Database(path.join(DATA_DIR, "foodbank.db"));
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    TEXT NOT NULL,
    nombre     TEXT,
    endpoint   TEXT NOT NULL UNIQUE,
    p256dh     TEXT NOT NULL,
    auth       TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id);
`);

const upsertSub = db.prepare(`
  INSERT INTO push_subscriptions (user_id, nombre, endpoint, p256dh, auth)
  VALUES (@user_id, @nombre, @endpoint, @p256dh, @auth)
  ON CONFLICT(endpoint) DO UPDATE SET
    user_id = excluded.user_id, nombre = excluded.nombre,
    p256dh = excluded.p256dh,   auth = excluded.auth
  WHERE user_id IS NOT excluded.user_id OR nombre IS NOT excluded.nombre
     OR p256dh IS NOT excluded.p256dh   OR auth IS NOT excluded.auth
`);
const deleteSub = db.prepare(
  "DELETE FROM push_subscriptions WHERE endpoint = ?",
);
const allSubs = db.prepare("SELECT * FROM push_subscriptions");

const app = express();

const allowedOrigins = [ALLOWED_ORIGIN];
if (NODE_ENV !== "production") {
  allowedOrigins.push("http://localhost:5500", "http://127.0.0.1:5500");
}

app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.filter(Boolean).includes(origin))
        return cb(null, true);
      cb(new Error(`Origen no permitido por CORS: ${origin}`));
    },
  }),
);
app.use(express.json());

async function readJSON(filename, fallback = []) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    await writeJSON(filename, fallback);
    return fallback;
  }
}

async function writeJSON(filename, data) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const filePath = path.join(DATA_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

app.get("/api/push/vapid-public-key", (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

app.post("/api/push/subscribe", (req, res) => {
  try {
    const { user_id, nombre, subscription } = req.body;
    if (
      !user_id ||
      !subscription?.endpoint ||
      !subscription?.keys?.p256dh ||
      !subscription?.keys?.auth
    ) {
      return res
        .status(400)
        .json({ error: "Faltan user_id o suscripción completa." });
    }
    upsertSub.run({
      user_id: String(user_id).trim().toLowerCase(),
      nombre: String(nombre || "").trim(),
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    });
    res.status(201).json({ message: "Suscripción guardada." });
  } catch (e) {
    console.error("[Push] subscribe:", e);
    res.status(500).json({ error: "No se pudo guardar la suscripción." });
  }
});

app.post("/api/push/unsubscribe", (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint)
    return res.status(400).json({ error: "Se requiere endpoint." });
  deleteSub.run(endpoint);
  res.json({ message: "Suscripción eliminada." });
});

async function sendPushNotification(payload, { ttlSeconds = 3600 } = {}) {
  const body = JSON.stringify(payload);
  const subs = allSubs.all();
  console.log(`[Push] enviando a ${subs.length} suscripciones`);
  await Promise.allSettled(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
          { TTL: ttlSeconds },
        );
        console.log(
          `[Push] ok -> ${s.nombre || s.user_id} (${new URL(s.endpoint).host})`,
        );
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          deleteSub.run(s.endpoint);
          console.warn(`[Push] ${err.statusCode}: suscripción eliminada`);
        } else if (err.statusCode === 429) {
          console.warn("[Push] 429 del servicio push, se omite");
        } else {
          console.error("[Push] error:", err.statusCode || err.message);
        }
      }
    }),
  );
}

app.get("/api/productos", async (req, res) => {
  try {
    const productos = await readJSON("productos.json", []);
    const query = String(req.query.q || "")
      .trim()
      .toLowerCase();

    if (!query || query === "alimentos") {
      return res.json(productos);
    }

    const filtrados = productos.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.meta.toLowerCase().includes(query),
    );

    res.json(filtrados);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los productos" });
  }
});

app.get("/api/productos/:id", async (req, res) => {
  try {
    const productos = await readJSON("productos.json", []);
    const item = productos.find((p) => String(p.id) === String(req.params.id));

    if (!item) {
      return res.status(404).json({ error: "Alimento no encontrado" });
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el detalle del producto" });
  }
});

app.get("/api/donaciones", async (req, res) => {
  try {
    const donaciones = await readJSON("donaciones.json", []);
    res.json(donaciones);
  } catch (error) {
    res.status(500).json({ error: "Error al leer donaciones" });
  }
});

app.post("/api/donaciones", async (req, res) => {
  try {
    const {
      nombreDonante,
      nombreProducto,
      categoriaProducto,
      cantidadProducto,
    } = req.body;

    if (
      !nombreDonante ||
      !nombreProducto ||
      !categoriaProducto ||
      !cantidadProducto ||
      Number(cantidadProducto) <= 0
    ) {
      return res.status(400).json({
        error:
          "Todos los campos son obligatorios y la cantidad debe ser mayor a 0.",
      });
    }

    const donaciones = await readJSON("donaciones.json", []);

    const nuevaDonacion = {
      id: Date.now().toString(),
      nombreDonante: String(nombreDonante).trim(),
      nombreProducto: String(nombreProducto).trim(),
      categoriaProducto: String(categoriaProducto).trim(),
      cantidadProducto: Number(cantidadProducto),
      fechaRegistro: new Date().toISOString(),
    };

    donaciones.unshift(nuevaDonacion);
    await writeJSON("donaciones.json", donaciones);

    const productos = await readJSON("productos.json", []);
    const productoExistente = productos.find(
      (p) =>
        p.title.toLowerCase() === nuevaDonacion.nombreProducto.toLowerCase(),
    );

    if (productoExistente) {
      productoExistente.stock =
        (productoExistente.stock || 0) + nuevaDonacion.cantidadProducto;
    } else {
      productos.push({
        id: String(productos.length + 1),
        title: nuevaDonacion.nombreProducto,
        description: `Donado por ${nuevaDonacion.nombreDonante}`,
        image: "https://via.placeholder.com/180?text=Alimento",
        meta: nuevaDonacion.categoriaProducto,
        stock: nuevaDonacion.cantidadProducto,
      });
    }
    await writeJSON("productos.json", productos);

    sendPushNotification(
      {
        title: "¡Nueva donación!",
        body: `${nuevaDonacion.nombreDonante} donó ${nuevaDonacion.cantidadProducto} de ${nuevaDonacion.nombreProducto}.`,
        tag: `donacion-${nuevaDonacion.id}`,
        url: "donacion",
      },
      { ttlSeconds: 3600 },
    ).catch((e) => console.error("[Push] segundo plano:", e));

    res.status(201).json({
      message: "Donación registrada con éxito",
      donacion: nuevaDonacion,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudo registrar la donación" });
  }
});

app.get("/api/sedes", async (req, res) => {
  const sedes = await readJSON("sedes.json", [
    {
      id: 1,
      name: "Food-bank Diana Laura",
      address: "Carretera al Sur 280, El Zacatal, 23080 La Paz, B.C.S.",
      horario: "Lun a Vie 9:00 - 15:00",
      telefono: "612 320 5600",
      latitude: 24.08111317863611,
      longitude: -110.30847994198002,
    },
    {
      id: 2,
      name: "Food-bank Centro",
      address: "Ignacio Allende 512, Zona Central, 23000 La Paz, B.C.S.",
      horario: "Mar y Jue 10:00 - 14:00",
      telefono: "612 320 5601",
      latitude: 24.154311305351566,
      longitude: -110.3165128628305,
    },
    {
      id: 3,
      name: "Food-bank Indeco",
      address:
        "Luis Donaldo Colosio, Indeco, Donceles 28, 23078 La Paz, B.C.S.",
      horario: "Sáb 9:00 - 13:00",
      telefono: "612 320 5602",
      latitude: 24.12561940667729,
      longitude: -110.3163703409257,
    },
  ]);
  res.json(sedes);
});

app.get("/api/novedades", async (req, res) => {
  const novedades = await readJSON("novedades.json", {
    actualizado: new Date().toISOString(),
    novedades: [
      { id: 1, titulo: "Campaña de acopio de temporada" },
      { id: 2, titulo: "Horario extendido en fin de semana" },
    ],
  });
  res.json(novedades);
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
