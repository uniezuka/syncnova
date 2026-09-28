// Relative by default: works with the dev proxy (vite.config.ts) and with a
// production deploy where the backend serves the built frontend itself (same origin).
// Set VITE_API_URL in .env only when the frontend is hosted separately from the API.
const API_URL = import.meta.env.VITE_API_URL || "/api";
const TOKEN_KEY = "syncnova_token";

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 204) {
    return undefined as T;
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(res.status, body.error ?? "Request failed");
  }

  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PATCH", body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),

  // multipart upload: no Content-Type header, the browser sets the boundary itself.
  async postForm<T>(path: string, formData: FormData): Promise<T> {
    const token = tokenStorage.get();
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(`${API_URL}${path}`, { method: "POST", body: formData, headers });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new ApiError(res.status, body.error ?? "Upload failed");
    }
    return body as T;
  },

  // Downloads need the auth header too, so a plain <a href> won't work - fetch the
  // bytes here and let the caller turn them into a saved file (see downloadBlob util).
  async getBlob(path: string): Promise<Blob> {
    const token = tokenStorage.get();
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(`${API_URL}${path}`, { headers });
    if (!res.ok) {
      throw new ApiError(res.status, "Download failed");
    }
    return res.blob();
  },
};
