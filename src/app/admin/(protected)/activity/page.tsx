"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/app/admin/_lib/fetch";
import { PageHeader } from "@/app/admin/_components/ui";

type AdminSession = {
  id: string;
  adminEmail: string;
  ipAddress: string | null;
  userAgent: string | null;
  loginAt: string;
  lastSeenAt: string;
  logoutAt: string | null;
  expiresAt: string;
  logoutReason: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tashkent",
  }).format(date);
}

function formatDuration(milliseconds: number) {
  const totalMinutes = Math.max(0, Math.floor(milliseconds / 60_000));
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;
  if (days) return `${days} д ${hours} ч`;
  if (hours) return `${hours} ч ${minutes} мин`;
  return `${minutes} мин`;
}

function getStatus(item: AdminSession, now: number) {
  if (item.logoutAt) return { label: "Вышел", className: "text-muted" };
  if (new Date(item.expiresAt).getTime() <= now) {
    return { label: "Срок сессии истёк", className: "text-muted" };
  }
  if (now - new Date(item.lastSeenAt).getTime() <= 2 * 60_000) {
    return { label: "Активен", className: "text-emerald-600" };
  }
  return { label: "Нет активности", className: "text-amber-600" };
}

export default function AdminActivityPage() {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

  async function load() {
    setLoading(true);
    setError("");
    try {
      const result = await api<{ sessions: AdminSession[] }>("/api/admin/activity");
      setSessions(result.sessions);
      setNow(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить историю.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const clockTimer = window.setInterval(() => setNow(Date.now()), 30_000);
    const refreshTimer = window.setInterval(() => void load(), 60_000);
    return () => {
      window.clearInterval(clockTimer);
      window.clearInterval(refreshTimer);
    };
  }, []);

  const activeCount = useMemo(
    () => sessions.filter((item) => getStatus(item, now).label === "Активен").length,
    [sessions, now],
  );

  return (
    <>
      <PageHeader
        title="История входов"
        sub="Успешные входы администраторов, время последней активности и устройства."
        action={
          <button type="button" onClick={load} className="btn btn-ghost">
            Обновить
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="border border-line bg-surface p-5">
          <p className="font-display text-3xl text-ink">{sessions.length}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-faint">
            Последние записи (до 100)
          </p>
        </div>
        <div className="border border-line bg-surface p-5">
          <p className="font-display text-3xl text-ink">{activeCount}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-faint">
            Активны сейчас (по heartbeat)
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-5 border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted">Загрузка…</p>
      ) : sessions.length === 0 ? (
        <p className="border border-line bg-surface p-6 text-sm text-faint">
          Записей пока нет. Новые входы появятся здесь после следующего входа администратора.
        </p>
      ) : (
        <div className="overflow-x-auto border border-line bg-surface">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead className="bg-panel text-xs uppercase tracking-[0.12em] text-faint">
              <tr>
                <th className="px-4 py-3 font-medium">Администратор</th>
                <th className="px-4 py-3 font-medium">Вход</th>
                <th className="px-4 py-3 font-medium">Последняя активность</th>
                <th className="px-4 py-3 font-medium">Выход</th>
                <th className="px-4 py-3 font-medium">Длительность*</th>
                <th className="px-4 py-3 font-medium">IP</th>
                <th className="px-4 py-3 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sessions.map((item) => {
                const status = getStatus(item, now);
                const end = item.logoutAt
                  ? new Date(item.logoutAt).getTime()
                  : new Date(item.lastSeenAt).getTime();
                const duration = formatDuration(end - new Date(item.loginAt).getTime());
                return (
                  <tr key={item.id} className="align-top">
                    <td className="px-4 py-4 font-medium text-ink">{item.adminEmail}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-muted">{formatDate(item.loginAt)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-muted">{formatDate(item.lastSeenAt)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-muted">{formatDate(item.logoutAt)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-muted">{duration}</td>
                    <td className="px-4 py-4 text-muted">{item.ipAddress || "—"}</td>
                    <td className={`px-4 py-4 whitespace-nowrap font-medium ${status.className}`}>
                      {status.label}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="border-t border-line px-4 py-3 text-xs text-faint">
            * Длительность приблизительная: рассчитывается до выхода или последнего heartbeat.
            При закрытии браузера без выхода точное время закрытия определить нельзя.
          </p>
          <div className="border-t border-line px-4 py-3">
            <details>
              <summary className="cursor-pointer text-xs text-muted">Информация об устройствах и браузерах</summary>
              <div className="mt-3 space-y-3">
                {sessions.map((item) => (
                  <div key={item.id} className="text-xs text-muted">
                    <p className="font-medium text-ink">{item.adminEmail} · {formatDate(item.loginAt)}</p>
                    <p className="mt-1 break-all">{item.userAgent || "User-Agent недоступен"}</p>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </div>
      )}
    </>
  );
}
