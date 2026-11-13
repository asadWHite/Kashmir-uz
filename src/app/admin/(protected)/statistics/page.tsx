"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/app/admin/_lib/fetch";
import { PageHeader, Field, Toggle } from "@/app/admin/_components/ui";
import TranslationEditor, {
  TranslationBadges,
  toPayload,
  translationsFromApi,
  type TranslationsDraft,
} from "@/app/admin/_components/TranslationEditor";
import type { Locale } from "@/lib/i18n";

type Stat = {
  id: number;
  label: string;
  value: string;
  suffix: string | null;
  sortOrder: number;
  isActive: boolean;
  translations?: Record<string, unknown>;
  translation?: {
    locales: Array<{ locale: Locale; missing: boolean; needsReview: boolean }>;
    complete: boolean;
  };
};

type Draft = Stat & { labelText: string; translationsDraft: TranslationsDraft };

/**
 * Localized label only. The number is shared on purpose: "17" or "1200" means
 * the same thing in every language, while the word describing it does not.
 */
const FIELDS = [
  { key: "title" as const, label: { uz: "Sarlavha (UZ)", ru: "Подпись (RU)", en: "Label (EN)" } },
];

export default function StatisticsAdmin() {
  const [items, setItems] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ statistics: Stat[] }>("/api/admin/statistics");
      setItems(res.statistics);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openEditor(item?: Stat) {
    setErr("");
    setDraft({
      id: item?.id ?? 0,
      label: item?.label ?? "",
      value: item?.value ?? "0",
      suffix: item?.suffix ?? "",
      sortOrder: item?.sortOrder ?? 0,
      isActive: item?.isActive ?? true,
      labelText: item?.label ?? "",
      translationsDraft: translationsFromApi(item?.translations),
    });
  }

  async function save() {
    if (!draft) return;
    const anyLabel =
      draft.translationsDraft.uz.title.trim() ||
      draft.translationsDraft.ru.title.trim() ||
      draft.translationsDraft.en.title.trim() ||
      draft.labelText.trim();
    if (!anyLabel) {
      setErr("Укажите подпись хотя бы на одном языке.");
      return;
    }
    setSaving(true);
    setErr("");
    try {
      const body = {
        label: draft.labelText || anyLabel,
        value: draft.value,
        suffix: draft.suffix,
        sortOrder: draft.sortOrder,
        isActive: draft.isActive,
        translations: toPayload(draft.translationsDraft),
      };
      if (draft.id) {
        await api(`/api/admin/statistics/${draft.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await api("/api/admin/statistics", { method: "POST", body: JSON.stringify(body) });
      }
      setDraft(null);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Удалить эту статистику?")) return;
    try {
      await api(`/api/admin/statistics/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ошибка удаления");
    }
  }

  return (
    <>
      <PageHeader
        title="Статистика"
        sub="Цифры, показываемые в блоке «В цифрах» на главной."
        action={
          <button type="button" onClick={() => openEditor()} className="btn btn-solid">
            + Добавить статистику
          </button>
        }
      />

      {loading ? (
        <p className="text-sm text-muted">Загрузка…</p>
      ) : items.length === 0 ? (
        <p className="border border-line bg-surface p-6 text-sm text-faint">Статистики пока нет.</p>
      ) : (
        <ul className="divide-y divide-line border border-line bg-surface">
          {items.map((s) => (
            <li key={s.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4">
              <p className="font-display text-2xl text-ink">
                {s.value}
                {s.suffix}
              </p>
              <div className="flex-1">
                <p className="font-medium text-ink">{s.label}</p>
                <p className="text-xs text-faint">
                  порядок {s.sortOrder}
                  {!s.isActive ? " · скрыта" : ""}
                </p>
                <div className="mt-1">
                  <TranslationBadges status={s.translation} />
                </div>
              </div>
              <button type="button" onClick={() => openEditor(s)} className="btn btn-ghost px-3 py-2 text-xs">
                Изменить
              </button>
              <button
                type="button"
                onClick={() => remove(s.id)}
                className="btn btn-ghost px-3 py-2 text-xs text-red-500/90"
              >
                Удалить
              </button>
            </li>
          ))}
        </ul>
      )}

      {draft && (
        <div className="mt-8 border border-line bg-surface p-6 md:p-8">
          <h2 className="mb-6 font-display text-xl text-ink">
            {draft.id ? "Редактировать статистику" : "Новая статистика"}
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Field label="Значение" value={draft.value} onChange={(v) => setDraft({ ...draft, value: v })} />
            <Field
              label="Суффикс"
              value={draft.suffix ?? ""}
              onChange={(v) => setDraft({ ...draft, suffix: v })}
              placeholder="+ или %"
            />
            <Field
              label="Подпись (служебная)"
              value={draft.labelText}
              onChange={(v) => setDraft({ ...draft, labelText: v })}
            />
          </div>

          <div className="mt-6">
            <p className="eyebrow mb-2">Подпись на трёх языках</p>
            <TranslationEditor
              value={draft.translationsDraft}
              onChange={(next) => setDraft((d) => (d ? { ...d, translationsDraft: next } : d))}
              fields={FIELDS}
              disabled={saving}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field
              label="Порядок"
              type="number"
              value={draft.sortOrder}
              onChange={(v) => setDraft({ ...draft, sortOrder: Number(v) || 0 })}
            />
            <div className="flex items-end pb-3">
              <Toggle
                checked={draft.isActive}
                onChange={(v) => setDraft({ ...draft, isActive: v })}
                label="Активна"
              />
            </div>
          </div>
          {err && <p className="mt-5 text-sm text-red-500/90">{err}</p>}
          <div className="mt-7 flex items-center gap-3">
            <button type="button" onClick={save} disabled={saving} className="btn btn-solid">
              {saving ? "Сохранение…" : "Сохранить"}
            </button>
            <button type="button" onClick={() => setDraft(null)} className="btn btn-ghost">
              Отмена
            </button>
          </div>
        </div>
      )}
    </>
  );
}
