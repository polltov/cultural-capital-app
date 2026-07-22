import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireAdmin } from "@/src/auth/require-admin";
import { env } from "@/src/lib/env";

export const runtime = "nodejs";

export async function POST(req: Request) {
  await requireAdmin();
  const url = new URL(req.url);
  const filename = url.searchParams.get("filename");
  if (!filename || !req.body) {
    return NextResponse.json({ error: "filename + body required" }, { status: 400 });
  }
  const safe = filename.replace(/[^\w.\-]/g, "_");
  const blob = await put(`tours/${Date.now()}-${safe}`, req.body, {
    access: "public",
    token: env.blobToken(),
  });
  return NextResponse.json({ url: blob.url });
}
