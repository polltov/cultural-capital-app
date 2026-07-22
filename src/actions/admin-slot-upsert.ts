"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/src/db/client";
import { upsertSlot } from "@/src/db/queries/slots";
import { requireAdmin } from "@/src/auth/require-admin";

const schema = z.object({
  id: z.string().uuid().optional(),
  tourId: z.string().uuid(),
  startsAt: z.string().min(10),
  seatsTotal: z.coerce.number().int().min(1).max(200),
});

export async function upsertSlotAction(_prev: string | null, fd: FormData): Promise<string | null> {
  await requireAdmin();
  const parsed = schema.safeParse({
    id: fd.get("id") || undefined,
    tourId: fd.get("tourId"),
    startsAt: fd.get("startsAt"),
    seatsTotal: fd.get("seatsTotal"),
  });
  if (!parsed.success) return parsed.error.issues.map((i) => i.message).join("; ");
  try {
    await upsertSlot(db(), {
      id: parsed.data.id,
      tourId: parsed.data.tourId,
      startsAt: new Date(parsed.data.startsAt),
      seatsTotal: parsed.data.seatsTotal,
    });
    revalidatePath(`/admin/tours/${parsed.data.tourId}/slots`);
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : "unknown error";
  }
}
