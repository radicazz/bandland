"use client";

import { useId, useState } from "react";

type PasswordFieldProps = {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
};

export function PasswordField({
  name,
  label,
  placeholder,
  required = false,
  autoComplete,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const inputId = useId();

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-bold text-text">
        {label}
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          id={inputId}
          name={name}
          type={isVisible ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          className="w-full flex-1 border-2 border-text bg-bg px-4 py-3 text-sm text-text placeholder:text-text-dim"
          placeholder={placeholder}
        />
        <button
          type="button"
          aria-controls={inputId}
          aria-pressed={isVisible}
          aria-label={isVisible ? "Hide password" : "Show password"}
          onClick={() => setIsVisible((current) => !current)}
          className="min-h-11 w-full border-2 border-text bg-bg px-4 text-sm font-bold text-text transition-colors hover:bg-text hover:text-bg sm:min-w-[5.5rem] sm:w-auto"
        >
          {isVisible ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}
