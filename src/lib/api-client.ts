import { ApiResponse } from "../../shared/types";
import { useAuth } from "@/hooks/useAuth";
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const { body, ...restInit } = init || {};
  let token: string | null = null;
  try {
    // Prefer token from localStorage at runtime (safe for SSR), fall back to useAuth state
    token = (typeof localStorage !== 'undefined' && localStorage.getItem('token')) || useAuth.getState().token;
  } catch (e) {
    // localStorage may not be available in some runtimes — fall back to useAuth
    token = useAuth.getState().token;
  }
  const headers = new Headers(restInit.headers);
  const isFormData = body instanceof FormData;

  if (!isFormData && body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const config: RequestInit = {
    ...restInit,
    headers,
  };

  if (body) {
    config.body = body;
  }

  const res = await fetch(path, config);

  // Try to read response as text first so we can handle non-JSON responses gracefully
  let json: ApiResponse<T> | null = null;
  let text: string | null = null;
  try {
    text = await res.text();
    // Try parsing JSON if any text present
    json = text ? (JSON.parse(text) as ApiResponse<T>) : null;
  } catch (err) {
    // If parsing failed and response wasn't ok, surface the raw text (if available)
    if (!res.ok) {
      throw new Error(text || 'Request failed');
    }
    // If parsing failed but response was OK, it's an unexpected non-JSON success response
    throw new Error('Failed to parse JSON response');
  }

  if (!res.ok || !json || !json.success || json.data === undefined) {
    throw new Error((json && json.error) || 'Request failed');
  }
  return json.data;
}