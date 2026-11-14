"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Admin session presence + admin page-view tracking.
 *
 *  - Heartbeat: updates `admin_sessions.last_seen_at` while an admin page
 *    is open and visible (existing behavior, unchanged).
 *  - Page views: records an `admin_page_view` event (actor_type='admin')
 *    on every dashboard navigation. These events live in the same
 *    analytics_events table as public events but are strictly separated
 *    by actor_type, so dashboard navigation can never inflate public
 *    visitor statistics.
 *
 * This component is mounted only inside the protected admin layout, so it
 * runs exclusively for authenticated administrators.
 */
export default function AdminSessionTracker() {
  const pathname = usePathname();
  const lastSentRef = useRef<{ path: string | null; at: number }>({
    path: null,
    at: 0,
  });

  // Heartbeat (existing behavior).
  useEffect(() => {
    let stopped = false;

    const heartbeat = () => {
      if (stopped || document.visibilityState !== "visible") return;
      void fetch("/api/admin/activity/heartbeat", {
        method: "POST",
        cache: "no-store",
      }).catch(() => {
        // A missed heartbeat should not interrupt admin work.
      });
    };

    heartbeat();
    const timer = window.setInterval(heartbeat, 60_000);
    document.addEventListener("visibilitychange", heartbeat);

    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", heartbeat);
    };
  }, []);

  // Admin page views (new; separate from public tracking).
  useEffect(() => {
    if (!pathname) return;
    const now = Date.now();
    const last = lastSentRef.current;
    // Dedupe StrictMode double-effects / hydration replays.
    if (last.path === pathname && now - last.at < 1_000) return;
    lastSentRef.current = { path: pathname, at: now };

    void fetch("/api/admin/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      cache: "no-store",
      keepalive: true,
    }).catch(() => {
      // Admin analytics must never interrupt admin work.
    });
  }, [pathname]);

  return null;
}
