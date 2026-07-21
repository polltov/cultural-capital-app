export function rublesToKopecks(rub: number): number {
  if (rub < 0 || !Number.isFinite(rub)) throw new Error("invalid rubles");
  return Math.round(rub * 100);
}

export function kopecksToRubles(kop: number): number {
  return Math.round(kop) / 100;
}

export function formatRub(kop: number): string {
  const rub = kopecksToRubles(kop);
  const isWhole = Number.isInteger(rub);
  const whole = Math.trunc(rub);
  const wholeStr = whole.toLocaleString("ru-RU").replace(/[\u00A0\u202F,]/g, " ");
  if (isWhole) return `${wholeStr} ₽`;
  const cents = Math.round((rub - whole) * 100).toString().padStart(2, "0");
  return `${wholeStr},${cents} ₽`;
}
