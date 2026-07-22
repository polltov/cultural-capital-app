"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/src/db/client";
import { cancelOrderAndReleaseSeats } from "@/src/db/queries/orders";
import { requireAdmin } from "@/src/auth/require-admin";

export async function cancelOrderAction(orderId: string, note: string | null) {
  await requireAdmin();
  await cancelOrderAndReleaseSeats(db(), orderId, note ?? undefined);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/admin/orders`);
}
