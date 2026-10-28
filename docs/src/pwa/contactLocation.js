import {
  supportsGeolocation,
  getCurrentPosition,
  describeError,
  buildMapUrl,
  getPermissionState,
  onPermissionChange,
} from "./geolocation.js";

import { supportsShare, shareContent } from "./share.js";

// Agrega aquí los centros REALES de tu proyecto.
// Cada centro necesita nombre, dirección, latitud y longitud.
const CENTROS = [
   {
     name: "Food-bank Diana laura",
     address: "Carretera al Sur 280, El Zacatal, 23080 La Paz, B.C.S.",
     latitude: 24.08111317863611,
     longitude:  -110.30847994198002,
   },
   {
    name: "Food-bank centro",
    address: "Ignacio Allende 512, Zona Central, 23000 La Paz, B.C.S.",
    latitude: 24.154311305351566,
    longitude:  -110.3165128628305,
   },
    {
    name: "Food-bank Indeco",
    address: "Luis Donaldo Colosio, Indeco, Donceles 28, 23078 La Paz, B.C.S.",
    latitude: 24.12561940667729,
    longitude:  -110.3163703409257,
   }
];

function distanceKm(a, b) {
  const rad = (degrees) => degrees * Math.PI / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);

  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) *
      Math.cos(rad(b.latitude)) *
      Math.sin(dLon / 2) ** 2;

  return 6371 * 2 * Math.atan2(
    Math.sqrt(value),
    Math.sqrt(1 - value)
  );
}

function renderCenters(userPosition) {
  const list = document.getElementById("lista-centros");
  if (!list) return;

  if (!CENTROS.length) {
    list.textContent =
      "Todavía no hay centros registrados. Agrega las direcciones y coordenadas reales para calcular distancias.";
    return;
  }

  const ordered = CENTROS
    .map((center) => ({
      ...center,
      distance: distanceKm(userPosition, center),
    }))
    .sort((a, b) => a.distance - b.distance);

  list.replaceChildren();

  ordered.forEach((center) => {
    const card = document.createElement("article");
    const title = document.createElement("h4");
    const address = document.createElement("p");
    const distance = document.createElement("p");
    const map = document.createElement("a");
    const share = document.createElement("button");

    title.textContent = center.name;
    address.textContent = center.address;
    distance.textContent =
      `Aproximadamente ${center.distance.toFixed(1)} km en línea recta`;

    map.href = buildMapUrl(center);
    map.target = "_blank";
    map.rel = "noopener";
    map.textContent = "Ver en el mapa";

    share.type = "button";
    share.textContent = "Compartir centro";

    share.addEventListener("click", async () => {
      const data = {
        title: center.name,
        text: `${center.name}\n${center.address}\n${buildMapUrl(center)}`,
      };

      try {
        const result = await shareContent(data);
        const status = document.getElementById("estado-ubicacion");

        if (status) {
          status.textContent = {
            shared: "Centro compartido.",
            cancelled: "Cancelaste el menú de compartir.",
            copied: "Información copiada al portapapeles.",
          }[result];
        }
      } catch {
        const status = document.getElementById("estado-ubicacion");
        if (status) status.textContent = "No se pudo compartir el centro.";
      }
    });

    card.append(title, address, distance, map, share);
    list.append(card);
  });
}

export async function initContactLocations() {
  const button = document.getElementById("buscar-centros");
  const addressButton = document.getElementById("buscar-por-direccion");
  const addressInput = document.getElementById("direccion-usuario");
  const status = document.getElementById("estado-ubicacion");

  if (!button || !status) return;

  const permissionMessages = {
    granted: "Permiso de ubicación concedido.",
    denied: "Permiso denegado. Habilítalo en la configuración del sitio o escribe tu dirección.",
    prompt: "Se solicitará permiso cuando pulses el botón.",
    unknown: "Estado del permiso no disponible en este navegador.",
  };

  const updatePermission = (state) => {
    const permission = document.getElementById("estado-permiso-contacto");
    if (permission) {
      permission.textContent =
        permissionMessages[state] || permissionMessages.unknown;
    }
  };

  updatePermission(await getPermissionState());
  onPermissionChange(updatePermission);

  button.addEventListener("click", async () => {
    if (!supportsGeolocation()) {
      status.textContent =
        "Tu navegador no soporta geolocalización. Escribe tu dirección.";
      return;
    }

    status.textContent = "Obteniendo ubicación...";

    try {
      const position = await getCurrentPosition();
      renderCenters(position);
      status.textContent = "Centros ordenados por distancia en línea recta.";
    } catch (error) {
      status.textContent = describeError(error);
    }
  });

 addressButton?.addEventListener("click", () => {
  const value = addressInput?.value.trim();

  if (!value) {
    status.textContent =
      "Pega las coordenadas de Google Maps: latitud, longitud.";
    return;
  }

  // Aceptar coordenadas como: 24.1426, -110.3128
  const coordinates = value.split(",").map(Number);

  if (
    coordinates.length !== 2 ||
    !coordinates.every(Number.isFinite)
  ) {
    status.textContent =
      "Formato incorrecto. Escribe latitud, longitud. Ejemplo: 24.1426, -110.3128";
    return;
  }

  const [latitude, longitude] = coordinates;

  if (
    latitude < -90 || latitude > 90 ||
    longitude < -180 || longitude > 180
  ) {
    status.textContent = "La latitud o longitud está fuera de rango.";
    return;
  }

  renderCenters({ latitude, longitude });

  status.textContent =
    "Centros ordenados desde las coordenadas que ingresaste. Las distancias son en línea recta.";
});
}
