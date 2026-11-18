import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { ApiError, type BackendErrorResponse } from '@school-erp/api-client';
import { SecureStorage } from '../storage/secure-store.js';

const ACCESS_TOKEN_KEY = 'school_erp_access_token';
const REFRESH_TOKEN_KEY = 'school_erp_refresh_token';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token!);
    }
  });
  failedQueue = [];
}

export function createApiClient(baseURL?: string): AxiosInstance {
  const url =
    baseURL ||
    process.env['EXPO_PUBLIC_API_URL'] ||
    process.env['NEXT_PUBLIC_API_URL'] ||
    'http://localhost:3000';

  const client = axios.create({
    baseURL: url,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor: attach bearer token
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await SecureStorage.getItem(ACCESS_TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  // Response interceptor: single-flight refresh on 401
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

      // Check if it's a 401 from a regular authenticated endpoint
      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !originalRequest.url?.includes('/v1/auth/login') &&
        !originalRequest.url?.includes('/v1/auth/refresh')
      ) {
        if (isRefreshing) {
          // Another request is already refreshing; queue this request
          return new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((newToken) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
              }
              return client(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = await SecureStorage.getItem(REFRESH_TOKEN_KEY);
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          // Strict single-flight refresh call
          const response = await axios.post<{
            tokens: { accessToken: string; refreshToken: string };
          }>(`${url}/v1/auth/refresh`, { refreshToken });

          const { accessToken, refreshToken: newRefreshToken } = response.data.tokens;

          await SecureStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
          await SecureStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);

          processQueue(null, accessToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return client(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          // Revoke local tokens on failed refresh
          await SecureStorage.removeItem(ACCESS_TOKEN_KEY);
          await SecureStorage.removeItem(REFRESH_TOKEN_KEY);
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // Format into standard ApiError
      if (error.response?.data) {
        const backendData = error.response.data as BackendErrorResponse;
        if (backendData.error) {
          return Promise.reject(new ApiError(error.response.status, backendData.error));
        }
      }

      return Promise.reject(
        new ApiError(error.response?.status || 500, {
          code: 'NETWORK_ERROR',
          message: error.message || 'Network request failed',
        }),
      );
    },
  );

  return client;
}

export const apiClient = createApiClient();
