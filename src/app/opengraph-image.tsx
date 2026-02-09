import { ImageResponse } from "next/og";

import { embed, getPublicUrl } from "@/config/embed";
import { site } from "@/config/site";

export const runtime = "edge";

export const size = {
  width: embed.og.width,
  height: embed.og.height,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  const heroImage = getPublicUrl(embed.og.path);
  const logo = getPublicUrl(embed.logoPath);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Arial",
      }}
    >
      <img
        src={heroImage}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background:
            "linear-gradient(180deg, rgba(6,6,6,0.25) 0%, rgba(6,6,6,0.85) 65%, rgba(6,6,6,0.95) 100%)",
        }}
      />
      <div
        style={{
          display: "flex",
          width: "100%",
          padding: 72,
          marginTop: "auto",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 28,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            maxWidth: 780,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 20,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "rgba(242,242,242,0.82)",
            }}
          >
            {site.name}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 74,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#F2F2F2",
            }}
          >
            Music, shows, merch.
          </div>
          <div style={{ display: "flex", fontSize: 28, lineHeight: 1.35, color: "#B7B7B7" }}>
            {site.description}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 196,
            height: 196,
            borderRadius: 24,
            overflow: "hidden",
            border: "1px solid rgba(242,242,242,0.35)",
            background: "rgba(15,15,16,0.65)",
          }}
        >
          <img
            src={logo}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "contain", padding: 22 }}
          />
        </div>
      </div>
    </div>,
    size,
  );
}
