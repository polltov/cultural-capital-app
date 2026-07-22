import Link from "next/link";
import { db } from "@/src/db/client";
import { listAllTours } from "@/src/db/queries/tours";

export const dynamic = "force-dynamic";

export default async function ToursList() {
  const rows = await listAllTours(db());
  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl">Экскурсии</h1>
        <Link className="underline" href="/admin/tours/new">+ Новая</Link>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((t) => (
            <tr key={t.id} className="border-b">
              <td className="p-2">
                <Link className="underline" href={`/admin/tours/${t.id}/edit`}>{t.title}</Link>
                <div className="text-xs text-black/50">/{t.slug} · {t.published ? "опубликовано" : "черновик"}</div>
              </td>
              <td className="text-right">
                <Link className="underline" href={`/admin/tours/${t.id}/slots`}>слоты</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
