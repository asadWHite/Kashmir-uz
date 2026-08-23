"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BRAND } from "@/lib/constants";
import { useT } from "@/app/components/I18nProvider";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { ta } = useT();
  const redirect = params.get("redirect") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        router.push(redirect);
        router.refresh();
      } else {
        setError(data.error || "Invalid credentials.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-6 py-12">
      <section className="w-full max-w-md border border-line bg-surface p-8 md:p-10">
        <p className="font-display text-2xl tracking-[0.28em] text-ink">
          {BRAND.name}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <p className="eyebrow">{ta("a.title")}</p>
          <LanguageSwitcher />
        </div>

        <h1 className="mt-9 font-display text-2xl text-ink">{ta("a.loginTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{ta("a.loginSub")}</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-6" noValidate>
          <div>
            <label htmlFor="email" className="eyebrow">{ta("a.email")}</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field"
              placeholder="you@kashmirdecor.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="eyebrow">{ta("a.password")}</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-red-500/90">{error}</p>}

          <button type="submit" disabled={busy} className="btn btn-solid w-full justify-center">
            {busy ? ta("a.signing") : ta("a.signin")}
          </button>
        </form>
      </section>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center">
          <p className="text-sm text-muted">Loading…</p>
        </main>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
