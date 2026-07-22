"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/src/db/client";
import { findAdminByEmail } from "@/src/db/queries/admins";
import { verifyPassword } from "@/src/auth/password";
import { issueSession, SESSION_COOKIE, SESSION_TTL_DAYS } from "@/src/auth/session";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function adminLoginAction(_prev: string | null, formData: FormData): Promise<string | null> {
  const parsed = schema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) return "Проверьте поля";
  const admin = await findAdminByEmail(db(), parsed.data.email);
  if (!admin) return "Неверный email или пароль";
  const ok = await verifyPassword(parsed.data.password, admin.passwordHash);
  if (!ok) return "Неверный email или пароль";
  const { token, expiresAt } = await issueSession(admin.id);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    maxAge: SESSION_TTL_DAYS * 86400,
  });
  redirect("/admin");
}
