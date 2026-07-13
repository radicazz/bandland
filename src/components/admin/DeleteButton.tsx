"use client";

import { useId, useRef } from "react";
import { useFormStatus } from "react-dom";

type DeleteButtonProps = {
  label?: string;
  confirmMessage?: string;
};

export function DeleteButton({
  label = "Delete",
  confirmMessage = "Are you sure you want to delete this item?",
}: DeleteButtonProps) {
  const { pending } = useFormStatus();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  return (
    <>
      <button
        type="button"
        className="btn-secondary w-full sm:w-auto"
        onClick={() => dialogRef.current?.showModal()}
        disabled={pending}
      >
        {label}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="m-auto w-[calc(100%-2rem)] max-w-md border border-border bg-surface p-0 text-text backdrop:bg-bg/80"
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current.close();
        }}
      >
        <div className="p-5 sm:p-6">
          <p className="section-kicker">Confirm</p>
          <h2 id={titleId} className="mt-5 text-xl font-semibold text-text">
            Delete permanently?
          </h2>
          <p className="mt-3 text-sm leading-6 text-text-muted">{confirmMessage}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => dialogRef.current?.close()}
            >
              Keep it
            </button>
            <button type="submit" className="btn-primary" disabled={pending}>
              {pending ? "Deleting…" : "Yes, delete"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
