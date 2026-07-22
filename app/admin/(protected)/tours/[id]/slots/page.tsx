import { notFound } from "next/navigation";
import { db } from "@/src/db/client";
import { getTourById } from "@/src/db/queries/tours";
import { listSlotsForTour } from "@/src/db/queries/slots";
import { upsertSlotAction } from "@/src/actions/admin-slot-upsert";
import { cancelSlotAction } from "@/src/actions/admin-slot-cancel";

export const dynamic = "force-dynamic";

export default async function SlotsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTourById(db(), id);
  if (!t) notFound();
  const slots = await listSlotsForTour(db(), id);

  return (
    <div>
      <h1 className="text-2xl mb-4">Слоты — {t.title}</h1>
      <form action={async (fd) => { "use server"; await upsertSlotAction(null, fd); }} className="flex gap-2 mb-6 items-end">
        <input type="hidden" name="tourId" value={t.id} />
        <label className="block">Дата и время
          <input required type="datetime-local" name="startsAt" className="border p-2 rounded" />
        </label>
        <label className="block">Мест
          <input required type="number" name="seatsTotal" min="1" max="200" className="border p-2 rounded w-24" />
        </label>
        <button className="bg-black text-white px-3 py-2 rounded">Добавить слот</button>
      </form>

      <table className="w-full text-sm">
        <thead className="text-left border-b"><tr>
          <th className="p-2">Дата</th><th>Мест</th><th>Занято</th><th>Статус</th><th></th>
        </tr></thead>
        <tbody>
          {slots.map((s) => (
            <tr key={s.id} className="border-b">
              <td className="p-2">{new Date(s.startsAt).toLocaleString("ru-RU")}</td>
              <td>{s.seatsTotal}</td>
              <td>{s.seatsBooked}</td>
              <td>{s.status}</td>
              <td className="text-right">
                {s.status === "active" && (
                  <form action={async () => { "use server"; await cancelSlotAction(s.id, t.id); }}>
                    <button className="text-red-700 underline text-xs">отменить</button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
