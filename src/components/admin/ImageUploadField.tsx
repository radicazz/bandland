"use client";

import { useEffect, useId, useState } from "react";

import { ContentImage } from "@/components/ContentImage";

type ImageUploadFieldProps = {
  currentImageUrl?: string | undefined;
  error?: string | undefined;
  label: string;
};

export function ImageUploadField({ currentImageUrl, error, label }: ImageUploadFieldProps) {
  const inputId = useId();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [removeCurrent, setRemoveCurrent] = useState(false);
  const hasCurrent = Boolean(currentImageUrl);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  return (
    <fieldset className="border border-border/70 bg-bg/30 p-4 sm:p-5">
      <legend className="px-1 text-xs font-bold uppercase tracking-[0.24em] text-text-dim">
        {label}
      </legend>
      <label
        htmlFor={inputId}
        className="mt-3 flex min-h-32 cursor-pointer flex-col items-center justify-center border border-dashed border-border bg-surface/50 px-5 py-6 text-center transition-colors hover:border-highlight focus-within:border-highlight"
      >
        <span className="text-sm font-semibold text-text">
          {fileName ?? (hasCurrent ? "Replace photo" : "Choose a photo")}
        </span>
        <span className="mt-2 text-xs leading-5 text-text-muted">
          JPEG, PNG, or WebP · maximum 10 MB · optimized by Vercel
        </span>
        <input
          id={inputId}
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          aria-invalid={Boolean(error)}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            if (!file) {
              setPreviewUrl(null);
              setFileName(null);
              return;
            }
            setPreviewUrl(URL.createObjectURL(file));
            setFileName(file.name);
            setRemoveCurrent(false);
          }}
        />
      </label>

      {error ? (
        <p className="mt-2 text-xs text-highlight" role="alert">
          {error}
        </p>
      ) : null}

      {previewUrl ? (
        <div className="mt-4 overflow-hidden border border-border bg-bg/60">
          {/* Browser-generated object URLs need a native image element. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="New upload preview" className="h-48 w-full object-cover" />
        </div>
      ) : hasCurrent && !removeCurrent ? (
        <div className="mt-4 overflow-hidden border border-border bg-bg/60">
          <ContentImage
            src={currentImageUrl}
            alt="Current image"
            className="h-48 w-full object-cover"
            fallbackClassName="flex h-48 w-full items-center justify-center bg-surface/50"
            fallbackLabel="Current image unavailable"
          />
        </div>
      ) : null}

      {hasCurrent && !previewUrl ? (
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-text-muted">
            {removeCurrent ? "Photo will be removed when saved." : "Current photo"}
          </p>
          <button
            type="button"
            className="min-h-10 border border-border px-3 text-xs font-bold uppercase tracking-[0.18em] text-text-muted hover:border-highlight hover:text-highlight"
            onClick={() => setRemoveCurrent((current) => !current)}
          >
            {removeCurrent ? "Keep photo" : "Remove"}
          </button>
        </div>
      ) : null}
      {removeCurrent ? <input type="hidden" name="removeImage" value="true" /> : null}
    </fieldset>
  );
}
