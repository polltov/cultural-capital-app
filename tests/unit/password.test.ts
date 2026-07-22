import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/src/auth/password";

describe("password", () => {
  it("hashes and verifies", async () => {
    const h = await hashPassword("secret-pw");
    expect(await verifyPassword("secret-pw", h)).toBe(true);
    expect(await verifyPassword("wrong", h)).toBe(false);
  });
});
