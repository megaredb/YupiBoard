import axios, { type AxiosRequestConfig } from "axios";
import { apiClient } from "@/shared/api/client";
import { toApiError, type ApiError } from "@/shared/api/errors";

export async function customInstance<T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> {
  try {
    const response = await apiClient.request<T>({ ...config, ...options });
    return response.data;
  } catch (error) {
    // Aborts are rethrown untouched so TanStack Query recognises and ignores them.
    if (axios.isCancel(error)) throw error;
    throw toApiError(error);
  }
}

// Read by Orval to type the `error` of every generated hook.
export type ErrorType<_Error> = ApiError;
