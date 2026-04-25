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
