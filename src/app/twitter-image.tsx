import { ImageResponse } from "next/og";

import { embed, getPublicUrl } from "@/config/embed";
import { site } from "@/config/site";

export const runtime = "edge";

export const size = {
  width: embed.twitter.width,
  height: embed.twitter.height,
};

export const contentType = "image/png";

export default function TwitterImage() {
  const heroImage = getPublicUrl(embed.twitter.path);
  const logo = getPublicUrl(embed.logoPath);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        padding: 72,
        alignItems: "center",
        justifyContent: "space-between",
        gap: 40,
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
            "linear-gradient(145deg, rgba(6,6,6,0.78) 0%, rgba(6,6,6,0.62) 50%, rgba(6,6,6,0.88) 100%)",
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 740 }}>
        <div
          style={{
            display: "flex",
            fontSize: 18,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#B7B7B7",
          }}
        >
          {site.name}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 78,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "#F2F2F2",
          }}
        >
          Official site
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 30,
            lineHeight: 1.35,
            color: "#B7B7B7",
          }}
        >
          {site.description}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 188,
          height: 188,
          borderRadius: 24,
          overflow: "hidden",
          border: "1px solid rgba(242,242,242,0.35)",
          background: "rgba(15,15,16,0.65)",
        }}
      >
        <img
          src={logo}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "contain", padding: 20 }}
        />
      </div>
    </div>,
    size,
  );
}
