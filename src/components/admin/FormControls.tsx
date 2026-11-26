"use client";

export const adminInputClassName =
  "mt-2 min-h-11 w-full border-2 bg-bg px-4 py-3 text-base text-text placeholder:text-text-dim";

export function SubmitButton({ label, pending }: { label: string; pending: boolean }) {
  return (
    <button
      type="submit"
      className="btn-zine-red min-w-[10rem] w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
    >
      {pending ? "Saving..." : label}
    </button>
  );
}

export function FieldError({ message }: { message: string | undefined }) {
  return message ? (
    <p className="mt-2 text-xs font-semibold text-highlight" role="alert">
      {message}
    </p>
  ) : null;
}
