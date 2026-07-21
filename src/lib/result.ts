export type Result<T, C extends string = string> =
  | { ok: true; data: T }
  | { ok: false; code: C; message: string };

export const ok = <T>(data: T): Result<T> => ({ ok: true, data });
export const err = <C extends string>(code: C, message: string): Result<never, C> =>
  ({ ok: false, code, message });
