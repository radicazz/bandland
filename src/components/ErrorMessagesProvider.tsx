"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Translations } from "@/i18n/translations";

const ErrorMessages = createContext<Translations["errors"] | null>(null);

export function ErrorMessagesProvider({
  labels,
  children,
}: {
  labels: Translations["errors"];
  children: ReactNode;
}) {
  return <ErrorMessages value={labels}>{children}</ErrorMessages>;
}

export function useErrorMessages() {
  const labels = useContext(ErrorMessages);
  if (!labels) throw new Error("ErrorState requires ErrorMessagesProvider.");
  return labels;
}
