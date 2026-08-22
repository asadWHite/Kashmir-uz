"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BRAND } from "@/lib/constants";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
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
        <p className="eyebrow mt-2">Studio Admin</p>

        <h1 className="mt-9 font-display text-2xl text-ink">Sign in</h1>
        <p className="mt-2 text-sm text-muted">
          Restricted area. Authorized studio members only.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-6" noValidate>
          <div>
            <label htmlFor="email" className="eyebrow">Email</label>
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
            <label htmlFor="password" className="eyebrow">Password</label>
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
            {busy ? "Signing in…" : "Sign in"}
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
