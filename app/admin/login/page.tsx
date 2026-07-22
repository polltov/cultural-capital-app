"use client";
import { useActionState } from "react";
import { adminLoginAction } from "@/src/actions/admin-login";

export default function LoginPage() {
  const [err, action, pending] = useActionState(adminLoginAction, null);
  return (
    <main className="max-w-sm mx-auto p-8">
      <h1 className="text-2xl mb-4">Вход в админку</h1>
      <form action={action} className="space-y-3">
        <input
          name="email"
          type="email"
          required
          placeholder="email"
          className="w-full border p-2 rounded"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="пароль"
          className="w-full border p-2 rounded"
        />
        {err && <div className="text-red-700 text-sm">{err}</div>}
        <button disabled={pending} className="w-full bg-black text-white p-2 rounded">
          {pending ? "…" : "Войти"}
        </button>
      </form>
    </main>
  );
}
