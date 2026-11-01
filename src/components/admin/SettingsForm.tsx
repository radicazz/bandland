"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";

import { adminInputClassName as inputBase, FieldError } from "@/components/admin/FormControls";
import { WidgetOrderEditor } from "@/components/admin/WidgetOrderEditor";
import { SOCIAL_PLATFORMS, type SiteSettings } from "@/content/schema";
import { initialAdminFormState, type AdminFormState } from "@/lib/admin-form-state";

type SettingsFormProps = {
  action: (prevState: AdminFormState, formData: FormData) => Promise<AdminFormState>;
  settings: SiteSettings;
};

const labelClass = "text-sm font-medium text-text-muted";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="grid gap-5 rounded-2xl border border-border bg-surface p-4 sm:p-6">
      <legend className="px-2 text-lg font-semibold text-text">{title}</legend>
      {description ? <p className="-mt-2 text-sm text-text-muted">{description}</p> : null}
      {children}
    </fieldset>
  );
}

export function SettingsForm({ action, settings }: SettingsFormProps) {
  const [state, formAction, isActionPending] = useActionState(action, initialAdminFormState);
  const [isTransitionPending, startTransition] = useTransition();
  const isPending = isActionPending || isTransitionPending;
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state.fieldErrors ?? {};
  const inputClass = (key: string) =>
    `${inputBase} ${errors[key] ? "border-highlight/70" : "border-border/70"}`;

  useEffect(() => {
    if (state.status === "error") {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }
  }, [state]);

  // Submitting through a transition (instead of the form `action` prop) stops React from
  // resetting the fields, so edits survive a validation error.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mt-6 grid gap-6">
      {state.message ? (
        <p
          role="alert"
          className="rounded-xl border border-highlight/40 bg-highlight/10 px-4 py-3 text-sm text-highlight"
        >
          {state.message}
        </p>
      ) : null}

      <Section
        title="Home page widgets"
        description="Choose which blocks appear on the home page, their order, and whether they sit side by side or span the full width. On phones they always stack in this order."
      >
        <WidgetOrderEditor initialWidgets={settings.widgets} />
        <FieldError message={errors.widgets} />
      </Section>

      <Section
        title="Latest release"
        description="Shown in the Latest release widget. The hero Listen button links to the release link."
      >
        <label className={labelClass}>
          Title
          <input
            name="releaseTitle"
            required
            defaultValue={settings.release.title}
            className={inputClass("release.title")}
            aria-invalid={Boolean(errors["release.title"])}
          />
          <FieldError message={errors["release.title"]} />
        </label>
        <label className={labelClass}>
          Description (optional)
          <input
            name="releaseDescription"
            defaultValue={settings.release.description ?? ""}
            className={inputClass("release.description")}
            placeholder="Leave empty to use the default text"
            aria-invalid={Boolean(errors["release.description"])}
          />
          <FieldError message={errors["release.description"]} />
        </label>
        <label className={labelClass}>
          Listen link
          <input
            name="releaseHref"
            type="url"
            inputMode="url"
            spellCheck={false}
            required
            defaultValue={settings.release.href}
            className={inputClass("release.href")}
            placeholder="https://..."
            aria-invalid={Boolean(errors["release.href"])}
          />
          <FieldError message={errors["release.href"]} />
        </label>
        <label className={labelClass}>
          Music player link (optional)
          <input
            name="releaseEmbedUrl"
            type="url"
            inputMode="url"
            spellCheck={false}
            defaultValue={settings.release.embedUrl ?? ""}
            className={inputClass("release.embedUrl")}
            placeholder="Paste a Spotify or Apple Music link"
            aria-invalid={Boolean(errors["release.embedUrl"])}
          />
          <span className="mt-2 block text-sm text-text-dim">
            A normal Spotify track, album or playlist link works. Leave empty to show a Listen
            button instead of a player.
          </span>
          <FieldError message={errors["release.embedUrl"]} />
        </label>
      </Section>

      <Section title="Hero">
        <label className={labelClass}>
          Tagline (optional)
          <input
            name="heroTagline"
            defaultValue={settings.hero.tagline ?? ""}
            className={inputClass("hero.tagline")}
            placeholder="Leave empty to use the translated default"
            aria-invalid={Boolean(errors["hero.tagline"])}
          />
          <span className="mt-2 block text-sm text-text-dim">
            A custom tagline is shown in every language.
          </span>
          <FieldError message={errors["hero.tagline"]} />
        </label>
      </Section>

      <Section title="Footer and contact">
        <label className={labelClass}>
          Booking and press email
          <input
            name="contactEmail"
            type="email"
            inputMode="email"
            required
            defaultValue={settings.footer.contactEmail}
            className={inputClass("footer.contactEmail")}
            aria-invalid={Boolean(errors["footer.contactEmail"])}
          />
          <FieldError message={errors["footer.contactEmail"]} />
        </label>
        <label className={labelClass}>
          Footer tagline (optional)
          <input
            name="footerTagline"
            defaultValue={settings.footer.tagline ?? ""}
            className={inputClass("footer.tagline")}
            placeholder="Leave empty to use the translated default"
            aria-invalid={Boolean(errors["footer.tagline"])}
          />
          <FieldError message={errors["footer.tagline"]} />
        </label>
      </Section>

      <Section
        title="Social links"
        description="Shown in the header menu and footer. Leave a field empty to hide that link."
      >
        {SOCIAL_PLATFORMS.map((platform) => {
          const key = `social:${platform}`;
          return (
            <label key={platform} className={labelClass}>
              {platform}
              <input
                name={key}
                type="url"
                inputMode="url"
                spellCheck={false}
                defaultValue={
                  settings.socials.find((social) => social.label === platform)?.href ?? ""
                }
                className={inputClass(key)}
                placeholder="https://..."
                aria-invalid={Boolean(errors[key])}
              />
              <FieldError message={errors[key]} />
            </label>
          );
        })}
      </Section>

      <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-3 shadow-2xl sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary min-w-[10rem] w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "Saving..." : "Save settings"}
        </button>
      </div>
    </form>
  );
}
