import type { NextConfig } from "next";
import { getMediaHost } from "./src/config/media";

const mediaHost = getMediaHost(process.env.MEDIA_BLOB_READ_WRITE_TOKEN);
const mediaOrigin = mediaHost ? ` https://${mediaHost}` : "";

const reportOnlyPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  // Next hydration and the inline boot script currently use inline scripts.
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${mediaOrigin}`,
  "font-src 'self'",
  "media-src 'self' blob:",
  `connect-src 'self' https://vercel.com${mediaOrigin}`,
  "frame-src https://open.spotify.com https://embed.music.apple.com",
  "worker-src 'self' blob:",
].join("; ");

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_MEDIA_HOST: mediaHost ?? "" },
  images: {
    formats: ["image/avif", "image/webp"],
    maximumRedirects: 0,
    maximumResponseBody: 10 * 1024 * 1024,
    remotePatterns: mediaHost
      ? [{ protocol: "https", hostname: mediaHost, port: "", pathname: "/media/**", search: "" }]
      : [],
  },
  async headers() {
    if (process.env.NODE_ENV === "development") return [];
    return [
      {
        source: "/:path*",
        headers: [{ key: "Content-Security-Policy-Report-Only", value: reportOnlyPolicy }],
      },
    ];
  },
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
