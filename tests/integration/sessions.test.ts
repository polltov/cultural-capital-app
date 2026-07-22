import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { makeTestDb, truncateAll } from "../helpers/db";
import { hashPassword } from "@/src/auth/password";
import { createAdmin } from "@/src/db/queries/admins";
import { issueSession, readSession, revokeSession } from "@/src/auth/session";

const h = await makeTestDb();
beforeEach(() => truncateAll(h.client));
afterAll(() => h.cleanup());

describe("sessions", () => {
  it("issue -> read -> revoke", async () => {
    const a = await createAdmin(h.db, "root@example.com", await hashPassword("x"));
    const { token } = await issueSession(a.id);
    const found = await readSession(token);
    expect(found?.id).toBe(a.id);
    await revokeSession(token);
    expect(await readSession(token)).toBeNull();
  });
});
