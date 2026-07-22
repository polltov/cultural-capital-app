import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/src/db/client";
import { getOrderWithItems } from "@/src/db/queries/orders";
import { formatRub } from "@/src/lib/money";
import { PublicShell } from "@/src/components/public/PublicShell";

export const dynamic = "force-dynamic";

export default async function SuccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getOrderWithItems(db(), id);
  if (!data) notFound();
  const { order, items } = data;
  return (
    <PublicShell>
      <section className="relative z-10 px-10 pt-14 pb-6 text-center max-md:px-6">
        <div
          className="text-[12px] tracking-[0.3em] uppercase text-terracotta font-bold mb-4"
          style={{ fontFamily: "var(--font-sans-ui)" }}
        >
          Заявка принята
        </div>
        <h1
          className="text-[36px] md:text-[48px] leading-[1] text-ink"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
        >
          Спасибо, вы{" "}
          <em className="italic text-terracotta">на борту</em>
        </h1>
        <p
          className="mt-5 text-[15px] leading-[1.6] max-w-[520px] mx-auto"
          style={{ color: "var(--cc-slate)" }}
        >
          Заявка{" "}
          <b className="text-ink">№{order.orderNumber}</b> сохранена. Мы
          свяжемся по телефону{" "}
          <b className="text-ink">{order.customerPhone}</b> или по e-mail{" "}
          <b className="text-ink">{order.customerEmail}</b> в ближайшие часы —
          согласуем детали и вышлем ссылку на оплату.
        </p>
      </section>

      <section className="relative z-10 px-10 pb-6 max-md:px-6">
        <div
          className="mx-auto max-w-[720px] bg-paper rounded-lg px-6 py-6"
          style={{ border: "1px solid rgba(194,154,91,0.4)" }}
        >
          <div
            className="text-[11px] tracking-[0.28em] uppercase text-terracotta font-bold mb-4"
            style={{ fontFamily: "var(--font-sans-ui)" }}
          >
            В корзине
          </div>
          <ul className="grid gap-3">
            {items.map((i) => (
              <li
                key={i.id}
                className="flex flex-col md:flex-row md:justify-between md:items-baseline gap-1.5 py-3"
                style={{ borderTop: "1px dashed rgba(34,41,58,0.15)" }}
              >
                <div>
                  <div
                    className="text-[17px] text-ink leading-[1.2]"
                    style={{ fontFamily: "var(--font-antiqua)" }}
                  >
                    {i.tourTitle}
                  </div>
                  <div
                    className="text-[11px] uppercase tracking-[0.14em] font-bold mt-1"
                    style={{
                      color: "var(--cc-slate)",
                      fontFamily: "var(--font-sans-ui)",
                    }}
                  >
                    {new Date(i.startsAt).toLocaleString("ru-RU")}
                  </div>
                </div>
                <div
                  className="text-[12px]"
                  style={{
                    color: "var(--cc-slate)",
                    fontFamily: "var(--font-sans-ui)",
                  }}
                >
                  Взрослых: <b className="text-ink">{i.adultCount}</b> · Детей:{" "}
                  <b className="text-ink">{i.childCount}</b>
                </div>
              </li>
            ))}
          </ul>
          <div
            className="mt-5 pt-4 flex justify-between items-baseline"
            style={{ borderTop: "1px solid rgba(194,154,91,0.5)" }}
          >
            <span
              className="text-[11px] uppercase tracking-[0.14em] font-bold"
              style={{
                color: "var(--cc-slate)",
                fontFamily: "var(--font-sans-ui)",
              }}
            >
              Итого
            </span>
            <span
              className="text-[26px] text-ink"
              style={{ fontFamily: "var(--font-antiqua)" }}
            >
              {formatRub(order.totalAmount)}
            </span>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-10 pb-16 text-center max-md:px-6">
        <Link
          href="/"
          className="inline-block bg-ink text-paper py-3.5 px-7 text-[13px] font-bold tracking-[0.06em] rounded-sm"
          style={{ fontFamily: "var(--font-sans-ui)" }}
        >
          ← Вернуться в каталог
        </Link>
      </section>
    </PublicShell>
  );
}
