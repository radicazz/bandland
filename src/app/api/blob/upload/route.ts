import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { ACCEPTED_MEDIA_TYPES, getMediaUploadPrefix, MAX_UPLOAD_BYTES } from "@/lib/media-store";
import { isReadOnlyDeployment } from "@/lib/runtime-environment";

export async function POST(request: Request) {
  const token = process.env.MEDIA_BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    return NextResponse.json({ error: "Media storage is not configured" }, { status: 503 });
  }
  const body = (await request.json()) as HandleUploadBody;

  try {
    const response = await handleUpload({
      request,
      body,
      token,
      onBeforeGenerateToken: async (pathname) => {
        const session = await auth();
        if (!session) throw new Error("Unauthorized");
        if (isReadOnlyDeployment()) throw new Error("Preview deployments are read-only");

        const allowedPrefixes = [getMediaUploadPrefix("shows"), getMediaUploadPrefix("merch")];
        const matchedPrefix = allowedPrefixes.find((prefix) => pathname.startsWith(prefix));
        const fileName = matchedPrefix ? pathname.slice(matchedPrefix.length) : "";
        if (
          !matchedPrefix ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}-[a-z0-9._-]+$/i.test(
            fileName,
          )
        ) {
          throw new Error("Invalid upload location");
        }

        return {
          allowedContentTypes: [...ACCEPTED_MEDIA_TYPES],
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
          allowOverwrite: false,
          cacheControlMaxAge: 31_536_000,
        };
      },
      onUploadCompleted: async () => undefined,
    });

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload request failed";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
