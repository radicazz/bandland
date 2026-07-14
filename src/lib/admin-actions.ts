"use server";

import { randomUUID } from "node:crypto";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/auth";
import type { MerchItem, Show } from "@/content/schema";
import type { AdminFormState } from "@/lib/admin-form-state";
import { appendAuditEntry, mutateMerch, mutateShows } from "@/lib/content-store";
import { discardManagedMedia, MediaValidationError, validateManagedMedia } from "@/lib/media-store";
import { isReadOnlyDeployment } from "@/lib/runtime-environment";

const showInputSchema = z.object({
  date: z.string().datetime({ offset: true }),
  hasHappened: z.boolean(),
  timeFrame: z.string().min(1).optional(),
  venue: z.string().min(1),
  city: z.string().min(1),
  price: z.string().min(1).optional(),
  priceOnline: z.string().min(1).optional(),
  priceDoor: z.string().min(1).optional(),
  ticketUrl: z.string().url().optional(),
});

const merchInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1).optional(),
  price: z.string().min(1),
  href: z.string().url(),
});

function normalizeInput(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalInput(value: FormDataEntryValue | null) {
  const normalized = normalizeInput(value);
  return normalized.length > 0 ? normalized : undefined;
}

function booleanInput(value: FormDataEntryValue | null) {
  return value !== null;
}

function getUploadedImageUrl(formData: FormData) {
  return optionalInput(formData.get("uploadedImageUrl"));
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
  if (!session) redirect("/admin");
  return session;
}

function readOnlyState(): AdminFormState | null {
  return isReadOnlyDeployment()
    ? { status: "error", message: "Preview deployments are read-only." }
    : null;
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
  try {
    await appendAuditEntry({
      id: randomUUID(),
      actor: "admin",
      action,
      entity,
      entityId,
      createdAt: new Date().toISOString(),
      ...(details ? { details } : {}),
    });
  } catch (error) {
    console.error("[Admin] Content saved but audit logging failed", error);
  }
}

function storageErrorState(error: unknown): AdminFormState {
  if (error instanceof MediaValidationError) {
    return {
      status: "error",
      message: "Please choose a different image.",
      fieldErrors: { image: error.message },
    };
  }
  console.error("[Admin] Unable to save content", error);
  return {
    status: "error",
    message: "The change could not be saved. Check the Vercel storage connection or try again.",
  };
}

async function cleanupFailedUpload(url: string | undefined) {
  if (url) await discardManagedMedia(url);
}

export async function createShowAction(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const blocked = readOnlyState();
  if (blocked) return blocked;

  const uploadedImageUrl = getUploadedImageUrl(formData);
  const parsed = showInputSchema.safeParse({
    date: normalizeInput(formData.get("date")),
    hasHappened: booleanInput(formData.get("hasHappened")),
    timeFrame: optionalInput(formData.get("timeFrame")),
    venue: normalizeInput(formData.get("venue")),
    city: normalizeInput(formData.get("city")),
    price: optionalInput(formData.get("price")),
    priceOnline: optionalInput(formData.get("priceOnline")),
    priceDoor: optionalInput(formData.get("priceDoor")),
    ticketUrl: optionalInput(formData.get("ticketUrl")),
  });
  if (!parsed.success) {
    await cleanupFailedUpload(uploadedImageUrl);
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: formatZodErrors(parsed.error),
    };
  }

  let imageUrl: string | undefined;
  try {
    imageUrl = uploadedImageUrl ? await validateManagedMedia(uploadedImageUrl, "shows") : undefined;
  } catch (error) {
    await cleanupFailedUpload(uploadedImageUrl);
    return storageErrorState(error);
  }

  const now = new Date().toISOString();
  const nextShow: Show = {
    id: randomUUID(),
    ...parsed.data,
    createdAt: now,
    updatedAt: now,
    ...(imageUrl ? { imageUrl } : {}),
  };

  try {
    await mutateShows((shows) => ({ data: [...shows, nextShow], result: undefined }));
  } catch (error) {
    await cleanupFailedUpload(imageUrl);
    return storageErrorState(error);
  }

  await logAudit({
    action: "create",
    entity: "shows",
    entityId: nextShow.id,
    details: JSON.stringify({ after: nextShow }),
  });
  updateTag("shows");
  redirect("/admin/shows?saved=created");
}

export async function updateShowAction(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const blocked = readOnlyState();
  if (blocked) return blocked;

  const id = normalizeInput(formData.get("id"));
  const uploadedImageUrl = getUploadedImageUrl(formData);
  if (!id) {
    await cleanupFailedUpload(uploadedImageUrl);
    return { status: "error", message: "Show ID is missing." };
  }

  const parsed = showInputSchema.safeParse({
    date: normalizeInput(formData.get("date")),
    hasHappened: booleanInput(formData.get("hasHappened")),
    timeFrame: optionalInput(formData.get("timeFrame")),
    venue: normalizeInput(formData.get("venue")),
    city: normalizeInput(formData.get("city")),
    price: optionalInput(formData.get("price")),
    priceOnline: optionalInput(formData.get("priceOnline")),
    priceDoor: optionalInput(formData.get("priceDoor")),
    ticketUrl: optionalInput(formData.get("ticketUrl")),
  });
  if (!parsed.success) {
    await cleanupFailedUpload(uploadedImageUrl);
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: formatZodErrors(parsed.error),
    };
  }

  let imageUrl: string | undefined;
  try {
    imageUrl = uploadedImageUrl ? await validateManagedMedia(uploadedImageUrl, "shows") : undefined;
  } catch (error) {
    await cleanupFailedUpload(uploadedImageUrl);
    return storageErrorState(error);
  }

  const shouldRemoveImage = booleanInput(formData.get("removeImage"));
  try {
    const result = await mutateShows((shows) => {
      const index = shows.findIndex((show) => show.id === id);
      const before = shows[index];
      if (!before) return { data: shows, result: null };

      const after: Show = { ...before, ...parsed.data, updatedAt: new Date().toISOString() };
      if (imageUrl) after.imageUrl = imageUrl;
      else if (shouldRemoveImage) delete after.imageUrl;

      const next = [...shows];
      next[index] = after;
      return { data: next, result: { before, after } };
    });

    if (!result) {
      await cleanupFailedUpload(imageUrl);
      return { status: "error", message: "Show not found." };
    }

    await logAudit({
      action: "update",
      entity: "shows",
      entityId: id,
      details: JSON.stringify(result),
    });
    if ((imageUrl || shouldRemoveImage) && result.before.imageUrl !== imageUrl) {
      await discardManagedMedia(result.before.imageUrl);
    }
  } catch (error) {
    await cleanupFailedUpload(imageUrl);
    return storageErrorState(error);
  }

  updateTag("shows");
  redirect("/admin/shows?saved=updated");
}

export async function deleteShowAction(formData: FormData) {
  await requireAdmin();
  if (isReadOnlyDeployment()) return;
  const id = normalizeInput(formData.get("id"));
  if (!id) return;

  const removed = await mutateShows((shows) => {
    const item = shows.find((show) => show.id === id);
    return { data: shows.filter((show) => show.id !== id), result: item };
  });
  if (!removed) return;

  await logAudit({
    action: "delete",
    entity: "shows",
    entityId: id,
    details: JSON.stringify({ before: removed }),
  });
  await discardManagedMedia(removed.imageUrl);
  updateTag("shows");
  redirect("/admin/shows?saved=deleted");
}

export async function createMerchAction(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const blocked = readOnlyState();
  if (blocked) return blocked;

  const uploadedImageUrl = getUploadedImageUrl(formData);
  const parsed = merchInputSchema.safeParse({
    name: normalizeInput(formData.get("name")),
    description: optionalInput(formData.get("description")),
    price: normalizeInput(formData.get("price")),
    href: normalizeInput(formData.get("href")),
  });
  if (!parsed.success) {
    await cleanupFailedUpload(uploadedImageUrl);
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: formatZodErrors(parsed.error),
    };
  }

  let imageUrl: string | undefined;
  try {
    imageUrl = uploadedImageUrl ? await validateManagedMedia(uploadedImageUrl, "merch") : undefined;
  } catch (error) {
    await cleanupFailedUpload(uploadedImageUrl);
    return storageErrorState(error);
  }

  const now = new Date().toISOString();
  const nextItem: MerchItem = {
    id: randomUUID(),
    ...parsed.data,
    createdAt: now,
    updatedAt: now,
    ...(imageUrl ? { imageUrl } : {}),
  };

  try {
    await mutateMerch((items) => ({ data: [...items, nextItem], result: undefined }));
  } catch (error) {
    await cleanupFailedUpload(imageUrl);
    return storageErrorState(error);
  }

  await logAudit({
    action: "create",
    entity: "merch",
    entityId: nextItem.id,
    details: JSON.stringify({ after: nextItem }),
  });
  updateTag("merch");
  redirect("/admin/merch?saved=created");
}

export async function updateMerchAction(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const blocked = readOnlyState();
  if (blocked) return blocked;

  const id = normalizeInput(formData.get("id"));
  const uploadedImageUrl = getUploadedImageUrl(formData);
  if (!id) {
    await cleanupFailedUpload(uploadedImageUrl);
    return { status: "error", message: "Merch ID is missing." };
  }

  const parsed = merchInputSchema.safeParse({
    name: normalizeInput(formData.get("name")),
    description: optionalInput(formData.get("description")),
    price: normalizeInput(formData.get("price")),
    href: normalizeInput(formData.get("href")),
  });
  if (!parsed.success) {
    await cleanupFailedUpload(uploadedImageUrl);
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: formatZodErrors(parsed.error),
    };
  }

  let imageUrl: string | undefined;
  try {
    imageUrl = uploadedImageUrl ? await validateManagedMedia(uploadedImageUrl, "merch") : undefined;
  } catch (error) {
    await cleanupFailedUpload(uploadedImageUrl);
    return storageErrorState(error);
  }

  const shouldRemoveImage = booleanInput(formData.get("removeImage"));
  try {
    const result = await mutateMerch((items) => {
      const index = items.findIndex((item) => item.id === id);
      const before = items[index];
      if (!before) return { data: items, result: null };

      const after: MerchItem = { ...before, ...parsed.data, updatedAt: new Date().toISOString() };
      if (imageUrl) after.imageUrl = imageUrl;
      else if (shouldRemoveImage) delete after.imageUrl;

      const next = [...items];
      next[index] = after;
      return { data: next, result: { before, after } };
    });

    if (!result) {
      await cleanupFailedUpload(imageUrl);
      return { status: "error", message: "Merch item not found." };
    }

    await logAudit({
      action: "update",
      entity: "merch",
      entityId: id,
      details: JSON.stringify(result),
    });
    if ((imageUrl || shouldRemoveImage) && result.before.imageUrl !== imageUrl) {
      await discardManagedMedia(result.before.imageUrl);
    }
  } catch (error) {
    await cleanupFailedUpload(imageUrl);
    return storageErrorState(error);
  }

  updateTag("merch");
  redirect("/admin/merch?saved=updated");
}

export async function deleteMerchAction(formData: FormData) {
  await requireAdmin();
  if (isReadOnlyDeployment()) return;
  const id = normalizeInput(formData.get("id"));
  if (!id) return;

  const removed = await mutateMerch((items) => {
    const item = items.find((entry) => entry.id === id);
    return { data: items.filter((entry) => entry.id !== id), result: item };
  });
  if (!removed) return;

  await logAudit({
    action: "delete",
    entity: "merch",
    entityId: id,
    details: JSON.stringify({ before: removed }),
  });
  await discardManagedMedia(removed.imageUrl);
  updateTag("merch");
  redirect("/admin/merch?saved=deleted");
}
