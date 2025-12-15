import { z } from "zod";

export const showSchema = z.object({
  id: z.string().min(1),
  date: z.string().min(1),
  venue: z.string().min(1),
  city: z.string().min(1),
  ticketUrl: z.string().url().optional(),
});

export type Show = z.infer<typeof showSchema>;

export const merchItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  href: z.string().url(),
  price: z.string().min(1).optional(),
});

export type MerchItem = z.infer<typeof merchItemSchema>;

