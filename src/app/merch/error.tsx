"use client";

import { ErrorState, type ErrorStateProps } from "@/components/ErrorState";

export default function Error(props: ErrorStateProps) {
  return <ErrorState {...props} scope="merch" />;
}
