import axios from "axios";

import { appConfig } from "../config";
import { authServices } from "../../auth";

const http = axios.create({
  baseURL: appConfig.BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

http.interceptors.request.use(
  (config) => {
    const accessToken = authServices.getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Only handle 401 errors for token refresh
    if (error.response && error.response.status === 401 && !error.config._retry) {
      console.error("session expired!");
      const refreshToken = authServices.getRefreshToken();
      if (!refreshToken) {
        window.location.replace("/login");
        return Promise.reject(error);
      }
      
      try {
        const { accessToken } = await authServices.login({ refreshToken });
        if (!accessToken) {
          window.location.replace("/login");
          return Promise.reject(error);
        }
        
        error.config._retry = true;
        error.config.headers.Authorization = `Bearer ${accessToken}`;
        return http(error.config);
      } catch (refreshError) {
        window.location.replace("/login");
        return Promise.reject(error);
      }
    }
    
    // For all other errors, just reject
    return Promise.reject(error);
  }
);

export { http };
