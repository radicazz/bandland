"use client";

import { useFormStatus } from "react-dom";

export const adminInputClassName =
  "mt-2 min-h-11 w-full rounded-xl border bg-bg/60 px-4 py-3 text-base text-text placeholder:text-text-dim";

export function SubmitButton({ label }: { label: string }) {
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

export function FieldError({ message }: { message: string | undefined }) {
  return message ? (
    <p className="mt-2 text-xs text-highlight" role="alert">
      {message}
    </p>
  ) : null;
}
