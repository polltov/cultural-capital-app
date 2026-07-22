import Link from "next/link";
import { adminLogoutAction } from "@/src/actions/admin-logout";

export function Sidebar({ email }: { email: string }) {
  return (
    <aside className="w-56 border-r p-4 min-h-screen bg-white">
      <div className="mb-6 text-sm text-black/60">{email}</div>
      <nav className="space-y-2">
        <Link className="block" href="/admin">Обзор</Link>
        <Link className="block" href="/admin/orders">Заявки</Link>
        <Link className="block" href="/admin/tours">Экскурсии</Link>
      </nav>
      <form action={adminLogoutAction} className="mt-8">
        <button className="text-sm underline">Выйти</button>
      </form>
    </aside>
  );
}
