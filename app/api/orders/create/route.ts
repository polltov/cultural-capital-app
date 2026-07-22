import { NextResponse } from "next/server";
import { db } from "@/src/db/client";
import { orderSubmissionSchema } from "@/src/lib/validation";
import { createOrderAtomic } from "@/src/db/queries/orders";
import { notifyAdmin } from "@/src/telegram/notify";
import { env } from "@/src/lib/env";

export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  const parsed = orderSubmissionSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, code: "BAD_INPUT", message: "Проверьте поля" }, { status: 400 });
  }
  const res = await createOrderAtomic(db(), {
    customer: { name: parsed.data.name, phone: parsed.data.phone, email: parsed.data.email },
    items: parsed.data.items,
  });
  if (!res.ok) {
    const status = res.code === "SEATS_TAKEN" ? 409 : 400;
    return NextResponse.json(res, { status });
  }
  try {
    const base = env.publicBaseUrl();
    await notifyAdmin(`Новая заявка №${res.data.orderNumber}\n${base}/admin/orders/${res.data.orderId}`);
  } catch (e) {
    console.error("tg notify failed", e);
  }
  return NextResponse.json({ ok: true, data: { orderId: res.data.orderId } }, { status: 201 });
}
