import { ApiError } from "@/lib/utils";
import axios, { AxiosInstance, AxiosError, AxiosResponse } from "axios";

/* ===========================
   Axios Instance
   =========================== */
const apiClient: AxiosInstance = axios.create({
  baseURL: "http://localhost:8000", // FastAPI base URL
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

/* ===========================
   Request Interceptor
   =========================== */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/* ===========================
   Response / Error Interceptor
   =========================== */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response) {
      throw new ApiError(
        error.message,
        error.response.status,
        error.response.data,
      );
    }

    throw new ApiError("Network error. Server unreachable.");
  },
);

export { apiClient };
