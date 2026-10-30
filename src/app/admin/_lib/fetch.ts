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
    // When the server answers with a non-JSON body (e.g. an unhandled
    // route exception because the database is unreachable), `data.error`
    // is empty and the bare fallback "Ошибка запроса." hides the real
    // cause. Surface the HTTP status and point at the most likely culprit.
    throw new Error(
      String(
        data.error ||
          `Ошибка запроса (HTTP ${res.status}). Если ошибка сохраняется, проверьте подключение к серверу и базе данных (DATABASE_URL).`,
      ),
    );
  }
  return data as T;
}
