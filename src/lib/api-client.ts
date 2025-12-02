import { ApiResponse } from "../../shared/types";
import { useAuth } from "@/hooks/useAuth";
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
export async function api<T>(path: string, init?: RequestInit, retries = 1): Promise<T> {
  const start = performance.now();
  const { body, ...restInit } = init || {};
  let token: string | null = null;
  try {
    token = useAuth.getState().token;
  } catch (e) {
    console.warn("useAuth.getState() failed, possibly outside React context.");
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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
  config.signal = controller.signal;
  try {
    const res = await fetch(path, config);
    clearTimeout(timeoutId);
    const duration = performance.now() - start;
    if (duration > 1000) {
      console.warn(`Slow API: ${init?.method || 'GET'} ${path} took ${Math.round(duration)}ms`);
    }
    if (res.status === 401 && token) {
      useAuth.getState().logout();
      throw new Error("Session expired. Please log in again.");
    }
    if (res.status >= 500 && retries > 0) {
      await delay(200); // Wait before retrying
      return api(path, init, retries - 1);
    }
    let json: ApiResponse<T> | null = null;
    try {
      const text = await res.text();
      json = text ? (JSON.parse(text) as ApiResponse<T>) : null;
    } catch (err) {
      if (!res.ok) {
        throw new Error(`API Error ${res.status}: ${res.statusText}`);
      }
    }
    if (!res.ok || !json || !json.success || json.data === undefined) {
      const errorMessage = (json && json.error) || `Request failed with status ${res.status}`;
      throw new Error(errorMessage);
    }
    return json.data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  }
}