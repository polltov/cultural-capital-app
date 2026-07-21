export type CartItemInput = { slotId: string; adult: number; child: number };

export type HydratedCartItem = {
  slotId: string;
  tourSlug: string;
  tourTitle: string;
  startsAt: string;
  seatsLeft: number;
  priceAdult: number;
  priceChild: number;
  adult: number;
  child: number;
};

export type HydratedCart =
  | { ok: true; items: HydratedCartItem[]; removed: Array<{ slotId: string; reason: string }> }
  | { ok: false; code: string; message: string };
