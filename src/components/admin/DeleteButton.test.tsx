import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DeleteButton } from "./DeleteButton";

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("DeleteButton", () => {
  it("opens an accessible dialog and cancels without submitting", () => {
    const submit = vi.fn();
    render(
      <form onSubmit={submit}>
        <DeleteButton confirmMessage="Delete the show?" />
      </form>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByRole("dialog", { name: "Delete permanently?" })).toBeInTheDocument();
    expect(screen.getByText("Delete the show?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Keep it" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
  });

  it("submits only after destructive confirmation", () => {
    const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={submit}>
        <DeleteButton />
      </form>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes, delete" }));

    expect(submit).toHaveBeenCalledOnce();
  });
});
