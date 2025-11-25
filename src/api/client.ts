import axios from "axios";
import { API_BASE_URL } from "../network/config";
import { navigationRef } from "../app/navigation/navigationRef";
import {
  clearTokens,
  getAccessTokenSync,
  getRefreshTokenSync,
  getTokens,
  saveTokens,
  setTokenCache
} from "../storage/authStorage";

const APP_PACKAGE = "com.edufelip.meer";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

api.defaults.headers.common["X-App-Package"] = APP_PACKAGE;

const refreshApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

refreshApi.defaults.headers.common["X-App-Package"] = APP_PACKAGE;

// Logging for refresh calls
refreshApi.interceptors.request.use(
  (config) => {
    console.log(
      `[API][REQUEST][REFRESH] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
      {
        params: config.params,
        data: config.data,
        headers: config.headers
      }
    );
    return config;
  },
  (error) => {
    console.log("[API][REQUEST][REFRESH][ERROR]", error);
    return Promise.reject(error);
  }
);

refreshApi.interceptors.response.use(
  (response) => {
    console.log(`[API][RESPONSE][REFRESH] ${response.status} ${response.config.url}`, { data: response.data });
    return response;
  },
  (error) => {
    if (error?.response) {
      console.log(
        `[API][RESPONSE][REFRESH][ERROR] ${error.response.status} ${error.config?.url}`,
        { data: error.response.data }
      );
    } else {
      console.log("[API][RESPONSE][REFRESH][ERROR]", error.message);
    }
    return Promise.reject(error);
  }
);

// --- Token attachment ---
async function ensureTokenLoaded() {
  // If the in-memory cache is empty, hydrate it once from storage
  if (!getAccessTokenSync() || !getRefreshTokenSync()) {
    await getTokens();
  }
}

api.interceptors.request.use(
  async (config) => {
    await ensureTokenLoaded();
    const token = getAccessTokenSync();
    const merged = {
      ...(config.headers as Record<string, any>),
      "X-App-Package": APP_PACKAGE,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    // AxiosRequestHeaders can be AxiosHeaders (class) or a plain object; casting through unknown keeps TS happy
    config.headers = merged as unknown as typeof config.headers;

    console.log(
      `[API][REQUEST] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
      {
        params: config.params,
        data: config.data,
        headers: config.headers
      }
    );
    return config;
  },
  (error) => {
    console.log("[API][REQUEST][ERROR]", error);
    return Promise.reject(error);
  }
);

// --- Refresh handling ---
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;
let refreshAttempts = 0;
const refreshSubscribers: ((token: string | null) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb);
}

function notifyTokenRefreshed(token: string | null) {
  refreshSubscribers.splice(0).forEach((cb) => cb(token));
}

async function performRefresh(): Promise<string | null> {
  const refreshToken = getRefreshTokenSync();
  if (!refreshToken) return null;

  const res = await refreshApi.post<{ token: string; refreshToken?: string }>("/auth/refresh", {
    refreshToken
  });

  const { token, refreshToken: newRefresh } = res.data;
  await saveTokens(token, newRefresh);
  return token;
}

api.interceptors.response.use(
  (response) => {
    console.log(`[API][RESPONSE] ${response.status} ${response.config.url}`, { data: response.data });
    return response;
  },
  async (error) => {
    const { response, config } = error;

    if (!response) {
      console.log("[API][RESPONSE][ERROR]", error.message);
      return Promise.reject(error);
    }

    console.log(`[API][RESPONSE][ERROR] ${response.status} ${config?.url}`, { data: response.data });

    // If it's not a 401, just propagate
    if (response.status !== 401) {
      return Promise.reject(error);
    }

    // Avoid re-entrant refresh requests: if current request is /auth/refresh and one is in-flight, cancel this one
    const isRefreshCall = config?.url?.includes("/auth/refresh");
    if (isRefreshCall && isRefreshing) {
      return Promise.reject(error);
    }

    // If no refresh token, logout immediately
    await ensureTokenLoaded();
    if (!getRefreshTokenSync()) {
      await clearTokens();
      if (navigationRef.isReady()) navigationRef.navigate("login");
      return Promise.reject(error);
    }

    // If we've already retried this request, avoid loops
    if (config?._retry) {
      await clearTokens();
      if (navigationRef.isReady()) navigationRef.navigate("login");
      return Promise.reject(error);
    }

    config._retry = true;

    // If refresh already in progress, queue this request
    if (isRefreshing && refreshPromise) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newToken) => {
          if (!newToken) return reject(error);
          config.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(config));
        });
      });
    }

    isRefreshing = true;
    refreshPromise = (async () => {
      while (refreshAttempts < 3) {
        try {
          const newTok = await performRefresh();
          refreshAttempts = 0;
          return newTok;
        } catch (err) {
          refreshAttempts += 1;
          if (refreshAttempts >= 3) {
            throw err;
          }
        }
      }
      return null;
    })();

    try {
      const newToken = await refreshPromise;
      isRefreshing = false;
      refreshPromise = null;
      notifyTokenRefreshed(newToken);

      if (!newToken) {
        await clearTokens();
        if (navigationRef.isReady()) navigationRef.navigate("login");
        return Promise.reject(error);
      }

      // Retry original request with new token
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${newToken}`
      };

      return api(config);
    } catch (refreshErr) {
      isRefreshing = false;
      refreshPromise = null;
      notifyTokenRefreshed(null);
      refreshAttempts = 0;
      await clearTokens();
      if (navigationRef.isReady()) navigationRef.navigate("login");
      return Promise.reject(refreshErr);
    }
  }
);

// Helper to set default Authorization after login
export function primeApiToken(token?: string | null) {
  if (token) {
    setTokenCache(token, getRefreshTokenSync());
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  }
}
