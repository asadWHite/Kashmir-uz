/** Client-side API helper for admin CRUD. Throws on non-ok responses. */
export async function api<T = unknown>(
  url: string,
  opts?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts?.headers || {}) },
  });
  let data: Record<string, unknown> = {};
  try {
    data = await res.json();
  } catch {
    /* ignore parse errors */
  }
  if (!res.ok || !data.ok) {
    throw new Error(String(data.error || "Request failed."));
  }
  return data as T;
}
