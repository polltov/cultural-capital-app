import { requireAdmin } from "@/src/auth/require-admin";
import { Sidebar } from "@/src/components/admin/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="flex min-h-screen">
      <Sidebar email={admin.email} />
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
