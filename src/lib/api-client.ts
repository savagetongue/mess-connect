import { ApiResponse } from "../../shared/types";
import { useAuth } from "@/hooks/useAuth";
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = useAuth.getState().token;
  const { body, ...restInit } = init || {};
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
  const json = (await res.json()) as ApiResponse<T>;
  if (!res.ok || !json.success || json.data === undefined) {
    throw new Error(json.error || 'Request failed');
  }
  return json.data;
}