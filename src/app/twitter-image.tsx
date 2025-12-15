import { ImageResponse } from "next/og";

import { site } from "@/config/site";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 600,
};

export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    <div
      style={{
        background: "#060606",
        color: "#F2F2F2",
        width: "100%",
        height: "100%",
        display: "flex",
        padding: 80,
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Arial",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18, textAlign: "center" }}>
        <div
          style={{
            fontSize: 18,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#7A7A7A",
          }}
        >
          Under construction
        </div>
        <div style={{ fontSize: 90, fontWeight: 700, letterSpacing: "-0.02em" }}>{site.name}</div>
      </div>
    </div>,
    size,
  );
}
