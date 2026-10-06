"use client";

import { useState } from "react";

const MAX_MB = 15;

export default function ImageField({
  value,
  onChange,
  hint = "curtain",
}: {
  value: string;
  onChange: (v: string) => void;
  hint?: "curtain" | "interior" | "gallery";
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [progress, setProgress] = useState(0);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMsg(null);
    setProgress(5);

    // Client-side size check (server revalidates — but UX benefit).
    if (file.size > MAX_MB * 1024 * 1024) {
      setMsg({ kind: "err", text: `Rasm hajmi juda katta. Maksimal hajm: ${MAX_MB} MB.` });
      setBusy(false);
      setProgress(0);
      e.target.value = "";
      return;
    }

    // Client-side MIME screen.
    if (!/^image\/(jpe?g|png|webp|avif)$/i.test(file.type)) {
      setMsg({ kind: "err", text: "Faqat JPG, JPEG, PNG, WEBP, AVIF formatlari ruxsat etiladi." });
      setBusy(false);
      setProgress(0);
      e.target.value = "";
      return;
    }

    setProgress(25);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("hint", hint);
    try {
      setProgress(60);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        onChange(data.url);
        setProgress(100);
        setMsg({
          kind: "ok",
          text: data.message || "Rasm muvaffaqiyatli optimallashtirildi.",
        });
      } else {
        setMsg({ kind: "err", text: data.error || "Rasmni yuklab bo'lmadi." });
      }
    } catch {
      setMsg({ kind: "err", text: "Rasmni yuklab bo'lmadi. Tarmoqni tekshiring." });
    } finally {
      setBusy(false);
      setTimeout(() => setProgress(0), 600);
      e.target.value = "";
    }
  }

  return (
    <div>
      <label className="eyebrow">Изображение</label>
      <div className="mt-2 flex items-start gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden border border-line bg-panel">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-center text-[0.6rem] text-faint">
              Нет фото
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://… или загрузите ниже"
            className="field"
          />
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted hover:text-ink">
              <span className={`btn btn-ghost justify-center ${busy ? "opacity-70" : ""}`}>
                {busy ? "Обработка изображения…" : "Загрузить изображение"}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
                onChange={onFile}
                className="hidden"
                disabled={busy}
              />
            </label>
            <span className="text-[0.7rem] text-faint">
              JPG, PNG, WEBP, AVIF · до {MAX_MB} МБ · авто-оптимизация до WebP
            </span>
          </div>

          {progress > 0 && (
            <div className="h-1 w-full overflow-hidden bg-line">
              <div
                className="h-full bg-ink transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          {msg && (
            <p className={`text-xs ${msg.kind === "ok" ? "text-emerald-600" : "text-red-500/90"}`}>
              {msg.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
