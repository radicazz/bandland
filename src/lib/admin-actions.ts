"use server";

import { randomUUID } from "crypto";
import { z } from "zod";
import { redirect } from "next/navigation";
import { updateTag } from "next/cache";

import { auth } from "@/auth";
import type { MerchItem, Show } from "@/content/schema";
import type { AdminFormState } from "@/lib/admin-form-state";
import {
  appendAuditEntry,
  readMerch,
  readShows,
  serializeContentMutation,
  writeMerch,
  writeShows,
} from "@/lib/content-store";
import {
  archiveManagedMedia,
  discardManagedMedia,
  MediaValidationError,
  processMediaUpload,
} from "@/lib/media-store";

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

function mediaErrorState(error: unknown): AdminFormState {
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
    message: "The change could not be saved. Check storage permissions or try again.",
  };
}

export async function createShowAction(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  "use server";
  await requireAdmin();

  const input = {
    date: normalizeInput(formData.get("date")),
    hasHappened: booleanInput(formData.get("hasHappened")),
    timeFrame: optionalInput(formData.get("timeFrame")),
    venue: normalizeInput(formData.get("venue")),
    city: normalizeInput(formData.get("city")),
    price: optionalInput(formData.get("price")),
    priceOnline: optionalInput(formData.get("priceOnline")),
    priceDoor: optionalInput(formData.get("priceDoor")),
    ticketUrl: optionalInput(formData.get("ticketUrl")),
  };

  const parsed = showInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: formatZodErrors(parsed.error),
    };
  }

  let imageId: string | null = null;
  try {
    imageId = await processMediaUpload(formData.get("image"));
  } catch (error) {
    return mediaErrorState(error);
  }

  const now = new Date().toISOString();
  const nextShow: Show = {
    id: randomUUID(),
    ...parsed.data,
    createdAt: now,
    updatedAt: now,
    ...(imageId ? { imageId } : {}),
  };

  try {
    await serializeContentMutation(async () => {
      const shows = await readShows();
      await writeShows([...shows, nextShow]);
      await logAudit({
        action: "create",
        entity: "shows",
        entityId: nextShow.id,
        details: JSON.stringify({ after: nextShow }),
      });
    });
  } catch (error) {
    if (imageId) {
      await discardManagedMedia(imageId);
    }
    return mediaErrorState(error);
  }

  updateTag("shows");
  redirect("/admin/shows?saved=created");
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
    hasHappened: booleanInput(formData.get("hasHappened")),
    timeFrame: optionalInput(formData.get("timeFrame")),
    venue: normalizeInput(formData.get("venue")),
    city: normalizeInput(formData.get("city")),
    price: optionalInput(formData.get("price")),
    priceOnline: optionalInput(formData.get("priceOnline")),
    priceDoor: optionalInput(formData.get("priceDoor")),
    ticketUrl: optionalInput(formData.get("ticketUrl")),
  };

  const parsed = showInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: formatZodErrors(parsed.error),
    };
  }

  let uploadedImageId: string | null = null;
  try {
    uploadedImageId = await processMediaUpload(formData.get("image"));
  } catch (error) {
    return mediaErrorState(error);
  }
  const shouldRemoveImage = booleanInput(formData.get("removeImage"));

  let replacedImageId: string | undefined;
  try {
    const result = await serializeContentMutation(async () => {
      const shows = await readShows();
      const index = shows.findIndex((show) => show.id === id);
      const before = shows[index];
      if (index === -1 || !before) {
        return { found: false as const };
      }
      const nextShow: Show = {
        ...before,
        ...parsed.data,
        updatedAt: new Date().toISOString(),
      };
      if (uploadedImageId) {
        nextShow.imageId = uploadedImageId;
        delete nextShow.imageUrl;
      } else if (shouldRemoveImage) {
        delete nextShow.imageId;
        delete nextShow.imageUrl;
      }

      const nextShows = [...shows];
      nextShows[index] = nextShow;
      await writeShows(nextShows);
      await logAudit({
        action: "update",
        entity: "shows",
        entityId: nextShow.id,
        details: JSON.stringify({ before, after: nextShow }),
      });
      return { found: true as const, replacedImageId: before.imageId };
    });
    if (!result.found) {
      if (uploadedImageId) await discardManagedMedia(uploadedImageId);
      return { status: "error", message: "Show not found." };
    }
    replacedImageId = result.replacedImageId;
  } catch (error) {
    if (uploadedImageId) await discardManagedMedia(uploadedImageId);
    return mediaErrorState(error);
  }
  if (replacedImageId && (uploadedImageId || shouldRemoveImage)) {
    await archiveManagedMedia(replacedImageId).catch((error) =>
      console.error("[Admin] Unable to archive replaced image", error),
    );
  }

  updateTag("shows");
  redirect("/admin/shows?saved=updated");
}

export async function deleteShowAction(formData: FormData) {
  "use server";
  await requireAdmin();

  const id = normalizeInput(formData.get("id"));
  if (!id) {
    return;
  }

  const removedImageId = await serializeContentMutation(async () => {
    const shows = await readShows();
    const removed = shows.find((show) => show.id === id);
    if (!removed) return undefined;
    await writeShows(shows.filter((show) => show.id !== id));
    await logAudit({
      action: "delete",
      entity: "shows",
      entityId: id,
      details: JSON.stringify({ before: removed }),
    });
    return removed.imageId;
  });
  if (removedImageId) {
    await archiveManagedMedia(removedImageId).catch((error) =>
      console.error("[Admin] Unable to archive deleted image", error),
    );
  }

  updateTag("shows");
  redirect("/admin/shows?saved=deleted");
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
  };

  const parsed = merchInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: formatZodErrors(parsed.error),
    };
  }

  let imageId: string | null = null;
  try {
    imageId = await processMediaUpload(formData.get("image"));
  } catch (error) {
    return mediaErrorState(error);
  }

  const now = new Date().toISOString();
  const nextItem: MerchItem = {
    id: randomUUID(),
    ...parsed.data,
    createdAt: now,
    updatedAt: now,
    ...(imageId ? { imageId } : {}),
  };

  try {
    await serializeContentMutation(async () => {
      const items = await readMerch();
      await writeMerch([...items, nextItem]);
      await logAudit({
        action: "create",
        entity: "merch",
        entityId: nextItem.id,
        details: JSON.stringify({ after: nextItem }),
      });
    });
  } catch (error) {
    if (imageId) await discardManagedMedia(imageId);
    return mediaErrorState(error);
  }

  updateTag("merch");
  redirect("/admin/merch?saved=created");
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
  };

  const parsed = merchInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: formatZodErrors(parsed.error),
    };
  }

  let uploadedImageId: string | null = null;
  try {
    uploadedImageId = await processMediaUpload(formData.get("image"));
  } catch (error) {
    return mediaErrorState(error);
  }
  const shouldRemoveImage = booleanInput(formData.get("removeImage"));

  let replacedImageId: string | undefined;
  try {
    const result = await serializeContentMutation(async () => {
      const items = await readMerch();
      const index = items.findIndex((item) => item.id === id);
      const before = items[index];
      if (index === -1 || !before) return { found: false as const };
      const nextItem: MerchItem = {
        ...before,
        ...parsed.data,
        updatedAt: new Date().toISOString(),
      };
      if (uploadedImageId) {
        nextItem.imageId = uploadedImageId;
        delete nextItem.imageUrl;
      } else if (shouldRemoveImage) {
        delete nextItem.imageId;
        delete nextItem.imageUrl;
      }

      const nextItems = [...items];
      nextItems[index] = nextItem;
      await writeMerch(nextItems);
      await logAudit({
        action: "update",
        entity: "merch",
        entityId: nextItem.id,
        details: JSON.stringify({ before, after: nextItem }),
      });
      return { found: true as const, replacedImageId: before.imageId };
    });
    if (!result.found) {
      if (uploadedImageId) await discardManagedMedia(uploadedImageId);
      return { status: "error", message: "Merch item not found." };
    }
    replacedImageId = result.replacedImageId;
  } catch (error) {
    if (uploadedImageId) await discardManagedMedia(uploadedImageId);
    return mediaErrorState(error);
  }
  if (replacedImageId && (uploadedImageId || shouldRemoveImage)) {
    await archiveManagedMedia(replacedImageId).catch((error) =>
      console.error("[Admin] Unable to archive replaced image", error),
    );
  }

  updateTag("merch");
  redirect("/admin/merch?saved=updated");
}

export async function deleteMerchAction(formData: FormData) {
  "use server";
  await requireAdmin();

  const id = normalizeInput(formData.get("id"));
  if (!id) {
    return;
  }

  const removedImageId = await serializeContentMutation(async () => {
    const items = await readMerch();
    const removed = items.find((item) => item.id === id);
    if (!removed) return undefined;
    await writeMerch(items.filter((item) => item.id !== id));
    await logAudit({
      action: "delete",
      entity: "merch",
      entityId: id,
      details: JSON.stringify({ before: removed }),
    });
    return removed.imageId;
  });
  if (removedImageId) {
    await archiveManagedMedia(removedImageId).catch((error) =>
      console.error("[Admin] Unable to archive deleted image", error),
    );
  }

  updateTag("merch");
  redirect("/admin/merch?saved=deleted");
}
