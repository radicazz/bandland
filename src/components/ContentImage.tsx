"use client";

import { useState } from "react";

type ContentImageProps = {
  src?: string | null;
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
  alt,
  className,
  fallbackClassName,
  fallbackLabel,
  loading = "lazy",
  decoding = "async",
}: ContentImageProps) {
  const [hasError, setHasError] = useState(isPlaceholderUrl(src));
  const isDecorative = alt.trim().length === 0;

  if (!src || hasError) {
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

  return (
    // Arbitrary admin/content URLs are supported, so native img is used intentionally here.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
    />
  );
}
