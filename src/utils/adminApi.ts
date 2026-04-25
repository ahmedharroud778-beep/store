// src/utils/adminApi.ts
import { ADMIN_PATH } from "./adminConfig";
import { apiJson } from "./api";

export function getAdminToken() {
  return localStorage.getItem("admin_token") || "";
}
export function setAdminToken(token: string) {
  localStorage.setItem("admin_token", token);
}
export function clearAdminToken() {
  localStorage.removeItem("admin_token");
}

const ADMIN_BASE = "/admin-api/protected";
export { ADMIN_PATH };

export async function fetchProtected(path: string, opts: RequestInit = {}): Promise<any> {
  const token = getAdminToken();
  const isFormData = typeof FormData !== "undefined" && opts.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(opts.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  try {
    return await apiJson(`${ADMIN_BASE}${path.startsWith("/") ? path : "/" + path}`, {
      ...opts,
      headers,
    });
  } catch (error: any) {
    const response = error?.response as Response | undefined;
    if (response) {
      const body = await response.json().catch(() => ({}));
      const err: any = new Error(body?.error || response.statusText || "Request failed");
      err.status = response.status;
      throw err;
    }

    const err: any = new Error(error?.message || "Request failed");
    err.status = error?.status;
    throw err;
  }
}

