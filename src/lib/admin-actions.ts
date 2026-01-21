"use server";

import { randomUUID } from "crypto";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";

import { auth } from "@/auth";
import type { MerchItem, Show } from "@/content/schema";
import type { AdminFormState } from "@/lib/admin-form-state";
import {
  appendAuditEntry,
  readMerch,
  readShows,
  writeMerch,
  writeShows,
} from "@/lib/content-store";


const showInputSchema = z.object({
  date: z.string().datetime({ offset: true }),
  venue: z.string().min(1),
  city: z.string().min(1),
  price: z.string().min(1).optional(),
  ticketUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
});

const merchInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1).optional(),
  price: z.string().min(1),
  href: z.string().url(),
  imageUrl: z.string().url().optional(),
});

function normalizeInput(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalInput(value: FormDataEntryValue | null) {
  const normalized = normalizeInput(value);
  return normalized.length > 0 ? normalized : undefined;
}

function formatZodErrors(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && fieldErrors[key] === undefined) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

async function requireAdmin() {
  const session = await auth();
  if (!session) {
    redirect("/admin");
  }
  return session;
}

async function logAudit({
  action,
  entity,
  entityId,
  details,
}: {
  action: "create" | "update" | "delete";
  entity: "shows" | "merch";
  entityId: string;
  details?: string;
}) {
  await appendAuditEntry({
    id: randomUUID(),
    actor: "admin",
    action,
    entity,
    entityId,
    createdAt: new Date().toISOString(),
    ...(details ? { details } : {}),
  });
}

export async function createShowAction(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  "use server";
  await requireAdmin();

  const input = {
    date: normalizeInput(formData.get("date")),
    venue: normalizeInput(formData.get("venue")),
    city: normalizeInput(formData.get("city")),
    price: optionalInput(formData.get("price")),
    ticketUrl: optionalInput(formData.get("ticketUrl")),
    imageUrl: optionalInput(formData.get("imageUrl")),
  };

  const parsed = showInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: formatZodErrors(parsed.error),
    };
  }

  const now = new Date().toISOString();
  const nextShow: Show = {
    id: randomUUID(),
    ...parsed.data,
    createdAt: now,
    updatedAt: now,
  };

  const shows = await readShows();
  const nextShows = [...shows, nextShow];
  await writeShows(nextShows);
  await logAudit({
    action: "create",
    entity: "shows",
    entityId: nextShow.id,
    details: JSON.stringify({ after: nextShow }),
  });

  revalidateTag("shows", "default");
  redirect("/admin/shows");
}

export async function updateShowAction(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  "use server";
  await requireAdmin();

  const id = normalizeInput(formData.get("id"));
  if (!id) {
    return {
      status: "error",
      message: "Show ID is missing.",
    };
  }

  const input = {
    date: normalizeInput(formData.get("date")),
    venue: normalizeInput(formData.get("venue")),
    city: normalizeInput(formData.get("city")),
    price: optionalInput(formData.get("price")),
    ticketUrl: optionalInput(formData.get("ticketUrl")),
    imageUrl: optionalInput(formData.get("imageUrl")),
  };

  const parsed = showInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: formatZodErrors(parsed.error),
    };
  }

  const shows = await readShows();
  const index = shows.findIndex((show) => show.id === id);
  if (index === -1) {
    return {
      status: "error",
      message: "Show not found.",
    };
  }

  const now = new Date().toISOString();
  const before = shows[index];
  if (!before) {
    return {
      status: "error",
      message: "Show not found.",
    };
  }
  const nextShow: Show = {
    ...before,
    ...parsed.data,
    updatedAt: now,
  };

  const nextShows = [...shows];
  nextShows[index] = nextShow;
  await writeShows(nextShows);
  await logAudit({
    action: "update",
    entity: "shows",
    entityId: nextShow.id,
    details: JSON.stringify({ before, after: nextShow }),
  });

  revalidateTag("shows", "default");
  redirect("/admin/shows");
}

export async function deleteShowAction(formData: FormData) {
  "use server";
  await requireAdmin();

  const id = normalizeInput(formData.get("id"));
  if (!id) {
    return;
  }

  const shows = await readShows();
  const nextShows = shows.filter((show) => show.id !== id);
  if (nextShows.length === shows.length) {
    return;
  }

  const removed = shows.find((show) => show.id === id);
  await writeShows(nextShows);
  const deleteDetails = removed ? JSON.stringify({ before: removed }) : undefined;
  await logAudit({
    action: "delete",
    entity: "shows",
    entityId: id,
    ...(deleteDetails ? { details: deleteDetails } : {}),
  });

  revalidateTag("shows", "default");
  redirect("/admin/shows");
}

export async function createMerchAction(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  "use server";
  await requireAdmin();

  const input = {
    name: normalizeInput(formData.get("name")),
    description: optionalInput(formData.get("description")),
    price: normalizeInput(formData.get("price")),
    href: normalizeInput(formData.get("href")),
    imageUrl: optionalInput(formData.get("imageUrl")),
  };

  const parsed = merchInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: formatZodErrors(parsed.error),
    };
  }

  const now = new Date().toISOString();
  const nextItem: MerchItem = {
    id: randomUUID(),
    ...parsed.data,
    createdAt: now,
    updatedAt: now,
  };

  const items = await readMerch();
  const nextItems = [...items, nextItem];
  await writeMerch(nextItems);
  await logAudit({
    action: "create",
    entity: "merch",
    entityId: nextItem.id,
    details: JSON.stringify({ after: nextItem }),
  });

  revalidateTag("merch", "default");
  redirect("/admin/merch");
}

export async function updateMerchAction(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  "use server";
  await requireAdmin();

  const id = normalizeInput(formData.get("id"));
  if (!id) {
    return {
      status: "error",
      message: "Merch ID is missing.",
    };
  }

  const input = {
    name: normalizeInput(formData.get("name")),
    description: optionalInput(formData.get("description")),
    price: normalizeInput(formData.get("price")),
    href: normalizeInput(formData.get("href")),
    imageUrl: optionalInput(formData.get("imageUrl")),
  };

  const parsed = merchInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: formatZodErrors(parsed.error),
    };
  }

  const items = await readMerch();
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) {
    return {
      status: "error",
      message: "Merch item not found.",
    };
  }

  const now = new Date().toISOString();
  const before = items[index];
  if (!before) {
    return {
      status: "error",
      message: "Merch item not found.",
    };
  }
  const nextItem: MerchItem = {
    ...before,
    ...parsed.data,
    updatedAt: now,
  };

  const nextItems = [...items];
  nextItems[index] = nextItem;
  await writeMerch(nextItems);
  await logAudit({
    action: "update",
    entity: "merch",
    entityId: nextItem.id,
    details: JSON.stringify({ before, after: nextItem }),
  });

  revalidateTag("merch", "default");
  redirect("/admin/merch");
}

export async function deleteMerchAction(formData: FormData) {
  "use server";
  await requireAdmin();

  const id = normalizeInput(formData.get("id"));
  if (!id) {
    return;
  }

  const items = await readMerch();
  const nextItems = items.filter((item) => item.id !== id);
  if (nextItems.length === items.length) {
    return;
  }

  const removed = items.find((item) => item.id === id);
  await writeMerch(nextItems);
  const deleteDetails = removed ? JSON.stringify({ before: removed }) : undefined;
  await logAudit({
    action: "delete",
    entity: "merch",
    entityId: id,
    ...(deleteDetails ? { details: deleteDetails } : {}),
  });

  revalidateTag("merch", "default");
  redirect("/admin/merch");
}
