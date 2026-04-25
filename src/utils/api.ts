const explicitApiBase = normalizeBase(import.meta.env.VITE_API_BASE_URL);

function normalizeBase(value?: string) {
  if (!value) return "";
  return value.trim().replace(/\/+$/, "");
}

function getLocalBackendBase() {
  if (typeof window === "undefined") return "";
  if (!/^https?:$/.test(window.location.protocol) || !window.location.hostname) {
    return "";
  }
  return `${window.location.protocol}//${window.location.hostname}:5000`;
}

function buildCandidates(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const candidates = [normalizedPath];

  if (explicitApiBase) {
    candidates.push(`${explicitApiBase}${normalizedPath}`);
  }

  const localBackendBase = getLocalBackendBase();
  if (localBackendBase) {
    candidates.push(`${localBackendBase}${normalizedPath}`);
  }

  return [...new Set(candidates)];
}

function getApiBase() {
  if (explicitApiBase) return explicitApiBase;
  return getLocalBackendBase();
}

function isAbsoluteUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

export function resolveAssetUrl(value?: string) {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  if (isAbsoluteUrl(normalized) || normalized.startsWith("data:") || normalized.startsWith("blob:")) {
    return normalized;
  }

  const apiBase = getApiBase();
  if (!apiBase) return normalized;

  if (normalized.startsWith("/")) {
    return `${apiBase}${normalized}`;
  }

  return `${apiBase}/${normalized.replace(/^\/+/, "")}`;
}

async function attemptRequest(
  url: string,
  init: RequestInit,
  parseAs: "json" | "response",
) {
  const response = await fetch(url, init);

  if (!response.ok) {
    const error: Error & { status?: number; response?: Response } = new Error(response.statusText || "Request failed");
    error.status = response.status;
    error.response = response;
    throw error;
  }

  return parseAs === "response" ? response : response.json();
}

function shouldRetry(error: unknown) {
  const status = typeof error === "object" && error && "status" in error ? Number((error as { status?: number }).status) : 0;
  return !status || status >= 500;
}

export async function apiJson<T>(path: string, init: RequestInit = {}) {
  const candidates = buildCandidates(path);
  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      return (await attemptRequest(candidate, init, "json")) as T;
    } catch (error) {
      lastError = error;
      if (!shouldRetry(error)) break;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Request failed");
}

export async function apiRequest(path: string, init: RequestInit = {}) {
  const candidates = buildCandidates(path);
  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      return (await attemptRequest(candidate, init, "response")) as Response;
    } catch (error) {
      lastError = error;
      if (!shouldRetry(error)) break;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Request failed");
}
