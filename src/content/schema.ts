import { z } from "zod";

export const showSchema = z.object({
  id: z.string().uuid(),
  date: z.string().datetime({ offset: true }),
  venue: z.string().min(1),
  city: z.string().min(1),
  price: z.string().min(1).optional(),
  ticketUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export type Show = z.infer<typeof showSchema>;

export const merchItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().min(1).optional(),
  price: z.string().min(1),
  href: z.string().url(),
  imageUrl: z.string().url().optional(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export type MerchItem = z.infer<typeof merchItemSchema>;

export const adminAuditSchema = z.object({
  id: z.string().uuid(),
  actor: z.string().min(1),
  action: z.enum(["create", "update", "delete"]),
  entity: z.enum(["shows", "merch"]),
  entityId: z.string().uuid(),
  createdAt: z.string().datetime({ offset: true }),
  details: z.string().min(1).optional(),
});

export type AdminAuditEntry = z.infer<typeof adminAuditSchema>;
