"use client";

import { useState } from "react";

export default function ImageField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) onChange(data.url);
      else setErr(data.error || "Не удалось загрузить файл.");
    } catch {
      setErr("Не удалось загрузить файл.");
    } finally {
      setBusy(false);
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
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted hover:text-ink">
            <span className="btn btn-ghost justify-center">
              {busy ? "Загрузка…" : "Загрузить изображение"}
            </span>
            <input type="file" accept="image/*" onChange={onFile} className="hidden" />
          </label>
          {err && <p className="text-xs text-red-500/90">{err}</p>}
        </div>
      </div>
    </div>
  );
}
