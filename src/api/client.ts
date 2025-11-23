import axios from "axios";
import { API_BASE_URL } from "../network/config";
import { navigationRef } from "../app/navigation/navigationRef";
import { clearTokens, getTokens, saveTokens } from "../storage/authStorage";
import { refreshToken as refreshTokenApi } from "./auth";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

api.interceptors.request.use(
  async (config) => {
    const { token } = await getTokens();
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`
      };
    }

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

api.interceptors.response.use(
  (response) => {
    console.log(`[API][RESPONSE] ${response.status} ${response.config.url}`, { data: response.data });
    return response;
  },
  async (error) => {
    if (error.response) {
      console.log(
        `[API][RESPONSE][ERROR] ${error.response.status} ${error.config?.url}`,
        { data: error.response.data }
      );

      if (error.response.status === 401) {
        const originalRequest = error.config;
        if (originalRequest?._retry) {
          await clearTokens();
          if (navigationRef.isReady()) navigationRef.navigate("login");
          return Promise.reject(error);
        }
        originalRequest._retry = true;

        const { refreshToken } = await getTokens();
        if (!refreshToken) {
          await clearTokens();
          if (navigationRef.isReady()) navigationRef.navigate("login");
          return Promise.reject(error);
        }

        try {
          const refreshed = await refreshTokenApi(refreshToken);
          await saveTokens(refreshed.token, refreshed.refreshToken);
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${refreshed.token}`
          };
          return api(originalRequest);
        } catch (refreshErr) {
          await clearTokens();
          if (navigationRef.isReady()) navigationRef.navigate("login");
          return Promise.reject(refreshErr);
        }
      }
    } else {
      console.log("[API][RESPONSE][ERROR]", error.message);
    }
    return Promise.reject(error);
  }
);
