"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import { ImageUploadField } from "@/components/admin/ImageUploadField";
import type { MerchItem } from "@/content/schema";
import { initialAdminFormState, type AdminFormState } from "@/lib/admin-form-state";
import { submitAdminFormWithImage } from "@/lib/admin-image-upload";

type MerchFormProps = {
  action: (prevState: AdminFormState, formData: FormData) => Promise<AdminFormState>;
  initialValues?: MerchItem;
  submitLabel: string;
  uploadPrefix?: string;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="btn-primary min-w-[10rem] w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
    >
      {pending ? "Saving..." : label}
    </button>
  );
}

function FieldError({ message }: { message: string | undefined }) {
  if (!message) {
    return null;
  }
  return (
    <p className="mt-2 text-xs text-highlight" role="alert">
      {message}
    </p>
  );
}

export function MerchForm({
  action,
  initialValues,
  submitLabel,
  uploadPrefix = "media/development/merch/",
}: MerchFormProps) {
  const [state, formAction] = useActionState(
    (previousState: AdminFormState, formData: FormData) =>
      submitAdminFormWithImage({ action, previousState, formData, uploadPrefix }),
    initialAdminFormState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  const inputBase =
    "mt-2 min-h-11 w-full rounded-xl border bg-bg/60 px-4 py-3 text-sm text-text placeholder:text-text-dim";

  useEffect(() => {
    if (state.status === "error") {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="mt-6 grid gap-5 sm:gap-6">
      {state.message ? (
        <p
          role="alert"
          className="rounded-xl border border-highlight/40 bg-highlight/10 px-4 py-3 text-sm text-highlight"
        >
          {state.message}
        </p>
      ) : null}

      {initialValues?.id ? <input type="hidden" name="id" value={initialValues.id} /> : null}

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
          className={`${inputBase} ${state.fieldErrors?.description ? "border-highlight/70" : "border-border/70"} min-h-28 resize-y`}
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
          type="url"
          inputMode="url"
          spellCheck={false}
          required
          defaultValue={initialValues?.href ?? ""}
          className={`${inputBase} ${state.fieldErrors?.href ? "border-highlight/70" : "border-border/70"}`}
          placeholder="https://store.example.com/item"
          aria-invalid={Boolean(state.fieldErrors?.href)}
        />
        <FieldError message={state.fieldErrors?.href} />
      </label>

      <ImageUploadField
        label="Merch photo (optional)"
        currentImageUrl={initialValues?.imageUrl}
        error={state.fieldErrors?.image}
      />

      <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-4 border border-border bg-surface/95 p-3 shadow-2xl sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
