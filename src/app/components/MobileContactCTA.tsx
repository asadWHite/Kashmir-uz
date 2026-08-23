"use client";

import { usePathname } from "next/navigation";
import { useT } from "./I18nProvider";

/** Sticky mobile-only contact CTA for conversion. Hidden on admin pages. */
export default function MobileContactCTA() {
  const { t } = useT();
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <a
      href="/#contact"
      className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-center bg-ink py-3.5 text-center text-[0.72rem] uppercase tracking-[0.22em] text-base transition-opacity hover:opacity-90 md:hidden"
    >
      {t("detail.contact")} · KASHMIR
    </a>
  );
}
