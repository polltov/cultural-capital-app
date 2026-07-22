import { describe, it, expect, beforeEach, vi } from "vitest";
import { notifyAdmin } from "@/src/telegram/notify";

describe("notifyAdmin", () => {
  beforeEach(() => {
    process.env.TELEGRAM_BOT_TOKEN = "test-tok";
    process.env.TELEGRAM_ADMIN_ID = "42";
    vi.restoreAllMocks();
  });

  it("POSTs to sendMessage with chat_id and text", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    await notifyAdmin("hello");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.telegram.org/bottest-tok/sendMessage");
    expect(init?.method).toBe("POST");
    const body = JSON.parse(String(init?.body));
    expect(body.chat_id).toBe(42);
    expect(body.text).toBe("hello");
  });

  it("throws with description on non-ok response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: false, description: "Bad Request" }), { status: 400 }),
    );

    await expect(notifyAdmin("x")).rejects.toThrow(/Bad Request/);
  });
});
