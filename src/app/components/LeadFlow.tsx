"use client";

import { useState } from "react";
import { useT } from "./I18nProvider";

type Step = 0 | 1 | 2 | 3 | 4;

const INTERESTS = ["Classic", "Modern", "Minimal", "Luxury"];
const ROOMS = [
  { key: "living", en: "Living Room", ru: "Гостиная", uz: "Mehmonxona" },
  { key: "bedroom", en: "Bedroom", ru: "Спальня", uz: "Yotoqxona" },
  { key: "office", en: "Office", ru: "Кабинет", uz: "Kabineti" },
  { key: "other", en: "Other", ru: "Другое", uz: "Boshqa" },
];

/** Minimal multi-step lead capture. Saves a real DB row via /api/leads. */
export default function LeadFlow({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, locale } = useT();
  const [step, setStep] = useState<Step>(0);
  const [interest, setInterest] = useState("");
  const [room, setRoom] = useState("");
  const [contactMethod, setContactMethod] = useState("phone");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (!open) return null;

  const reset = () => {
    setStep(0);
    setInterest("");
    setRoom("");
    setContactMethod("phone");
    setName("");
    setPhone("");
    setDone(false);
  };

  const close = () => {
    onClose();
    setTimeout(reset, 300);
  };

  async function submit() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone: contactMethod === "phone" ? phone : null,
          telegram: contactMethod === "telegram" ? phone : null,
          interest,
          room: ROOMS.find((r) => r.key === room)?.[locale] ?? room,
          source: "lead_flow",
        }),
      });
      setDone(true);
    } catch {
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  const Chip = ({
    label,
    onClick,
  }: {
    label: string;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className="btn btn-ghost justify-center"
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 px-5 backdrop-blur-sm">
      <div className="relative w-full max-w-lg border border-line bg-base p-7 md:p-9">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center text-faint hover:text-ink"
        >
          ✕
        </button>

        {done ? (
          <div className="py-8 text-center">
            <p className="font-display text-2xl text-ink">{t("lead.success")}</p>
            <button type="button" onClick={close} className="btn btn-solid mt-8">
              OK
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`h-px flex-1 transition-colors ${
                    i <= step ? "bg-ink" : "bg-line"
                  }`}
                />
              ))}
            </div>

            {step === 0 && (
              <>
                <h2 className="mb-5 font-display text-2xl text-ink">{t("lead.interest")}</h2>
                <div className="grid grid-cols-2 gap-3">
                  {INTERESTS.map((i) => (
                    <Chip key={i} label={i} onClick={() => { setInterest(i); setStep(1); }} />
                  ))}
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h2 className="mb-5 font-display text-2xl text-ink">{t("lead.room")}</h2>
                <div className="grid grid-cols-2 gap-3">
                  {ROOMS.map((r) => (
                    <Chip key={r.key} label={r[locale]} onClick={() => { setRoom(r.key); setStep(2); }} />
                  ))}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="mb-5 font-display text-2xl text-ink">{t("lead.contact")}</h2>
                <div className="mb-5 grid grid-cols-2 gap-3">
                  {(["phone", "telegram"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setContactMethod(m)}
                      className={`btn justify-center ${contactMethod === m ? "btn-solid" : "btn-ghost"}`}
                    >
                      {m === "phone" ? "Phone" : "Telegram"}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => setStep(3)} className="btn btn-solid w-full justify-center">
                  →
                </button>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="mb-5 font-display text-2xl text-ink">{t("lead.name")}</h2>
                <div className="space-y-5">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("lead.name")}
                    className="field"
                  />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={contactMethod === "phone" ? t("lead.phone") : "Telegram @username"}
                    className="field"
                  />
                  <button
                    type="button"
                    onClick={submit}
                    disabled={busy || !name.trim()}
                    className="btn btn-solid w-full justify-center disabled:opacity-60"
                  >
                    {busy ? "…" : t("lead.send")}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
