"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import type { Show } from "@/content/schema";
import {
  initialAdminFormState,
  type AdminFormState,
} from "@/lib/admin-form-state";

type ShowFormProps = {
  action: (prevState: AdminFormState, formData: FormData) => Promise<AdminFormState>;
  initialValues?: Show;
  submitLabel: string;
};

const SAST_TIMEZONE_OFFSET = "+02:00";

function parseISODateTime(isoString: string): { date: string; time: string } {
  const [datePart, timePart] = isoString.split("T");
  const time = timePart?.slice(0, 5) ?? "";
  return { date: datePart ?? "", time };
}

function combineDateTime(date: string, time: string): string {
  return `${date}T${time}:00${SAST_TIMEZONE_OFFSET}`;
}

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

export function ShowForm({ action, initialValues, submitLabel }: ShowFormProps) {
  const [state, formAction] = useActionState(action, initialAdminFormState);
  const [imagePreview, setImagePreview] = useState(
    initialValues?.imageUrl ?? "",
  );

  const parsedDateTime = initialValues?.date
    ? parseISODateTime(initialValues.date)
    : { date: "", time: "" };

  const inputBase =
    "mt-2 w-full rounded-xl border bg-bg/60 px-4 py-3 text-sm text-text placeholder:text-text-dim";

  const handleFormAction = (formData: FormData) => {
    const date = formData.get("showDate") as string;
    const time = formData.get("showTime") as string;

    if (date && time) {
      const combinedDateTime = combineDateTime(date, time);
      formData.set("date", combinedDateTime);
    }

    formData.delete("showDate");
    formData.delete("showTime");

    return formAction(formData);
  };

  return (
    <form action={handleFormAction} className="mt-6 grid gap-6">
      {state.message ? (
        <p className="rounded-xl border border-highlight/40 bg-highlight/10 px-4 py-3 text-sm text-highlight">
          {state.message}
        </p>
      ) : null}

      {initialValues?.id ? (
        <input type="hidden" name="id" value={initialValues.id} />
      ) : null}

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="text-xs uppercase tracking-[0.3em] text-text-dim mb-2">
          Show Date & Time
        </legend>

        <label className="text-xs uppercase tracking-[0.3em] text-text-dim">
          Date
          <input
            type="date"
            name="showDate"
            required
            defaultValue={parsedDateTime.date}
            className={`${inputBase} ${state.fieldErrors?.date ? "border-highlight/70" : "border-border/70"} tabular-nums`}
            aria-invalid={Boolean(state.fieldErrors?.date)}
          />
        </label>

        <label className="text-xs uppercase tracking-[0.3em] text-text-dim">
          Time
          <input
            type="time"
            name="showTime"
            required
            defaultValue={parsedDateTime.time}
            className={`${inputBase} ${state.fieldErrors?.date ? "border-highlight/70" : "border-border/70"} tabular-nums`}
            aria-invalid={Boolean(state.fieldErrors?.date)}
          />
        </label>

        {state.fieldErrors?.date ? (
          <div className="sm:col-span-2">
            <FieldError message={state.fieldErrors.date} />
          </div>
        ) : null}

        <p className="text-xs text-text-dim sm:col-span-2">
          Timezone: SAST (UTC+02:00)
        </p>
      </fieldset>

      <label className="text-xs uppercase tracking-[0.3em] text-text-dim">
        Venue
        <input
          name="venue"
          required
          defaultValue={initialValues?.venue ?? ""}
          className={`${inputBase} ${state.fieldErrors?.venue ? "border-highlight/70" : "border-border/70"}`}
          placeholder="The Waiting Room"
          aria-invalid={Boolean(state.fieldErrors?.venue)}
        />
        <FieldError message={state.fieldErrors?.venue} />
      </label>

      <label className="text-xs uppercase tracking-[0.3em] text-text-dim">
        City
        <input
          name="city"
          required
          defaultValue={initialValues?.city ?? ""}
          className={`${inputBase} ${state.fieldErrors?.city ? "border-highlight/70" : "border-border/70"}`}
          placeholder="Cape Town, WC"
          aria-invalid={Boolean(state.fieldErrors?.city)}
        />
        <FieldError message={state.fieldErrors?.city} />
      </label>

      <label className="text-xs uppercase tracking-[0.3em] text-text-dim">
        Price (optional)
        <input
          name="price"
          defaultValue={initialValues?.price ?? ""}
          className={`${inputBase} ${state.fieldErrors?.price ? "border-highlight/70" : "border-border/70"} tabular-nums`}
          placeholder="R200 or Free"
          aria-invalid={Boolean(state.fieldErrors?.price)}
        />
        <FieldError message={state.fieldErrors?.price} />
      </label>

      <label className="text-xs uppercase tracking-[0.3em] text-text-dim">
        Ticket URL (optional)
        <input
          name="ticketUrl"
          defaultValue={initialValues?.ticketUrl ?? ""}
          className={`${inputBase} ${state.fieldErrors?.ticketUrl ? "border-highlight/70" : "border-border/70"}`}
          placeholder="https://tickets.example.com/show"
          aria-invalid={Boolean(state.fieldErrors?.ticketUrl)}
        />
        <FieldError message={state.fieldErrors?.ticketUrl} />
      </label>

      <label className="text-xs uppercase tracking-[0.3em] text-text-dim">
        Image URL (optional)
        <input
          name="imageUrl"
          value={imagePreview}
          onChange={(event) => setImagePreview(event.target.value)}
          className={`${inputBase} ${state.fieldErrors?.imageUrl ? "border-highlight/70" : "border-border/70"}`}
          placeholder="https://images.example.com/show.jpg"
          aria-invalid={Boolean(state.fieldErrors?.imageUrl)}
        />
        <FieldError message={state.fieldErrors?.imageUrl} />
        {imagePreview ? (
          <div className="mt-3 overflow-hidden rounded-xl border border-border/70 bg-bg/60">
            <img
              src={imagePreview}
              alt="Show preview"
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
