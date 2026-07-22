"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/src/db/client";
import { cancelSlot } from "@/src/db/queries/slots";
import { requireAdmin } from "@/src/auth/require-admin";

export async function cancelSlotAction(id: string, tourId: string) {
  await requireAdmin();
  await cancelSlot(db(), id);
  revalidatePath(`/admin/tours/${tourId}/slots`);
}
