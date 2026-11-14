"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * First-party public visitor tracker.
 *
 * Mounted once in the root layout so it observes every public route
 * (homepage, collections, curtains, interiors, gallery, favorites, ...)
 * including client-side navigations and refreshes. It never runs on
 * /admin or /api routes, and the ingest endpoint additionally drops
 * requests carrying a valid admin session (defense in depth).
 *
 * Identity:
 *  - Visitor ID: random UUID in a first-party cookie (1 year). Refreshes
 *    and navigations reuse it, so a refresh is never a new visitor.
 *  - Session ID: random UUID in a first-party cookie (30 min sliding,
 *    refreshed on activity). A new session starts only after 30 minutes
 *    of inactivity.
 *
 * Privacy: no fingerprinting, no IP, no raw User-Agent and no PII are
 * collected. Only the page path, a query-stripped referrer and the site
 * language leave the browser; device/browser/OS are parsed server-side.
 *
 * Reliability: every send is fire-and-forget (fetch + keepalive) and
 * failures are swallowed, so tracking can never break or block the site.
 * Each event carries a UUID dedupe key; the server deduplicates, which
 * makes StrictMode double-effects, hydration replays and retries safe.
 */

const VISITOR_COOKIE = "kashmir-visitor-id";
const SESSION_COOKIE = "kashmir-session-id";
const VISITOR_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
const SESSION_MAX_AGE = 60 * 30; // 30 minutes, sliding
const HEARTBEAT_MS = 30_000;
const DEDUPE_WINDOW_MS = 1_000;
const TRACK_URL = "/api/analytics/track";

function uuid(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through */
  }
  // RFC 4122 v4 fallback for environments without crypto.randomUUID.
  const bytes = new Uint8Array(16);
  try {
    crypto.getRandomValues(bytes);
  } catch {
    for (let i = 0; i < 16; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function readCookie(name: string): string | null {
  try {
    const prefix = `${name}=`;
    const parts = document.cookie.split(";");
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.startsWith(prefix)) {
        const value = decodeURIComponent(trimmed.slice(prefix.length));
        return value || null;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  try {
    const secure =
      typeof window !== "undefined" && window.location.protocol === "https:"
        ? "; Secure"
        : "";
    document.cookie =
      `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secure}`;
  } catch {
    /* ignore */
  }
}

function isUuid(value: string | null): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

type TrackType =
  | "public_page_view"
  | "public_session_start"
  | "public_session_end"
  | "public_session_heartbeat";

interface TrackPayload {
  visitorId: string;
  sessionId: string;
  type: TrackType;
  path: string;
  referrer: string;
  language: string;
  dedupeKey: string;
}

function send(events: TrackPayload[]) {
  if (events.length === 0) return;
  try {
    void fetch(TRACK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events }),
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => {
      /* Tracking must never surface errors to visitors. */
    });
  } catch {
    /* ignore */
  }
}

export default function PublicTracker() {
  const pathname = usePathname();
  const stateRef = useRef<{
    visitorId: string;
    sessionId: string;
    lastPath: string | null;
    lastSentAt: number;
    started: boolean;
  } | null>(null);

  // Initialize identity once (per mount). The root layout never remounts
  // during client-side navigation, so this runs a single time per load.
  useEffect(() => {
    if (stateRef.current) return;

    const existingVisitor = readCookie(VISITOR_COOKIE);
    const visitorId = isUuid(existingVisitor) ? existingVisitor : uuid();
    if (visitorId !== existingVisitor) {
      writeCookie(VISITOR_COOKIE, visitorId, VISITOR_MAX_AGE);
    }

    const existingSession = readCookie(SESSION_COOKIE);
    const isNewSession = !isUuid(existingSession);
    const sessionId = isNewSession ? uuid() : (existingSession as string);
    writeCookie(SESSION_COOKIE, sessionId, SESSION_MAX_AGE);

    stateRef.current = {
      visitorId,
      sessionId,
      lastPath: null,
      lastSentAt: 0,
      started: !isNewSession,
    };
  }, []);

  // Page views: initial load + every client-side navigation.
  useEffect(() => {
    if (!pathname) return;
    if (pathname === "/admin" || pathname.startsWith("/admin/")) return;
    if (pathname.startsWith("/api/")) return;

    const state = stateRef.current;
    if (!state) return;

    const now = Date.now();
    // Dedupe: StrictMode double-effects, hydration replays and rapid
    // route transitions for the same path never double-count.
    if (state.lastPath === pathname && now - state.lastSentAt < DEDUPE_WINDOW_MS) {
      return;
    }
    state.lastPath = pathname;
    state.lastSentAt = now;

    // Sliding session expiry: any activity extends the session window.
    writeCookie(SESSION_COOKIE, state.sessionId, SESSION_MAX_AGE);

    const base = {
      visitorId: state.visitorId,
      sessionId: state.sessionId,
      path: pathname,
      referrer: typeof document !== "undefined" ? document.referrer || "" : "",
      language:
        typeof document !== "undefined"
          ? document.documentElement.lang || ""
          : "",
    };

    const events: TrackPayload[] = [];
    if (!state.started) {
      state.started = true;
      events.push({
        ...base,
        type: "public_session_start",
        dedupeKey: uuid(),
      });
    }
    events.push({ ...base, type: "public_page_view", dedupeKey: uuid() });
    send(events);
  }, [pathname]);

  // Heartbeat (active-visitor signal) + session end on unload.
  useEffect(() => {
    const state = stateRef.current;
    if (!state) return;

    const heartbeat = () => {
      if (document.visibilityState !== "visible") return;
      const current = stateRef.current;
      if (!current) return;
      writeCookie(SESSION_COOKIE, current.sessionId, SESSION_MAX_AGE);
      send([
        {
          visitorId: current.visitorId,
          sessionId: current.sessionId,
          type: "public_session_heartbeat",
          path: window.location.pathname,
          referrer: "",
          language: document.documentElement.lang || "",
          dedupeKey: uuid(),
        },
      ]);
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") heartbeat();
    };

    const onPageHide = () => {
      const current = stateRef.current;
      if (!current) return;
      send([
        {
          visitorId: current.visitorId,
          sessionId: current.sessionId,
          type: "public_session_end",
          path: window.location.pathname,
          referrer: "",
          language: document.documentElement.lang || "",
          dedupeKey: uuid(),
        },
      ]);
    };

    heartbeat();
    const timer = window.setInterval(heartbeat, HEARTBEAT_MS);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  return null;
}
