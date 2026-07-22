import { db } from "@/src/db/client";
import { listRecentOrders } from "@/src/db/queries/orders";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const orders = await listRecentOrders(db(), 5);
  const pending = orders.filter((o) => o.status === "pending").length;
  return (
    <div>
      <h1 className="text-2xl mb-4">Обзор</h1>
      <p>Новых заявок: {pending}</p>
    </div>
  );
}
