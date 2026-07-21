import { z } from "zod";

export const cartItemSchema = z.object({
  slotId: z.string().uuid(),
  adult: z.number().int().min(1).max(50),
  child: z.number().int().min(1).max(50),
});

export const cartSchema = z.object({
  items: z.array(cartItemSchema).min(1).max(20),
});

export const customerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(40).regex(/^[+\d\s()\-]+$/),
  email: z.string().trim().email().max(200),
});

export const orderSubmissionSchema = customerSchema.extend({
  items: cartSchema.shape.items,
});
