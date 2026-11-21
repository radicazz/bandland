import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { WidgetOrderEditor } from "@/components/admin/WidgetOrderEditor";
import { getDefaultSettings } from "@/content/settings-defaults";

afterEach(cleanup);

function readValue(container: HTMLElement) {
  const input = container.querySelector<HTMLInputElement>('input[name="widgets"]');
  return JSON.parse(input?.value ?? "[]") as { id: string; enabled: boolean; width: string }[];
}

describe("WidgetOrderEditor", () => {
  it("pins release and reorders other widgets without changing stored widths", () => {
    const { container } = render(
      <WidgetOrderEditor initialWidgets={getDefaultSettings().widgets} />,
    );

    const initialWidths = Object.fromEntries(
      readValue(container).map(({ id, width }) => [id, width]),
    );
    expect(
      screen.queryByRole("button", { name: "Move Latest release down" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Move Next show up" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Move Next show down" }));
    expect(screen.getByRole("status")).toHaveTextContent("Next show moved to position 3 of 3");

    fireEvent.click(screen.getAllByRole("checkbox")[1] as HTMLElement);
    const value = readValue(container);
    expect(value.map((widget) => widget.id)).toEqual(["release", "merch", "nextShow"]);
    expect(value[1]).toMatchObject({ id: "merch", enabled: false });
    expect(Object.fromEntries(value.map(({ id, width }) => [id, width]))).toEqual(initialWidths);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
