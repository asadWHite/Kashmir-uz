"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/app/admin/_lib/fetch";
import { PageHeader } from "@/app/admin/_components/ui";

/**
 * Public visitor analytics dashboard.
 *
 * This page shows FIRST-PARTY public website statistics (anonymous
 * visitors, page views, sessions) recorded by the public tracker.
 * It is deliberately separate from:
 *  - "Статистика" (/admin/statistics) — marketing counters shown on the
 *    homepage ("В цифрах"), edited manually;
 *  - "История входов" (/admin/activity) — administrator sign-in history.
 *
 * Admin activity is shown at the bottom in its own section and is never
 * combined with public metrics. Empty states are shown when there is no
 * data yet — no statistics are fabricated.
 */

type RangeKey = "today" | "yesterday" | "7d" | "30d" | "90d" | "custom";

interface Report {
  range: RangeKey;
  from: string;
  to: string;
  overview: {
    uniqueVisitors: number;
    totalVisitors: number;
    pageViews: number;
    sessions: number;
    newVisitors: number;
    returningVisitors: number;
    activeNow: number;
    avgSessionDurationSeconds: number;
  };
  timeseries: Array<{ bucket: string; visitors: number; pageViews: number }>;
  topPages: Array<{ path: string; pageViews: number; visitors: number }>;
  topReferrers: Array<{ referrer: string; count: number }>;
  devices: Array<{ label: string; count: number }>;
  browsers: Array<{ label: string; count: number }>;
  operatingSystems: Array<{ label: string; count: number }>;
  languages: Array<{ label: string; count: number }>;
  recentActivity: Array<{
    createdAt: string;
    path: string | null;
    deviceCategory: string | null;
    browser: string | null;
    language: string | null;
  }>;
  admin: {
    logins: number;
    pageViews: number;
    logouts: number;
    recentLogins: Array<{ createdAt: string; path: string | null }>;
  };
}

const RANGES: Array<{ key: RangeKey; label: string }> = [
  { key: "today", label: "Сегодня" },
  { key: "yesterday", label: "Вчера" },
  { key: "7d", label: "7 дней" },
  { key: "30d", label: "30 дней" },
  { key: "90d", label: "90 дней" },
  { key: "custom", label: "Свой период" },
];

function formatNumber(n: number): string {
  return n.toLocaleString("ru-RU");
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0 сек";
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours} ч ${minutes % 60} мин`;
  }
  if (minutes > 0) return `${minutes} мин ${secs} сек`;
  return `${secs} сек`;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tashkent",
  }).format(date);
}

function formatBucket(value: string, range: RangeKey): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    ...(range === "today" || range === "yesterday" ? { hour: "2-digit" } : {}),
    timeZone: "Asia/Tashkent",
  }).format(date);
}

function Card({ value, label }: { value: string; label: string }) {
  return (
    <div className="border border-line bg-surface p-5">
      <p className="font-display text-3xl text-ink">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-faint">{label}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="border border-line bg-surface p-6 text-sm text-faint">{text}</p>
  );
}

function Distribution({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; count: number }>;
}) {
  const max = useMemo(
    () => Math.max(1, ...items.map((i) => i.count)),
    [items],
  );
  return (
    <div className="border border-line bg-surface p-5">
      <h3 className="mb-4 text-sm font-medium text-ink">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-faint">Нет данных за выбранный период.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.label}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted">{item.label}</span>
                <span className="font-medium text-ink">{formatNumber(item.count)}</span>
              </div>
              <div className="h-1.5 w-full bg-panel">
                <div
                  className="h-full bg-ink"
                  style={{ width: `${Math.max(2, (item.count / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TimeseriesChart({
  data,
  range,
}: {
  data: Report["timeseries"];
  range: RangeKey;
}) {
  const max = useMemo(
    () => Math.max(1, ...data.map((d) => Math.max(d.visitors, d.pageViews))),
    [data],
  );
  if (data.length === 0) {
    return <Empty text="Нет данных за выбранный период." />;
  }
  const width = 720;
  const height = 180;
  const barWidth = Math.max(2, width / data.length - 4);
  return (
    <div className="border border-line bg-surface p-5">
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-2">
          <span className="inline-block h-2 w-4 bg-ink" /> Просмотры страниц
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-2 w-4 bg-faint" /> Посетители
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Динамика посещаемости">
        {data.map((d, i) => {
          const x = (i * width) / data.length + 2;
          const viewsH = Math.max(1, (d.pageViews / max) * (height - 24));
          const visitorsH = Math.max(1, (d.visitors / max) * (height - 24));
          return (
            <g key={`${d.bucket}-${i}`}>
              <title>{`${formatBucket(d.bucket, range)}: ${d.pageViews} просмотров, ${d.visitors} посетителей`}</title>
              <rect x={x} y={height - viewsH} width={barWidth} height={viewsH} fill="var(--c-ink)" />
              <rect
                x={x + barWidth + 1}
                y={height - visitorsH}
                width={barWidth}
                height={visitorsH}
                fill="var(--c-faint)"
                opacity={0.6}
              />
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex justify-between text-[11px] text-faint">
        <span>{formatBucket(data[0].bucket, range)}</span>
        <span>{formatBucket(data[data.length - 1].bucket, range)}</span>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<RangeKey>("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const pending = useRef<AbortController | null>(null);
  const load = useCallback(async () => {
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    setReport(null);
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ range });
      if (range === "custom") {
        if (!customFrom || !customTo) {
          setError("Укажите даты начала и окончания периода.");
          setLoading(false);
          return;
        }
        params.set("from", new Date(customFrom + "T00:00:00+05:00").toISOString());
        params.set("to", new Date(new Date(customTo + "T00:00:00+05:00").getTime() + 86_400_000).toISOString());
      }
      const result = await api<{ report: Report }>(`/api/admin/analytics?${params}`, { signal: controller.signal });
      if (!controller.signal.aborted) setReport(result.report);
    } catch (e) {
      if (controller.signal.aborted) return;
      setError(e instanceof Error ? e.message : "Не удалось загрузить аналитику.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [range, customFrom, customTo]);

  useEffect(() => {
    void load();
    return () => pending.current?.abort();
  }, [load]);

  // Live "active now" refresh.
  useEffect(() => {
    const timer = window.setInterval(async () => {
      if (document.hidden) return;
      try {
        const result = await api<{ activeNow: number }>("/api/admin/analytics?active=1");
        setReport((prev) =>
          prev ? { ...prev, overview: { ...prev.overview, activeNow: result.activeNow } } : prev,
        );
      } catch {
        /* polling must never surface errors */
      }
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const o = report?.overview;
  const hasData = (report?.overview.pageViews ?? 0) > 0 || (report?.overview.uniqueVisitors ?? 0) > 0;

  return (
    <>
      <PageHeader
        title="Аналитика"
        sub="Посетители публичного сайта (kashmirdecor.uz). Активность администраторов показана отдельно внизу и не входит в эти цифры."
        action={
          <button type="button" onClick={load} className="btn btn-ghost">
            Обновить
          </button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {RANGES.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setRange(r.key)}
            className={`border px-3 py-2 text-xs transition-colors ${
              range === r.key
                ? "border-ink bg-ink text-base"
                : "border-line bg-surface text-muted hover:text-ink"
            }`}
          >
            {r.label}
          </button>
        ))}
        {range === "custom" && (
          <span className="flex items-center gap-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="field w-auto px-2 py-2 text-xs"
              aria-label="Дата начала"
            />
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="field w-auto px-2 py-2 text-xs"
              aria-label="Дата окончания"
            />
            <button type="button" onClick={load} className="btn btn-solid px-3 py-2 text-xs">
              Применить
            </button>
          </span>
        )}
      </div>

      {error && (
        <div className="mb-5 border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading && !report ? (
        <p className="text-sm text-muted">Загрузка…</p>
      ) : !report ? null : !hasData ? (
        <Empty text="Пока нет данных о посетителях за выбранный период. Статистика начнёт накапливаться после первых визитов на публичный сайт. (Это не ошибка — данные не выдумываются.)" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card value={formatNumber(o?.uniqueVisitors ?? 0)} label="Уникальные посетители" />
            <Card value={formatNumber(o?.totalVisitors ?? 0)} label="Всего посетителей (за всё время)" />
            <Card value={formatNumber(o?.pageViews ?? 0)} label="Просмотры страниц" />
            <Card value={formatNumber(o?.activeNow ?? 0)} label="Сейчас на сайте" />
            <Card value={formatNumber(o?.newVisitors ?? 0)} label="Новые посетители" />
            <Card value={formatNumber(o?.returningVisitors ?? 0)} label="Возвращающиеся" />
            <Card value={formatNumber(o?.sessions ?? 0)} label="Сессии" />
            <Card value={formatDuration(o?.avgSessionDurationSeconds ?? 0)} label="Средняя длительность сессии" />
          </div>

          <section className="mt-8">
            <h2 className="mb-4 font-display text-xl text-ink">Динамика</h2>
            <TimeseriesChart data={report?.timeseries ?? []} range={range} />
          </section>

          <section className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="border border-line bg-surface p-5">
              <h3 className="mb-4 text-sm font-medium text-ink">Самые посещаемые страницы</h3>
              {(report?.topPages.length ?? 0) === 0 ? (
                <p className="text-sm text-faint">Нет данных.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-[0.12em] text-faint">
                    <tr>
                      <th className="pb-2 font-medium">Страница</th>
                      <th className="pb-2 text-right font-medium">Просмотры</th>
                      <th className="pb-2 text-right font-medium">Посетители</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {report?.topPages.map((p) => (
                      <tr key={p.path}>
                        <td className="py-2 text-muted">{p.path}</td>
                        <td className="py-2 text-right font-medium text-ink">{formatNumber(p.pageViews)}</td>
                        <td className="py-2 text-right text-muted">{formatNumber(p.visitors)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="border border-line bg-surface p-5">
              <h3 className="mb-4 text-sm font-medium text-ink">Источники переходов</h3>
              {(report?.topReferrers.length ?? 0) === 0 ? (
                <p className="text-sm text-faint">Нет данных.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-[0.12em] text-faint">
                    <tr>
                      <th className="pb-2 font-medium">Источник</th>
                      <th className="pb-2 text-right font-medium">Переходы</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {report?.topReferrers.map((r) => (
                      <tr key={r.referrer}>
                        <td className="py-2 text-muted">{r.referrer}</td>
                        <td className="py-2 text-right font-medium text-ink">{formatNumber(r.count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Distribution title="Устройства" items={report?.devices ?? []} />
            <Distribution title="Браузеры" items={report?.browsers ?? []} />
            <Distribution title="Операционные системы" items={report?.operatingSystems ?? []} />
            <Distribution title="Языки" items={report?.languages ?? []} />
          </section>

          <section className="mt-8">
            <h2 className="mb-4 font-display text-xl text-ink">Последняя активность посетителей</h2>
            {(report?.recentActivity.length ?? 0) === 0 ? (
              <Empty text="Активности пока нет." />
            ) : (
              <div className="overflow-x-auto border border-line bg-surface">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-panel text-xs uppercase tracking-[0.12em] text-faint">
                    <tr>
                      <th className="px-4 py-3 font-medium">Время</th>
                      <th className="px-4 py-3 font-medium">Страница</th>
                      <th className="px-4 py-3 font-medium">Устройство</th>
                      <th className="px-4 py-3 font-medium">Браузер</th>
                      <th className="px-4 py-3 font-medium">Язык</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {(report?.recentActivity ?? []).map((item, i) => (
                      <tr key={`${item.createdAt}-${i}`}>
                        <td className="px-4 py-3 whitespace-nowrap text-muted">{formatDateTime(item.createdAt)}</td>
                        <td className="px-4 py-3 text-muted">{item.path || "—"}</td>
                        <td className="px-4 py-3 text-muted">{item.deviceCategory || "—"}</td>
                        <td className="px-4 py-3 text-muted">{item.browser || "—"}</td>
                        <td className="px-4 py-3 text-muted">{item.language || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {report && <section className="mt-12 border-t border-line pt-8">
        <h2 className="font-display text-xl text-ink">Активность администраторов</h2>
        <p className="mt-1 text-sm text-muted">
          Отдельный учёт: входы и просмотры в админ-панели. Эти цифры никогда не
          добавляются к статистике посетителей сайта.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <Card value={formatNumber(report?.admin.logins ?? 0)} label="Входы администраторов" />
          <Card value={formatNumber(report?.admin.pageViews ?? 0)} label="Просмотры страниц админки" />
          <Card value={formatNumber(report?.admin.logouts ?? 0)} label="Выходы администраторов" />
        </div>
        {report && report.admin.recentLogins.length > 0 && (
          <div className="mt-4 border border-line bg-surface p-5">
            <h3 className="mb-3 text-sm font-medium text-ink">Последние входы</h3>
            <ul className="space-y-2 text-sm text-muted">
              {report.admin.recentLogins.map((login, i) => (
                <li key={`${login.createdAt}-${i}`}>{formatDateTime(login.createdAt)}</li>
              ))}
            </ul>
          </div>
        )}
      </section>}
    </>
  );
}
