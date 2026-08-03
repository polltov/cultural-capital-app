"use client";
import { useActionState } from "react";
import { adminLoginAction } from "@/src/actions/admin-login";

export default function LoginPage() {
  const [err, action, pending] = useActionState(adminLoginAction, null);
  return (
    <div className="min-h-screen bg-ivory relative overflow-hidden flex items-center justify-center px-6">
      <span className="cc-blob b1" aria-hidden />
      <span className="cc-blob b2" aria-hidden />
      <span className="cc-blob b3" aria-hidden />

      <main className="relative z-10 w-full max-w-[420px]">
        <div
          className="text-[11px] tracking-[0.28em] uppercase text-terracotta font-bold mb-2.5 text-center"
          style={{ fontFamily: "var(--font-sans-ui)" }}
        >
          Служебный вход
        </div>
        <h1
          className="text-[32px] md:text-[38px] leading-[1.05] text-ink text-center mb-6"
          style={{ fontFamily: "var(--font-antiqua)" }}
        >
          Вход{" "}
          <em
            className="italic text-terracotta"
            style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
          >
            в кассу
          </em>
        </h1>

        <form
          action={action}
          className="bg-paper rounded-lg px-6 py-6 grid gap-4"
          style={{ border: "1px solid rgba(194,154,91,0.4)" }}
        >
          <label className="block">
            <span
              className="text-[11px] uppercase tracking-[0.14em] font-bold"
              style={{ color: "var(--cc-slate)", fontFamily: "var(--font-sans-ui)" }}
            >
              Email
            </span>
            <input
              name="email"
              type="email"
              required
              className="mt-1.5 w-full px-3 py-2.5 rounded-sm bg-ivory text-ink outline-none focus:border-terracotta transition-colors"
              style={{
                border: "1px solid rgba(34,41,58,0.25)",
                fontFamily: "var(--font-serif-body)",
              }}
            />
          </label>
          <label className="block">
            <span
              className="text-[11px] uppercase tracking-[0.14em] font-bold"
              style={{ color: "var(--cc-slate)", fontFamily: "var(--font-sans-ui)" }}
            >
              Пароль
            </span>
            <input
              name="password"
              type="password"
              required
              className="mt-1.5 w-full px-3 py-2.5 rounded-sm bg-ivory text-ink outline-none focus:border-terracotta transition-colors"
              style={{
                border: "1px solid rgba(34,41,58,0.25)",
                fontFamily: "var(--font-serif-body)",
              }}
            />
          </label>
          {err && (
            <div
              className="text-[13px] rounded-sm px-3 py-2"
              style={{
                background: "rgba(163,74,47,0.1)",
                color: "var(--cc-terracotta)",
                fontFamily: "var(--font-sans-ui)",
              }}
            >
              {err}
            </div>
          )}
          <button
            disabled={pending}
            className="mt-2 bg-ink text-paper px-6 py-3.5 rounded-sm text-[13px] font-bold tracking-[0.06em] hover:bg-[#0e1319] disabled:opacity-60"
            style={{ fontFamily: "var(--font-sans-ui)" }}
          >
            {pending ? "Проверяем…" : "Войти →"}
          </button>
        </form>
      </main>
    </div>
  );
}
