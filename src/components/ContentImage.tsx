"use client";

import Image from "next/image";
import { useState } from "react";
import { isManagedMediaUrl } from "@/config/media";

type ContentImageProps = {
  src?: string | null | undefined;
  alt: string;
  className: string;
  fallbackClassName: string;
  fallbackLabel: string;
  loading?: "eager" | "lazy";
  decoding?: "async" | "auto" | "sync";
  sizes?: string;
};

export function ContentImage({
  src,
  alt,
  className,
  fallbackClassName,
  fallbackLabel,
  loading = "lazy",
  decoding = "async",
  sizes = "(max-width: 768px) 100vw, 640px",
}: ContentImageProps) {
  const resolvedSrc = src;
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const isDecorative = alt.trim().length === 0;
  const supported =
    resolvedSrc?.startsWith("blob:") ||
    (resolvedSrc && /^\/(?![\/\\])/.test(resolvedSrc)) ||
    (resolvedSrc && isManagedMediaUrl(resolvedSrc, process.env.NEXT_PUBLIC_MEDIA_HOST));
  const hasError = !supported || failedSource === resolvedSrc;

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
      sizes={sizes}
      className={className}
      loading={loading}
      decoding={decoding}
      onError={() => setFailedSource(resolvedSrc ?? null)}
    />
  );
}
