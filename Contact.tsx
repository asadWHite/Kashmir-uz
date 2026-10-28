"use client";

import { useState } from "react";
import Reveal from "./Reveal";
import { useT } from "./I18nProvider";
import type { SettingsView } from "@/lib/types";

type Status = "idle" | "submitting" | "success" | "error";

export default function Contact({ settings }: { settings: SettingsView }) {
  const { t } = useT();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [leadOpen, setLeadOpen] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") || ""),
      phone: String(form.get("phone") || ""),
      email: String(form.get("email") || ""),
      message: String(form.get("message") || ""),
    };

    let lastError = t("form.error");
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          setStatus("success");
          e.currentTarget.reset();
          return;
        }
        lastError = data.error || t("form.error");
        break;
      } catch {
        lastError = t("form.error");
        if (attempt < 2) await new Promise((r) => setTimeout(r, 1200));
      }
    }
    setStatus("error");
    setErrorMsg(lastError);
  }

  return (
    <section id="contact" className="container-edge py-24 pb-40 md:py-32 md:pb-32">
      <div className="grid grid-cols-1 gap-14 md:grid-cols-2 md:gap-24">
        <div>
          <Reveal>
            <p className="eyebrow mb-5">{t("contact.eyebrow")}</p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="font-display text-[clamp(2rem,4.5vw,3.2rem)] leading-[1.08] text-ink">
              {t("contact.title")}
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
              {t("contact.text")}
            </p>
          </Reveal>

          <Reveal delay={180}>
            <div className="mt-7">
              <button
                type="button"
                onClick={() => setLeadOpen(true)}
                className="btn btn-ghost"
              >
                ✦ {t("lead.start")}
              </button>
            </div>
          </Reveal>

          <Reveal delay={210}>
            <div className="mt-10 space-y-4">
              <p className="eyebrow">{t("contact.with")}</p>
              <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 text-ink transition-colors hover:text-accent">
                <span className="grid h-9 w-9 place-items-center rounded-full border border-line">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                  </svg>
                </span>
                Instagram · {settings.instagramHandle}
              </a>
              <a href={settings.telegramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 text-ink transition-colors hover:text-accent">
                <span className="grid h-9 w-9 place-items-center rounded-full border border-line">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="m21 4-3 16-6-4-3 3v-5l11-8L6 12l-3-1" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                  </svg>
                </span>
                Telegram
              </a>
              <a href={settings.phoneHref} className="flex items-center gap-4 text-ink transition-colors hover:text-accent">
                <span className="grid h-9 w-9 place-items-center rounded-full border border-line">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 4h3l2 5-2 1c1 3 3 5 6 6l1-2 5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                  </svg>
                </span>
                {settings.phone}
              </a>
            </div>
          </Reveal>
        </div>

        <Reveal delay={120}>
          {status === "success" ? (
            <div className="flex min-h-[18rem] flex-col items-start justify-center border border-line bg-surface p-10">
              <p className="eyebrow text-accent">{t("form.successTitle").split(".")[0]}</p>
              <p className="mt-4 font-display text-2xl text-ink">{t("form.successTitle")}</p>
              <p className="mt-3 text-muted">{t("form.successText")}</p>
              <button type="button" onClick={() => setStatus("idle")} className="btn btn-ghost mt-8">
                {t("form.another")}
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-7" noValidate>
              <div>
                <label htmlFor="name" className="eyebrow">{t("form.name")} *</label>
                <input id="name" name="name" required className="field" placeholder={t("form.namePh")} />
              </div>
              <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
                <div>
                  <label htmlFor="phone" className="eyebrow">{t("form.phone")}</label>
                  <input id="phone" name="phone" type="tel" className="field" placeholder={t("form.phonePh")} />
                </div>
                <div>
                  <label htmlFor="email" className="eyebrow">{t("form.email")}</label>
                  <input id="email" name="email" type="email" className="field" placeholder={t("form.emailPh")} />
                </div>
              </div>
              <div>
                <label htmlFor="message" className="eyebrow">{t("form.message")} *</label>
                <textarea id="message" name="message" required rows={4} className="field resize-none" placeholder={t("form.messagePh")} />
              </div>

              {status === "error" && (
                <p className="text-sm text-red-500/90">{errorMsg || t("form.error")}</p>
              )}

              <button type="submit" disabled={status === "submitting"} className="btn btn-solid disabled:opacity-60">
                {status === "submitting" ? t("form.sending") : t("form.send")}
              </button>
            </form>
          )}
        </Reveal>
      </div>
      <LeadFlow open={leadOpen} onClose={() => setLeadOpen(false)} />
    </section>
  );
}



type Step = 0 | 1 | 2 | 3 | 4;

const INTERESTS = ["Classic", "Modern", "Minimal", "Luxury"];
const ROOMS = [
  { key: "living", en: "Living Room", ru: "Гостиная", uz: "Mehmonxona" },
  { key: "bedroom", en: "Bedroom", ru: "Спальня", uz: "Yotoqxona" },
  { key: "office", en: "Office", ru: "Кабинет", uz: "Kabineti" },
  { key: "other", en: "Other", ru: "Другое", uz: "Boshqa" },
];

/** Minimal multi-step lead capture. Saves a real DB row via /api/leads. */
function LeadFlow({ open, onClose }: { open: boolean; onClose: () => void }) {
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
    const body = JSON.stringify({
      name,
      phone: contactMethod === "phone" ? phone : null,
      telegram: contactMethod === "telegram" ? phone : null,
      interest,
      room: ROOMS.find((r) => r.key === room)?.[locale] ?? room,
      source: "lead_flow",
    });
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        if (res.ok) { setDone(true); break; }
        if (attempt < 2) { await new Promise((r) => setTimeout(r, 1200)); continue; }
        setDone(true);
      } catch {
        if (attempt < 2) { await new Promise((r) => setTimeout(r, 1200)); continue; }
        setDone(true);
      }
    }
    setBusy(false);
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
