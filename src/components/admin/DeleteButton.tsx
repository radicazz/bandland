"use client";

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

  return (
    <button
      type="submit"
      className="btn-primary w-full sm:w-auto"
      onClick={(event) => {
        if (!confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      disabled={pending}
    >
      {pending ? "Deleting..." : label}
    </button>
  );
}
