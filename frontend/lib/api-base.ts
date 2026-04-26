/** Base da API (FastAPI) usada pelo frontend. Sem barra final. */
export function getApiBaseUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL || "").trim();
  if (!raw) return "";
  return raw.replace(/\/+$/, "");
}
