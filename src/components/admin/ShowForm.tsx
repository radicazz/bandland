"use client";

import { type FormEvent, useActionState, useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { ShowCard, type ShowCardDetails } from "@/components/ShowCard";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import type { Show } from "@/content/schema";
import type { Locale, Translations } from "@/i18n/translations";
import { initialAdminFormState, type AdminFormState } from "@/lib/admin-form-state";
import { submitAdminFormWithImage } from "@/lib/admin-image-upload";

type ShowFormProps = {
  action: (prevState: AdminFormState, formData: FormData) => Promise<AdminFormState>;
  initialValues?: Show;
  labels: Translations["shows"];
  locale: Locale;
  submitLabel: string;
  uploadPrefix?: string;
};

type ShowDraft = {
  showDate: string;
  showTime: string;
  hasHappened: boolean;
  isPast: boolean;
  venue: string;
  city: string;
  timeFrame: string;
  price: string;
  priceOnline: string;
  priceDoor: string;
  ticketUrl: string;
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

function optionalDraftValue(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function createInitialDraft(initialValues: Show | undefined): ShowDraft {
  const parsedDateTime = initialValues?.date
    ? parseISODateTime(initialValues.date)
    : { date: "", time: "" };

  return {
    showDate: parsedDateTime.date,
    showTime: parsedDateTime.time,
    hasHappened: initialValues?.hasHappened ?? false,
    isPast: initialValues?.hasHappened ?? false,
    venue: initialValues?.venue ?? "",
    city: initialValues?.city ?? "",
    timeFrame: initialValues?.timeFrame ?? "",
    price: initialValues?.price ?? "",
    priceOnline: initialValues?.priceOnline ?? "",
    priceDoor: initialValues?.priceDoor ?? "",
    ticketUrl: initialValues?.ticketUrl ?? "",
  };
}

function createDraftFromFormData(formData: FormData): ShowDraft {
  const showDate = String(formData.get("showDate") ?? "");
  const showTime = String(formData.get("showTime") ?? "");
  const hasHappened = formData.get("hasHappened") === "on";
  const combinedDate = showDate && showTime ? combineDateTime(showDate, showTime) : "";
  const parsedDate = combinedDate ? Date.parse(combinedDate) : Number.NaN;

  return {
    showDate,
    showTime,
    hasHappened,
    isPast: hasHappened || (!Number.isNaN(parsedDate) && parsedDate < Date.now()),
    venue: String(formData.get("venue") ?? ""),
    city: String(formData.get("city") ?? ""),
    timeFrame: String(formData.get("timeFrame") ?? ""),
    price: String(formData.get("price") ?? ""),
    priceOnline: String(formData.get("priceOnline") ?? ""),
    priceDoor: String(formData.get("priceDoor") ?? ""),
    ticketUrl: String(formData.get("ticketUrl") ?? ""),
  };
}

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

export function ShowForm({
  action,
  initialValues,
  labels,
  locale,
  submitLabel,
  uploadPrefix = "media/development/shows/",
}: ShowFormProps) {
  const [state, formAction] = useActionState(
    (previousState: AdminFormState, formData: FormData) =>
      submitAdminFormWithImage({ action, previousState, formData, uploadPrefix }),
    initialAdminFormState,
  );
  const hasHappenedId = useId();
  const hasHappenedHintId = useId();
  const previewHeadingId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [draft, setDraft] = useState<ShowDraft>(() => createInitialDraft(initialValues));
  const [previewImageUrl, setPreviewImageUrl] = useState<string | undefined>(
    initialValues?.imageUrl,
  );

  const parsedDateTime = {
    date: draft.showDate,
    time: draft.showTime,
  };

  const inputBase =
    "mt-2 min-h-11 w-full rounded-xl border bg-bg/60 px-4 py-3 text-sm text-text placeholder:text-text-dim";

  useEffect(() => {
    if (state.status === "error") {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }
  }, [state]);

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

  const handleDraftChange = (event: FormEvent<HTMLFormElement>) => {
    setDraft(createDraftFromFormData(new FormData(event.currentTarget)));
  };

  const previewShow: ShowCardDetails = {
    date:
      draft.showDate && draft.showTime
        ? combineDateTime(draft.showDate, draft.showTime)
        : "Choose a date and time",
    venue: optionalDraftValue(draft.venue) ?? "Venue name",
    city: optionalDraftValue(draft.city) ?? "City",
    timeFrame: optionalDraftValue(draft.timeFrame),
    price: optionalDraftValue(draft.price),
    priceOnline: optionalDraftValue(draft.priceOnline),
    priceDoor: optionalDraftValue(draft.priceDoor),
    ticketUrl: optionalDraftValue(draft.ticketUrl),
    imageUrl: previewImageUrl,
  };

  return (
    <form
      ref={formRef}
      action={handleFormAction}
      onChange={handleDraftChange}
      className="mt-6 grid gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:items-start"
    >
      {state.message ? (
        <p
          role="alert"
          className="rounded-xl border border-highlight/40 bg-highlight/10 px-4 py-3 text-sm text-highlight lg:col-span-2"
        >
          {state.message}
        </p>
      ) : null}

      {initialValues?.id ? <input type="hidden" name="id" value={initialValues.id} /> : null}

      <div className="grid min-w-0 gap-5 sm:gap-6">
        <fieldset className="grid gap-4 rounded-2xl border border-border/60 bg-bg/30 p-4 sm:grid-cols-2 sm:p-5">
          <legend className="mb-2 px-1 text-xs uppercase tracking-[0.3em] text-text-dim">
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

          <p className="text-xs text-text-dim sm:col-span-2">Timezone: SAST (UTC+02:00)</p>
        </fieldset>

        <fieldset className="rounded-2xl border border-border/60 bg-bg/30 p-4 sm:p-5">
          <legend className="px-1 text-xs uppercase tracking-[0.3em] text-text-dim">
            Show Status
          </legend>
          <div className="mt-3 flex items-start gap-3">
            <input
              id={hasHappenedId}
              name="hasHappened"
              type="checkbox"
              value="on"
              defaultChecked={initialValues?.hasHappened ?? false}
              aria-describedby={hasHappenedHintId}
              className="mt-0.5 h-4 w-4 rounded border border-border/70 bg-bg/60 accent-[var(--highlight)]"
            />
            <div className="min-w-0">
              <label htmlFor={hasHappenedId} className="block text-sm font-medium text-text">
                Already happened
              </label>
              <p id={hasHappenedHintId} className="mt-1 text-xs text-text-muted">
                Past dates are marked automatically. Use this to archive a show early.
              </p>
            </div>
          </div>
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
          Time Frame (optional)
          <input
            name="timeFrame"
            defaultValue={initialValues?.timeFrame ?? ""}
            className={`${inputBase} ${state.fieldErrors?.timeFrame ? "border-highlight/70" : "border-border/70"}`}
            placeholder="6pm - late or 6pm - 8pm"
            aria-invalid={Boolean(state.fieldErrors?.timeFrame)}
          />
          <FieldError message={state.fieldErrors?.timeFrame} />
          <p className="mt-2 text-xs text-text-dim">
            Freeform display text for the event window or running time.
          </p>
        </label>

        <fieldset className="grid gap-4 rounded-2xl border border-border/60 bg-bg/30 p-4 sm:grid-cols-2 sm:p-5">
          <legend className="px-1 text-xs uppercase tracking-[0.3em] text-text-dim">
            Ticket Pricing
          </legend>

          <label className="text-xs uppercase tracking-[0.3em] text-text-dim">
            Online Price (optional)
            <input
              name="priceOnline"
              defaultValue={initialValues?.priceOnline ?? ""}
              className={`${inputBase} ${state.fieldErrors?.priceOnline ? "border-highlight/70" : "border-border/70"} tabular-nums`}
              placeholder="R180 pre-sale"
              aria-invalid={Boolean(state.fieldErrors?.priceOnline)}
            />
            <FieldError message={state.fieldErrors?.priceOnline} />
          </label>

          <label className="text-xs uppercase tracking-[0.3em] text-text-dim">
            Door Price (optional)
            <input
              name="priceDoor"
              defaultValue={initialValues?.priceDoor ?? ""}
              className={`${inputBase} ${state.fieldErrors?.priceDoor ? "border-highlight/70" : "border-border/70"} tabular-nums`}
              placeholder="R220 at the door"
              aria-invalid={Boolean(state.fieldErrors?.priceDoor)}
            />
            <FieldError message={state.fieldErrors?.priceDoor} />
          </label>

          <p className="text-xs text-text-dim sm:col-span-2">
            Split prices will display with icons on the public shows page. If these are empty, the
            general price below is used as a fallback.
          </p>
        </fieldset>

        <label className="text-xs uppercase tracking-[0.3em] text-text-dim">
          General Price (optional fallback)
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
            type="url"
            inputMode="url"
            spellCheck={false}
            defaultValue={initialValues?.ticketUrl ?? ""}
            className={`${inputBase} ${state.fieldErrors?.ticketUrl ? "border-highlight/70" : "border-border/70"}`}
            placeholder="https://tickets.example.com/show"
            aria-invalid={Boolean(state.fieldErrors?.ticketUrl)}
          />
          <FieldError message={state.fieldErrors?.ticketUrl} />
        </label>

        <ImageUploadField
          label="Show photo (optional)"
          currentImageUrl={initialValues?.imageUrl}
          error={state.fieldErrors?.image}
          previewVariant="poster"
          onPreviewChange={setPreviewImageUrl}
        />
      </div>

      <aside
        aria-labelledby={previewHeadingId}
        className="min-w-0 border border-border/70 bg-bg/30 p-4 sm:p-5 lg:sticky lg:top-20"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-highlight">
          Live preview
        </p>
        <h3 id={previewHeadingId} className="mt-2 text-base font-semibold text-text">
          Public show card
        </h3>
        <p className="mt-2 text-xs leading-5 text-text-muted">
          This matches the show card visitors will see. Ticket links are disabled while editing.
        </p>
        <div className="mt-4">
          <ShowCard
            show={previewShow}
            locale={locale}
            labels={labels}
            isPast={draft.isPast}
            previewOnly
          />
        </div>
      </aside>

      <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-4 border border-border bg-surface/95 p-3 shadow-2xl sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none lg:col-start-1">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
