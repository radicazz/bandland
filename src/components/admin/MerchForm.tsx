"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import type { MerchItem } from "@/content/schema";
import {
  initialAdminFormState,
  type AdminFormState,
} from "@/lib/admin-form-state";

type MerchFormProps = {
  action: (prevState: AdminFormState, formData: FormData) => Promise<AdminFormState>;
  initialValues?: MerchItem;
  submitLabel: string;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary min-w-[10rem]" disabled={pending}>
      {pending ? "Saving..." : label}
    </button>
  );
}

function FieldError({ message }: { message: string | undefined }) {
  if (!message) {
    return null;
  }
  return (
    <p className="mt-2 text-xs text-highlight" role="status">
      {message}
    </p>
  );
}

export function MerchForm({ action, initialValues, submitLabel }: MerchFormProps) {
  const [state, formAction] = useFormState(action, initialAdminFormState);
  const [imagePreview, setImagePreview] = useState(
    initialValues?.imageUrl ?? "",
  );

  const inputBase =
    "mt-2 w-full rounded-xl border bg-bg/60 px-4 py-3 text-sm text-text placeholder:text-text-dim";

  return (
    <form action={formAction} className="mt-6 grid gap-6">
      {state.message ? (
        <p className="rounded-xl border border-highlight/40 bg-highlight/10 px-4 py-3 text-sm text-highlight">
          {state.message}
        </p>
      ) : null}

      {initialValues?.id ? (
        <input type="hidden" name="id" value={initialValues.id} />
      ) : null}

      <label className="text-xs uppercase tracking-[0.3em] text-text-dim">
        Name
        <input
          name="name"
          required
          defaultValue={initialValues?.name ?? ""}
          className={`${inputBase} ${state.fieldErrors?.name ? "border-highlight/70" : "border-border/70"}`}
          placeholder="Tour T-Shirt"
          aria-invalid={Boolean(state.fieldErrors?.name)}
        />
        <FieldError message={state.fieldErrors?.name} />
      </label>

      <label className="text-xs uppercase tracking-[0.3em] text-text-dim">
        Description (optional)
        <textarea
          name="description"
          rows={3}
          defaultValue={initialValues?.description ?? ""}
          className={`${inputBase} ${state.fieldErrors?.description ? "border-highlight/70" : "border-border/70"} resize-none`}
          placeholder="Short copy for the merch detail."
          aria-invalid={Boolean(state.fieldErrors?.description)}
        />
        <FieldError message={state.fieldErrors?.description} />
      </label>

      <label className="text-xs uppercase tracking-[0.3em] text-text-dim">
        Price
        <input
          name="price"
          required
          defaultValue={initialValues?.price ?? ""}
          className={`${inputBase} ${state.fieldErrors?.price ? "border-highlight/70" : "border-border/70"} tabular-nums`}
          placeholder="R450"
          aria-invalid={Boolean(state.fieldErrors?.price)}
        />
        <FieldError message={state.fieldErrors?.price} />
      </label>

      <label className="text-xs uppercase tracking-[0.3em] text-text-dim">
        Link URL
        <input
          name="href"
          required
          defaultValue={initialValues?.href ?? ""}
          className={`${inputBase} ${state.fieldErrors?.href ? "border-highlight/70" : "border-border/70"}`}
          placeholder="https://store.example.com/item"
          aria-invalid={Boolean(state.fieldErrors?.href)}
        />
        <FieldError message={state.fieldErrors?.href} />
      </label>

      <label className="text-xs uppercase tracking-[0.3em] text-text-dim">
        Image URL (optional)
        <input
          name="imageUrl"
          value={imagePreview}
          onChange={(event) => setImagePreview(event.target.value)}
          className={`${inputBase} ${state.fieldErrors?.imageUrl ? "border-highlight/70" : "border-border/70"}`}
          placeholder="https://images.example.com/merch.jpg"
          aria-invalid={Boolean(state.fieldErrors?.imageUrl)}
        />
        <FieldError message={state.fieldErrors?.imageUrl} />
        {imagePreview ? (
          <div className="mt-3 overflow-hidden rounded-xl border border-border/70 bg-bg/60">
            <img
              src={imagePreview}
              alt="Merch preview"
              className="h-40 w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        ) : null}
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
