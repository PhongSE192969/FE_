import axios from "axios";
import ENV from "./env";
import { useAuthStore } from "@/stores/authStore";
import { getCurrentFirebaseToken } from "@/services/firebaseAuthService";

const API_BASE_URL = "/api";

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: ENV.API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
});

/**
 * Protected request interceptor
 * Gắn Firebase ID token vào request nếu có.
 */
axiosClient.interceptors.request.use(
  async (config) => {
    if (config.headers?.Authorization) {
      return config;
    }

    let token = useAuthStore.getState().accessToken;

    if (!token) {
      token = await getCurrentFirebaseToken();

      if (token) {
        useAuthStore.getState().setAccessToken?.(token);
      }
    }

    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * Protected response interceptor
 * Nếu Firebase token hết hạn hoặc invalid, lấy token mới rồi retry request.
 */
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const status = error.response?.status;

    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers = {
              ...originalRequest.headers,
              Authorization: `Bearer ${token}`,
            };

            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await getCurrentFirebaseToken(true);

        if (!newToken) {
          throw new Error("Missing Firebase ID token");
        }

        useAuthStore.getState().setAccessToken?.(newToken);

        processQueue(null, newToken);

        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${newToken}`,
        };

        return axiosClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        useAuthStore.getState().logout?.();
        localStorage.removeItem("capital-coffee-auth");

        const currentPath = window.location.pathname;

        if (currentPath.startsWith("/admin")) {
          window.location.href = "/admin/login";
        } else {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Public axios client
 * Dùng cho login/register/forgot password/sync public nếu không muốn interceptor retry.
 */
const publicAxiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: ENV.API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
});

publicAxiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    return Promise.reject({
      ...(error.response?.data || {}),
      status: error.response?.status,
      message:
        error.response?.data?.message ||
        error.message ||
        "Request failed",
    });
  }
);

export { axiosClient, publicAxiosClient };