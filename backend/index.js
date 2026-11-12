import express from "express";
import cors from "cors";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const PORT = process.env.PORT || 3000;

const app = express();

app.use(cors());
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

app.get("/api/productos", async (req, res) => {
  try {
    const productos = await readJSON("productos.json", []);
    const query = String(req.query.q || "").trim().toLowerCase();

    if (!query || query === "alimentos") {
      return res.json(productos);
    }

    const filtrados = productos.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.meta.toLowerCase().includes(query)
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
        error: "Todos los campos son obligatorios y la cantidad debe ser mayor a 0.",
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
      (p) => p.title.toLowerCase() === nuevaDonacion.nombreProducto.toLowerCase()
    );

    if (productoExistente) {
      productoExistente.stock = (productoExistente.stock || 0) + nuevaDonacion.cantidadProducto;
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
      address: "Luis Donaldo Colosio, Indeco, Donceles 28, 23078 La Paz, B.C.S.",
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