import axios from "axios";
import {
  clearAuthData,
  getAccessToken,
  getRefreshToken,
  saveAuthData,
} from "../utils/authStorage";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

const publicPaths = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
  "/auth/google/login",
  "/auth/google/register",
];

let isRefreshing = false;
let pendingRequests = [];

const processQueue = (error, token = null) => {
  pendingRequests.forEach((request) => {
    if (error) {
      request.reject(error);
      return;
    }
    request.resolve(token);
  });

  pendingRequests = [];
};

const shouldSkipRefresh = (url) => {
  if (!url) {
    return false;
  }
  return publicPaths.some((path) => url.includes(path));
};

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;

    if (
      !originalRequest ||
      status !== 401 ||
      originalRequest._retry ||
      shouldSkipRefresh(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearAuthData();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequests.push({ resolve, reject });
      })
        .then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        })
        .catch((refreshError) => Promise.reject(refreshError));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshClient = axios.create({
        baseURL: API_BASE_URL,
        timeout: 15000,
      });

      const refreshResponse = await refreshClient.post("/auth/refresh", {
        refreshToken,
      });
      const newAccessToken = refreshResponse.data?.accessToken;
      const newRefreshToken = refreshResponse.data?.refreshToken;
      const userRole = refreshResponse.data?.userRole;

      if (!newAccessToken) {
        throw new Error("Refresh response does not contain accessToken");
      }

      saveAuthData({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        userRole,
      });

      processQueue(null, newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearAuthData();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
