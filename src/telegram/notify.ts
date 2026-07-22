import { env } from "@/src/lib/env";

export async function notifyAdmin(text: string): Promise<void> {
  const { token, adminId } = env.telegram();
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: Number(adminId), text, disable_web_page_preview: true }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(`telegram: ${JSON.stringify(j)}`);
  }
}
