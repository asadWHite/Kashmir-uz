import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KASHMIR · Admin",
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}
