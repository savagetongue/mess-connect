import { ApiResponse } from "../../shared/types";
import { useAuth } from "@/hooks/useAuth";
// Assuming errorReporter is globally available or imported
// import { errorReporter } from './errorReporter';
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const start = performance.now();
  const { body, ...restInit } = init || {};
  let token: string | null = null;
  try {
    token = useAuth.getState().token;
  } catch (e) {
    console.warn("useAuth.getState() failed, possibly outside React context. This is expected in some scenarios.");
  }
  const headers = new Headers(restInit.headers);
  const isFormData = body instanceof FormData;
  if (!isFormData && body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const config: RequestInit = { ...restInit, headers };
  if (body) {
    config.body = body;
  }
  const res = await fetch(path, config);
  const duration = performance.now() - start;
  if (duration > 500) {
    console.warn(`Slow API: ${path} took ${Math.round(duration)}ms`);
  }
  if (res.status === 401 && token) {
    useAuth.getState().logout();
    throw new Error("Session expired. Please log in again.");
  }
  let json: ApiResponse<T> | null = null;
  try {
    const text = await res.text();
    json = text ? (JSON.parse(text) as ApiResponse<T>) : null;
  } catch (err) {
    if (!res.ok) {
      // errorReporter?.report({ path, status: res.status, error: 'Failed to parse JSON response from server' });
      throw new Error('An unexpected error occurred. Please try again.');
    }
  }
  if (!res.ok || !json || !json.success || json.data === undefined) {
    const errorMessage = (json && json.error) || 'Request failed';
    // errorReporter?.report({ path, status: res.status, error: errorMessage });
    throw new Error(errorMessage);
  }
  return json.data;
}