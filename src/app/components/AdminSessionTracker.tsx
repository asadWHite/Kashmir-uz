"use client";

import { useEffect } from "react";

/** Sends a lightweight heartbeat while an admin page is open and visible. */
export default function AdminSessionTracker() {
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

  return null;
}
