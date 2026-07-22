import Link from "next/link";
import { db } from "@/src/db/client";
import { listRecentOrders } from "@/src/db/queries/orders";
import { formatRub } from "@/src/lib/money";

export const dynamic = "force-dynamic";

export default async function OrdersList() {
  const rows = await listRecentOrders(db());
  return (
    <div>
      <h1 className="text-2xl mb-4">Заявки</h1>
      <table className="w-full text-sm">
        <thead className="text-left border-b"><tr>
          <th className="p-2">№</th><th>Дата</th><th>Клиент</th><th>Статус</th><th className="text-right">Сумма</th>
        </tr></thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.id} className="border-b hover:bg-black/5">
              <td className="p-2"><Link className="underline" href={`/admin/orders/${o.id}`}>{o.orderNumber}</Link></td>
              <td>{new Date(o.createdAt).toLocaleString("ru-RU")}</td>
              <td>{o.customerName}</td>
              <td>{o.status}</td>
              <td className="text-right">{formatRub(o.totalAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
