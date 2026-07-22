import { notFound } from "next/navigation";
import { db } from "@/src/db/client";
import { getOrderWithItems } from "@/src/db/queries/orders";
import { formatRub } from "@/src/lib/money";
import { confirmOrderAction } from "@/src/actions/admin-order-confirm";
import { cancelOrderAction } from "@/src/actions/admin-order-cancel";

export const dynamic = "force-dynamic";

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getOrderWithItems(db(), id);
  if (!data) notFound();
  const { order, items } = data;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl mb-2">Заявка №{order.orderNumber}</h1>
      <div className="text-sm text-black/60">Статус: {order.status}</div>
      <div className="mt-4">
        <div>{order.customerName}</div>
        <div>{order.customerPhone}</div>
        <div>{order.customerEmail}</div>
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((i) => (
          <li key={i.id} className="border p-3 rounded">
            <div className="font-medium">{i.tourTitle}</div>
            <div className="text-sm">{new Date(i.startsAt).toLocaleString("ru-RU")}</div>
            <div className="text-sm">Взрослых: {i.adultCount} × {formatRub(i.priceAdultSnapshot)} · Детей: {i.childCount} × {formatRub(i.priceChildSnapshot)}</div>
          </li>
        ))}
      </ul>
      <div className="mt-4 text-right text-xl">Итого: {formatRub(order.totalAmount)}</div>

      {order.status === "pending" && (
        <div className="mt-6 space-y-3">
          <form action={async (fd) => { "use server"; await confirmOrderAction(order.id, String(fd.get("note") ?? "") || null); }}>
            <label className="block text-sm">Заметка (опционально)
              <input name="note" className="mt-1 w-full border p-2 rounded" defaultValue={order.adminNote ?? ""} />
            </label>
            <button className="mt-2 bg-green-700 text-white px-3 py-2 rounded">Подтвердить</button>
          </form>
          <form action={async (fd) => { "use server"; await cancelOrderAction(order.id, String(fd.get("cancelNote") ?? "") || null); }}>
            <label className="block text-sm">Причина отмены
              <input name="cancelNote" className="mt-1 w-full border p-2 rounded" />
            </label>
            <button className="mt-2 bg-red-700 text-white px-3 py-2 rounded">Отменить</button>
          </form>
        </div>
      )}
    </div>
  );
}
