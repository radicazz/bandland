import { ImageResponse } from "next/og";

import { site } from "@/config/site";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        background: "#060606",
        color: "#F2F2F2",
        width: "100%",
        height: "100%",
        display: "flex",
        padding: 80,
        alignItems: "flex-end",
        justifyContent: "space-between",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Arial",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
        <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: "-0.02em" }}>{site.name}</div>
        <div style={{ fontSize: 26, lineHeight: 1.4, maxWidth: 820, color: "#B7B7B7" }}>
          {site.description}
        </div>
      </div>
      <div
        style={{
          width: 220,
          height: 220,
          borderRadius: 9999,
          border: "1px solid rgba(242,242,242,0.18)",
          background:
            "radial-gradient(circle at 30% 20%, rgba(230,226,218,0.20), rgba(6,6,6,0) 60%)",
        }}
      />
    </div>,
    size,
  );
}
