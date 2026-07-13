import { promises as fs } from "node:fs";
import { NextResponse } from "next/server";

import { getMediaPath, MEDIA_SIZES, type MediaSize } from "@/lib/media-store";

export const runtime = "nodejs";

type MediaRouteProps = {
  params: Promise<{ imageId: string; size: string }>;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, { params }: MediaRouteProps) {
  const { imageId, size: rawSize } = await params;
  const sizeValue = Number(rawSize.replace(/\.webp$/i, ""));
  if (!uuidPattern.test(imageId) || !MEDIA_SIZES.includes(sizeValue as MediaSize)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const image = await fs.readFile(getMediaPath(imageId, sizeValue as MediaSize));
    return new NextResponse(image, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": "image/webp",
        "Content-Length": String(image.byteLength),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return new NextResponse("Not found", { status: 404 });
    }
    return new NextResponse("Unable to load image", { status: 500 });
  }
}
