const BASE = `${import.meta.env.VITE_API_URL ?? ''}/api`;

export class ApiError extends Error {
  constructor(message: string, public code: string, public status: number, public details?: { field: string; message: string }[]) { super(message); }
}

/** Calls the API, unwraps the { success, message, data } envelope and turns failures into friendly ApiErrors. */
export async function api<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { ...(init?.json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
      body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
    });
  } catch {
    throw new ApiError('We could not reach Farm Story. Please check your connection and try again.', 'NETWORK_ERROR', 0);
  }
  let body: any = null;
  try { body = await res.json(); } catch { /* non-JSON error page */ }
  if (!res.ok || body?.success === false) {
    throw new ApiError(body?.message ?? 'Something went wrong. Please try again.', body?.error ?? 'ERROR', res.status, body?.details);
  }
  return body.data as T;
}
