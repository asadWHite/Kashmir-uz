"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/admin/_lib/fetch";
import { PageHeader, Field, Toggle } from "@/app/admin/_components/ui";
import TranslationEditor, {
  TranslationBadges,
  toPayload,
  translationsFromApi,
  type TranslationsDraft,
} from "@/app/admin/_components/TranslationEditor";
import type { Locale } from "@/lib/i18n";

type Faq = {
  id: number;
  questionEn: string;
  answerEn: string;
  sortOrder: number;
  isActive: boolean;
  translations?: Record<string, unknown>;
  translation?: {
    locales: Array<{ locale: Locale; missing: boolean; needsReview: boolean }>;
    complete: boolean;
  };
};

type Draft = Faq & { translationsDraft: TranslationsDraft };

const FIELDS = [
  { key: "title" as const, label: { uz: "Savol (UZ)", ru: "Вопрос (RU)", en: "Question (EN)" } },
  {
    key: "description" as const,
    label: { uz: "Javob (UZ)", ru: "Ответ (RU)", en: "Answer (EN)" },
    multiline: true,
    rows: 3,
  },
];

export default function FaqAdmin() {
  const [items, setItems] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await api<{ faq: Faq[] }>("/api/admin/faq");
      setItems(res.faq);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openEditor(item?: Faq) {
    setErr("");
    setOk("");
    setDraft({
      id: item?.id ?? 0,
      questionEn: item?.questionEn ?? "",
      answerEn: item?.answerEn ?? "",
      sortOrder: item?.sortOrder ?? 0,
      isActive: item?.isActive ?? true,
      translationsDraft: translationsFromApi(item?.translations),
    });
  }

  async function save() {
    if (!draft) return;
    const q = draft.translationsDraft.en.title.trim();
    const a = draft.translationsDraft.en.description.trim();
    if (!q || !a) {
      setErr("Заполните вопрос и ответ на английском (EN) — это обязательный язык записи.");
      return;
    }
    setSaving(true);
    setErr("");
    setOk("");
    try {
      const body = {
        questionEn: q,
        answerEn: a,
        sortOrder: draft.sortOrder,
        isActive: draft.isActive,
        translations: toPayload(draft.translationsDraft),
      };
      if (draft.id) {
        await api(`/api/admin/faq/${draft.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await api("/api/admin/faq", { method: "POST", body: JSON.stringify(body) });
      }
      setDraft(null);
      setOk("Сохранено.");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Удалить этот вопрос?")) return;
    try {
      await api(`/api/admin/faq/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ошибка удаления");
    }
  }

  return (
    <>
      <PageHeader
        title="Вопросы (FAQ)"
        sub="Вопрос и ответ независимо на трёх языках."
        action={
          <button type="button" onClick={() => openEditor()} className="btn btn-solid">
            + Добавить вопрос
          </button>
        }
      />

      {ok && <p className="mb-4 text-sm text-accent">{ok}</p>}

      {loading ? (
        <p className="text-sm text-muted">Загрузка…</p>
      ) : items.length === 0 ? (
        <p className="border border-line bg-surface p-6 text-sm text-faint">Вопросов пока нет.</p>
      ) : (
        <ul className="divide-y divide-line border border-line bg-surface">
          {items.map((f) => {
            const en = f.translations?.en as { title?: string } | undefined;
            return (
              <li key={f.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{en?.title || f.questionEn}</p>
                  <div className="mt-1">
                    <TranslationBadges status={f.translation} />
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => openEditor(f)} className="btn btn-ghost px-3 py-2 text-xs">
                    Изменить
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(f.id)}
                    className="btn btn-ghost px-3 py-2 text-xs text-red-500/90"
                  >
                    Удалить
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {draft && (
        <div className="mt-8 border border-line bg-surface p-6 md:p-8">
          <h2 className="mb-6 font-display text-xl text-ink">
            {draft.id ? "Редактировать вопрос" : "Новый вопрос"}
          </h2>
          <TranslationEditor
            value={draft.translationsDraft}
            onChange={(next) => setDraft((d) => (d ? { ...d, translationsDraft: next } : d))}
            fields={FIELDS}
            disabled={saving}
          />
          <div className="mt-6 flex flex-wrap items-center gap-8">
            <Field
              label="Порядок"
              type="number"
              value={draft.sortOrder}
              onChange={(v) => setDraft({ ...draft, sortOrder: Number(v) || 0 })}
            />
            <div className="pb-3">
              <Toggle
                checked={draft.isActive}
                onChange={(v) => setDraft({ ...draft, isActive: v })}
                label="Активен"
              />
            </div>
          </div>
          {err && <p className="mt-5 text-sm text-red-500/90">{err}</p>}
          <div className="mt-7 flex gap-3">
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
