"use client";

import { useState } from "react";

type ContentImageProps = {
  src?: string | null | undefined;
  imageId?: string | null | undefined;
  alt: string;
  className: string;
  fallbackClassName: string;
  fallbackLabel: string;
  loading?: "eager" | "lazy";
  decoding?: "async" | "auto" | "sync";
};

export function isPlaceholderUrl(value: string | null | undefined) {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return host === "example.com" || host.endsWith(".example.com");
  } catch {
    return true;
  }
}

export function ContentImage({
  src,
  imageId,
  alt,
  className,
  fallbackClassName,
  fallbackLabel,
  loading = "lazy",
  decoding = "async",
}: ContentImageProps) {
  const resolvedSrc = imageId ? `/media/${imageId}/1280.webp` : src;
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const isDecorative = alt.trim().length === 0;
  const hasError = failedSource === resolvedSrc || (!imageId && isPlaceholderUrl(resolvedSrc));

  if (!resolvedSrc || hasError) {
    return (
      <div
        className={fallbackClassName}
        {...(isDecorative ? { "aria-hidden": true } : { role: "img", "aria-label": alt })}
      >
        <span className="px-3 text-center text-[11px] uppercase tracking-[0.22em] text-text-dim">
          {fallbackLabel}
        </span>
      </div>
    );
  }

  const image = (
    // Legacy admin/content URLs require a native image element.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      referrerPolicy={imageId ? undefined : "no-referrer"}
      onError={() => setFailedSource(resolvedSrc ?? null)}
    />
  );

  if (!imageId) {
    return image;
  }

  return (
    <picture>
      <source
        type="image/webp"
        srcSet={`/media/${imageId}/640.webp 640w, /media/${imageId}/1280.webp 1280w`}
        sizes="(max-width: 768px) 100vw, 640px"
      />
      {image}
    </picture>
  );
}
