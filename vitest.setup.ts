import "@testing-library/jest-dom/vitest";
import React from "react";
import { vi } from "vitest";

vi.mock("next/image", () => {
  return {
    default: ({
      priority,
      ...props
    }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => {
      void priority;
      return React.createElement("img", props);
    },
  };
});

vi.mock("next/link", () => {
  return {
    default: ({
      children,
      href,
      ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
      children: React.ReactNode;
      href: string;
    }) => {
      return React.createElement("a", { ...props, href }, children);
    },
  };
});
