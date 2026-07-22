import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readSession, SESSION_COOKIE } from "@/src/auth/session";

export async function requireAdmin() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const admin = await readSession(token);
  if (!admin) redirect("/admin/login");
  return admin;
}
