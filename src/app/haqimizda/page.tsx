import type { Metadata } from "next";
import LandingPage, { buildMetadata } from "@/app/_landing/LandingPage";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return buildMetadata("about");
}

export default function Page() {
  return <LandingPage slug="about" />;
}
