"use client";

import Image from "next/image";
import { useState } from "react";

type ContentImageProps = {
  src?: string | null | undefined;
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
  const resolvedSrc = src;
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const isDecorative = alt.trim().length === 0;
  const hasError = failedSource === resolvedSrc || isPlaceholderUrl(resolvedSrc);

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

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      width={1280}
      height={960}
      sizes="(max-width: 768px) 100vw, 640px"
      className={className}
      loading={loading}
      decoding={decoding}
      onError={() => setFailedSource(resolvedSrc ?? null)}
    />
  );
}
