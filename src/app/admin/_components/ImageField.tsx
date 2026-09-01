"use client";

import { useState } from "react";
import { useT } from "@/app/components/I18nProvider";

export default function ImageField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { ta } = useT();
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
      else setErr(data.error || ta("a.errUpload"));
    } catch {
      setErr(ta("a.errUpload"));
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      <label className="eyebrow">{ta("a.image")}</label>
      <div className="mt-2 flex items-start gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden border border-line bg-panel">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-[0.6rem] text-faint">
              {ta("a.noImage")}
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={ta("a.imagePh")}
            className="field"
          />
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted hover:text-ink">
            <span className="btn btn-ghost justify-center">
              {busy ? ta("a.uploading") : ta("a.upload")}
            </span>
            <input type="file" accept="image/*" onChange={onFile} className="hidden" />
          </label>
          {err && <p className="text-xs text-red-500/90">{err}</p>}
        </div>
      </div>
    </div>
  );
}
