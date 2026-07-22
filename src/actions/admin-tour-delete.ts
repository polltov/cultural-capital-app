"use server";
import { redirect } from "next/navigation";
import { db } from "@/src/db/client";
import { deleteTour } from "@/src/db/queries/tours";
import { requireAdmin } from "@/src/auth/require-admin";

export async function deleteTourAction(id: string) {
  await requireAdmin();
  await deleteTour(db(), id);
  redirect("/admin/tours");
}
