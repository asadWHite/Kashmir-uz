import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminNav from "@/app/admin/_components/AdminNav";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-base md:flex">
      <AdminNav />
      <div className="flex-1 md:ml-64">
        <div className="mx-auto max-w-5xl px-5 py-8 md:px-10 md:py-12">{children}</div>
      </div>
    </div>
  );
}
