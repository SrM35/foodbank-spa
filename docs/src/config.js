const isLocal =
  location.hostname === "localhost" || location.hostname === "127.0.0.1";

export const BASE_PATH = isLocal ? "/docs" : "/foodbank-spa";
export const API_BASE_URL = isLocal
  ? "http://localhost:3000/api"
  : "https://foodbank-spa.onrender.com/api";
