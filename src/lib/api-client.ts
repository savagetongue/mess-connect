import { ApiResponse } from "../../shared/types";
import { useAuth } from "@/hooks/useAuth";
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = useAuth.getState().token;
  const headers = new Headers(init?.headers);
  const isFormData = init?.body instanceof FormData;
  if (!isFormData) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const body = isFormData ? init.body : JSON.stringify(init?.body);
  const res = await fetch(path, { ...init, headers, body });
  const json = (await res.json()) as ApiResponse<T>;
  if (!res.ok || !json.success || json.data === undefined) {
    throw new Error(json.error || 'Request failed');
  }
  return json.data;
}