import { describe, it, expect } from "vitest";
import { rublesToKopecks, kopecksToRubles, formatRub } from "@/src/lib/money";

describe("money", () => {
  it("rubles -> kopecks (integer)", () => {
    expect(rublesToKopecks(1899)).toBe(189900);
  });
  it("kopecks -> rubles", () => {
    expect(kopecksToRubles(189900)).toBe(1899);
  });
  it("formats without decimals when even", () => {
    expect(formatRub(189900)).toBe("1 899 ₽");
  });
  it("formats with decimals when needed", () => {
    expect(formatRub(189950)).toBe("1 899,50 ₽");
  });
  it("rejects negative", () => {
    expect(() => rublesToKopecks(-1)).toThrow();
  });
});
