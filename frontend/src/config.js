// =========================
// APP CONFIG
// =========================
// Backend base URL. Set VITE_API_URL in frontend/.env
// (e.g. https://helpdesk-api.onrender.com) when deploying;
// falls back to the local backend during development.

export const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");
