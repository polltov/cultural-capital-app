import { notFound } from "next/navigation";
import { db } from "@/src/db/client";
import { getOrderWithItems } from "@/src/db/queries/orders";
import { formatRub } from "@/src/lib/money";

export const dynamic = "force-dynamic";

export default async function SuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getOrderWithItems(db(), id);
  if (!data) notFound();
  const { order, items } = data;
  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-serif">Заявка №{order.orderNumber} принята</h1>
      <p className="mt-2">Мы свяжемся с вами по телефону {order.customerPhone} или email {order.customerEmail}.</p>
      <ul className="mt-4 space-y-2">
        {items.map((i) => (
          <li key={i.id} className="border p-3 rounded">
            <div className="font-medium">{i.tourTitle}</div>
            <div className="text-sm">{new Date(i.startsAt).toLocaleString("ru-RU")}</div>
            <div className="text-sm">Взрослых: {i.adultCount} · Детей: {i.childCount}</div>
          </li>
        ))}
      </ul>
      <div className="mt-4 text-right text-xl">Итого: {formatRub(order.totalAmount)}</div>
    </main>
  );
}
