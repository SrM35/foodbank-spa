const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";

export const BASE_PATH = isLocal ? "/docs" : "/foodbank-spa";