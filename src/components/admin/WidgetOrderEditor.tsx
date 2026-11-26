"use client";

import { useState } from "react";

import type { WidgetId, WidgetSetting } from "@/content/schema";

export const WIDGET_LABELS: Record<WidgetId, { name: string; hint: string }> = {
  nextShow: { name: "Next show", hint: "Upcoming dates and tickets" },
  release: { name: "Latest release", hint: "Fixed position after the hero" },
  merch: { name: "Merch link", hint: "Featured products and a link to the store" },
};

type WidgetOrderEditorProps = {
  initialWidgets: WidgetSetting[];
};

export function WidgetOrderEditor({ initialWidgets }: WidgetOrderEditorProps) {
  const [widgets, setWidgets] = useState(() =>
    [...initialWidgets].sort((a, b) => Number(b.id === "release") - Number(a.id === "release")),
  );
  const [announcement, setAnnouncement] = useState("");

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 1 || target >= widgets.length) return;
    const next = [...widgets];
    const [moved] = next.splice(index, 1);
    if (!moved) return;
    next.splice(target, 0, moved);
    setWidgets(next);
    setAnnouncement(
      `${WIDGET_LABELS[moved.id].name} moved to position ${target + 1} of ${next.length}`,
    );
  };

  const update = (id: WidgetId, patch: Partial<WidgetSetting>) =>
    setWidgets((current) =>
      current.map((widget) => (widget.id === id ? { ...widget, ...patch } : widget)),
    );

  return (
    <div>
      <input type="hidden" name="widgets" value={JSON.stringify(widgets)} />
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <ol className="grid gap-3">
        {widgets.map((widget, index) => {
          const { name, hint } = WIDGET_LABELS[widget.id];
          return (
            <li
              key={widget.id}
              className={`border-2 p-4 ${
                widget.enabled ? "border-text" : "border-dashed border-text-dim"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-text">
                    <span className="mr-2 tabular-nums text-text-dim">{index + 1}.</span>
                    {name}
                  </p>
                  <p className="mt-1 text-sm text-text-muted">{hint}</p>
                </div>
                {widget.id !== "release" ? (
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 1}
                      aria-label={`Move ${name} up`}
                      className="flex h-11 w-11 items-center justify-center border-2 border-text bg-bg text-text enabled:hover:bg-text enabled:hover:text-bg disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span aria-hidden>↑</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === widgets.length - 1}
                      aria-label={`Move ${name} down`}
                      className="flex h-11 w-11 items-center justify-center border-2 border-text bg-bg text-text enabled:hover:bg-text enabled:hover:text-bg disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span aria-hidden>↓</span>
                    </button>
                  </div>
                ) : null}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
                <label className="flex min-h-11 items-center gap-3 text-base text-text">
                  <input
                    type="checkbox"
                    checked={widget.enabled}
                    onChange={(event) => update(widget.id, { enabled: event.target.checked })}
                    className="h-5 w-5 accent-[var(--highlight)]"
                  />
                  Show on home page
                </label>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
