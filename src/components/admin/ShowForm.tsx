"use client";

import {
  startTransition,
  type FormEvent,
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { ShowCard, type ShowCardDetails } from "@/components/ShowCard";
import {
  adminInputClassName as inputBase,
  FieldError,
  SubmitButton,
} from "@/components/admin/FormControls";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import type { Show } from "@/content/schema";
import type { Locale, Translations } from "@/i18n/translations";
import { initialAdminFormState, type AdminFormState } from "@/lib/admin-form-state";
import { combineShowDateTime, getShowDateTimeFields } from "@/lib/formatters";
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

function optionalDraftValue(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function createInitialDraft(initialValues: Show | undefined): ShowDraft {
  const parsedDateTime = initialValues?.date
    ? getShowDateTimeFields(initialValues.date)
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
  const combinedDate = showDate && showTime ? combineShowDateTime(showDate, showTime) : "";
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

export function ShowForm({
  action,
  initialValues,
  labels,
  locale,
  submitLabel,
  uploadPrefix = "media/development/shows/",
}: ShowFormProps) {
  const [state, formAction, pending] = useActionState(
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

  useEffect(() => {
    if (state.status === "error") {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }
  }, [state]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const formData = new FormData(event.currentTarget);
    const date = formData.get("showDate") as string;
    const time = formData.get("showTime") as string;

    if (date && time) {
      const combinedDateTime = combineShowDateTime(date, time);
      formData.set("date", combinedDateTime);
    }

    formData.delete("showDate");
    formData.delete("showTime");

    startTransition(() => formAction(formData));
  };

  const handleDraftChange = (event: FormEvent<HTMLFormElement>) => {
    setDraft(createDraftFromFormData(new FormData(event.currentTarget)));
  };

  const previewShow: ShowCardDetails = {
    date:
      draft.showDate && draft.showTime
        ? combineShowDateTime(draft.showDate, draft.showTime)
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
      onSubmit={handleSubmit}
      onChange={handleDraftChange}
      className="mt-6 grid gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:items-start"
    >
      {state.message ? (
        <p
          role="alert"
          className="border-2 border-highlight bg-bg px-4 py-3 text-sm font-semibold text-highlight lg:col-span-2"
        >
          {state.message}
        </p>
      ) : null}

      {initialValues?.id ? <input type="hidden" name="id" value={initialValues.id} /> : null}

      <div className="grid min-w-0 gap-5 sm:gap-6">
        <fieldset className="grid gap-4 border-2 border-text p-4 sm:grid-cols-2 sm:p-5">
          <legend className="mb-2 px-1 text-sm font-bold text-text">Show Date & Time</legend>

          <label className="text-sm font-medium text-text-muted">
            Date
            <input
              type="date"
              name="showDate"
              required
              defaultValue={parsedDateTime.date}
              className={`${inputBase} ${state.fieldErrors?.date ? "border-highlight" : "border-text"} tabular-nums`}
              aria-invalid={Boolean(state.fieldErrors?.date)}
            />
          </label>

          <label className="text-sm font-medium text-text-muted">
            Time
            <input
              type="time"
              name="showTime"
              required
              defaultValue={parsedDateTime.time}
              className={`${inputBase} ${state.fieldErrors?.date ? "border-highlight" : "border-text"} tabular-nums`}
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

        <fieldset className="border-2 border-text p-4 sm:p-5">
          <legend className="px-1 text-sm font-bold text-text">Show Status</legend>
          <div className="mt-3 flex items-start gap-3">
            <input
              id={hasHappenedId}
              name="hasHappened"
              type="checkbox"
              value="on"
              defaultChecked={initialValues?.hasHappened ?? false}
              aria-describedby={hasHappenedHintId}
              className="mt-0.5 h-4 w-4 accent-[var(--highlight)]"
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

        <label className="text-sm font-medium text-text-muted">
          Venue
          <input
            name="venue"
            required
            defaultValue={initialValues?.venue ?? ""}
            className={`${inputBase} ${state.fieldErrors?.venue ? "border-highlight" : "border-text"}`}
            placeholder="The Waiting Room"
            aria-invalid={Boolean(state.fieldErrors?.venue)}
          />
          <FieldError message={state.fieldErrors?.venue} />
        </label>

        <label className="text-sm font-medium text-text-muted">
          City
          <input
            name="city"
            required
            defaultValue={initialValues?.city ?? ""}
            className={`${inputBase} ${state.fieldErrors?.city ? "border-highlight" : "border-text"}`}
            placeholder="Cape Town, WC"
            aria-invalid={Boolean(state.fieldErrors?.city)}
          />
          <FieldError message={state.fieldErrors?.city} />
        </label>

        <label className="text-sm font-medium text-text-muted">
          Time Frame (optional)
          <input
            name="timeFrame"
            defaultValue={initialValues?.timeFrame ?? ""}
            className={`${inputBase} ${state.fieldErrors?.timeFrame ? "border-highlight" : "border-text"}`}
            placeholder="6pm - late or 6pm - 8pm"
            aria-invalid={Boolean(state.fieldErrors?.timeFrame)}
          />
          <FieldError message={state.fieldErrors?.timeFrame} />
          <p className="mt-2 text-xs text-text-dim">
            Freeform display text for the event window or running time.
          </p>
        </label>

        <fieldset className="grid gap-4 border-2 border-text p-4 sm:grid-cols-2 sm:p-5">
          <legend className="px-1 text-sm font-bold text-text">Ticket Pricing</legend>

          <label className="text-sm font-medium text-text-muted">
            Online Price (optional)
            <input
              name="priceOnline"
              defaultValue={initialValues?.priceOnline ?? ""}
              className={`${inputBase} ${state.fieldErrors?.priceOnline ? "border-highlight" : "border-text"} tabular-nums`}
              placeholder="R180 pre-sale"
              aria-invalid={Boolean(state.fieldErrors?.priceOnline)}
            />
            <FieldError message={state.fieldErrors?.priceOnline} />
          </label>

          <label className="text-sm font-medium text-text-muted">
            Door Price (optional)
            <input
              name="priceDoor"
              defaultValue={initialValues?.priceDoor ?? ""}
              className={`${inputBase} ${state.fieldErrors?.priceDoor ? "border-highlight" : "border-text"} tabular-nums`}
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

        <label className="text-sm font-medium text-text-muted">
          General Price (optional fallback)
          <input
            name="price"
            defaultValue={initialValues?.price ?? ""}
            className={`${inputBase} ${state.fieldErrors?.price ? "border-highlight" : "border-text"} tabular-nums`}
            placeholder="R200 or Free"
            aria-invalid={Boolean(state.fieldErrors?.price)}
          />
          <FieldError message={state.fieldErrors?.price} />
        </label>

        <label className="text-sm font-medium text-text-muted">
          Ticket URL (optional)
          <input
            name="ticketUrl"
            type="url"
            inputMode="url"
            spellCheck={false}
            defaultValue={initialValues?.ticketUrl ?? ""}
            className={`${inputBase} ${state.fieldErrors?.ticketUrl ? "border-highlight" : "border-text"}`}
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
        className="min-w-0 border-2 border-dashed border-text p-4 sm:p-5 lg:sticky lg:top-20"
      >
        <p className="kicker text-highlight">Live preview</p>
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

      <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-4 border-2 border-text bg-bg p-3 sm:static sm:border-0 sm:bg-transparent sm:p-0 lg:col-start-1">
        <SubmitButton label={submitLabel} pending={pending} />
      </div>
    </form>
  );
}
