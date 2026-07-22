import { CartClient } from "@/src/components/public/CartClient";
import { PublicShell } from "@/src/components/public/PublicShell";

export const dynamic = "force-dynamic";

export default function CartPage() {
  return (
    <PublicShell>
      <section className="relative z-10 px-10 pt-10 pb-4 max-md:px-6">
        <div
          className="text-[12px] tracking-[0.3em] uppercase text-terracotta font-bold mb-3"
          style={{ fontFamily: "var(--font-sans-ui)" }}
        >
          Оформление заявки
        </div>
        <h1
          className="text-[36px] md:text-[42px] leading-none text-ink"
          style={{ fontFamily: "var(--font-antiqua)" }}
        >
          Ваша{" "}
          <em
            className="italic text-terracotta"
            style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
          >
            корзина
          </em>
        </h1>
        <p
          className="mt-4 text-[15px] leading-[1.6] max-w-[480px]"
          style={{ color: "var(--cc-slate)" }}
        >
          Проверьте состав билетов и оставьте контакты — мы свяжемся, чтобы
          согласовать детали и прислать ссылку на оплату.
        </p>
      </section>
      <section className="relative z-10 px-10 pb-20 pt-6 max-md:px-6">
        <CartClient />
      </section>
    </PublicShell>
  );
}
