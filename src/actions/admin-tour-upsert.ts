"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/src/db/client";
import { upsertTour } from "@/src/db/queries/tours";
import { requireAdmin } from "@/src/auth/require-admin";

const schema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/, "только a-z, 0-9, -"),
  title: z.string().min(1).max(200),
  tag: z.string().max(80).default(""),
  route: z.string().max(200).default(""),
  durationMin: z.coerce.number().int().min(0).max(1440).default(0),
  meta: z.string().max(200).default(""),
  descriptionMd: z.string().max(4000).default(""),
  priceAdultRub: z.coerce.number().int().min(0).max(1_000_000),
  priceChildRub: z.coerce.number().int().min(0).max(1_000_000),
  photoUrl: z.string().url().nullable().optional(),
  published: z.coerce.boolean(),
});

export async function upsertTourAction(_prev: string | null, fd: FormData): Promise<string | null> {
  await requireAdmin();
  const parsed = schema.safeParse({
    id: fd.get("id") || undefined,
    slug: fd.get("slug"),
    title: fd.get("title"),
    tag: fd.get("tag") ?? "",
    route: fd.get("route") ?? "",
    durationMin: fd.get("durationMin") ?? 0,
    meta: fd.get("meta") ?? "",
    descriptionMd: fd.get("descriptionMd") ?? "",
    priceAdultRub: fd.get("priceAdultRub") ?? 0,
    priceChildRub: fd.get("priceChildRub") ?? 0,
    photoUrl: fd.get("photoUrl") || null,
    published: fd.get("published") === "on",
  });
  if (!parsed.success) return parsed.error.issues.map((i) => i.message).join("; ");
  const { priceAdultRub, priceChildRub, ...rest } = parsed.data;
  const saved = await upsertTour(db(), {
    ...rest,
    photoUrl: rest.photoUrl ?? null,
    priceAdult: priceAdultRub * 100,
    priceChild: priceChildRub * 100,
  });
  revalidatePath("/admin/tours");
  revalidatePath("/");
  revalidatePath(`/tours/${saved.slug}`);
  redirect(`/admin/tours/${saved.id}/edit`);
}
