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
  it("reorders, hides and resizes widgets and submits the result", () => {
    const { container } = render(
      <WidgetOrderEditor initialWidgets={getDefaultSettings().widgets} />,
    );

    expect(screen.getByRole("button", { name: "Move Next show up" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Move Next show down" }));
    expect(readValue(container).map((widget) => widget.id)).toEqual([
      "release",
      "nextShow",
      "merch",
    ]);
    expect(screen.getByRole("status")).toHaveTextContent("Next show moved to position 2 of 3");

    fireEvent.click(screen.getAllByRole("checkbox")[2] as HTMLElement);
    fireEvent.change(screen.getAllByRole("combobox")[0] as HTMLElement, {
      target: { value: "full" },
    });
    const value = readValue(container);
    expect(value[2]).toMatchObject({ id: "merch", enabled: false });
    expect(value[0]).toMatchObject({ id: "release", width: "full" });
  });
});
