import { clearToken, getRefreshToken, getToken, setRefreshToken, setToken } from "./auth";

// API base: prefer explicit backend URL; fallback to proxy /api.
// Prefer same-origin proxy to avoid CORS in the browser; env URLs are fallbacks.
const BASE_URL =
  process.env.NEXT_PUBLIC_API_PROXY ||
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "/api";
const APP_PACKAGE = process.env.NEXT_PUBLIC_APP_PACKAGE || process.env.EXPO_PUBLIC_APP_PACKAGE || "com.edufelip.meer";

let refreshPromise: Promise<boolean> | null = null;
let isRefreshing = false;

async function request<T>(path: string, options: RequestInit = {}, attempt = 0): Promise<T> {
  // If a refresh is in-flight, wait for it before issuing this request
  if (isRefreshing && refreshPromise) {
    const ok = await refreshPromise;
    if (!ok) throw new Error("Unauthorized");
  }

  const token = getToken();
  const providedHeaders =
    options.headers instanceof Headers ? Object.fromEntries(options.headers.entries()) : options.headers ?? {};
  const hasBody = options.body !== undefined && options.body !== null;
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const hasContentTypeHeader = Object.keys(providedHeaders).some((key) => key.toLowerCase() === "content-type");
  const headers: HeadersInit = {
    Accept: "application/json",
    ...(hasBody && !isFormData && !hasContentTypeHeader ? { "Content-Type": "application/json" } : {}),
    "X-App-Package": APP_PACKAGE,
    ...providedHeaders
  };
  if (token) {
    (headers as any).Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (process.env.NODE_ENV !== "production") {
    console.log("[API][REQUEST]", options.method ?? "GET", `${BASE_URL}${path}`, {
      body: options.body,
      headers
    });
  }

  if (res.status === 401 && attempt === 0) {
    // start or reuse refresh
    if (!refreshPromise) {
      refreshPromise = refreshToken();
      isRefreshing = true;
    }
    const ok = await refreshPromise;
    refreshPromise = null;
    isRefreshing = false;
    if (!ok) {
      clearToken();
      throw new Error("Unauthorized");
    }
    // retry original once
    return request<T>(path, options, attempt + 1);
  }

  if (!res.ok) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[API][RESPONSE][ERROR]", res.status, path);
    }
    throw new Error(`API error ${res.status}`);
  }

  if (process.env.NODE_ENV !== "production") {
    const clone = res.clone();
    try {
      const data = await clone.json();
      console.log("[API][RESPONSE]", res.status, path, data);
    } catch {
      console.log("[API][RESPONSE]", res.status, path);
    }
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: any) => request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: any) => request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: any) => request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  del: <T>(path: string, body?: any) => request<T>(path, { method: "DELETE", body: body ? JSON.stringify(body) : undefined })
};

async function refreshToken(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ refreshToken: refresh })
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { token: string; refreshToken?: string };
    setToken(data.token);
    if (data.refreshToken) setRefreshToken(data.refreshToken);
    return true;
  } catch {
    clearToken();
    return false;
  }
}
