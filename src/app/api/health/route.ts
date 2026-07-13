import { NextResponse } from "next/server";

import { getSiteOperationsSummary } from "@/lib/site-operations";

export async function GET() {
  try {
    const summary = await getSiteOperationsSummary();
    const mediaReady = summary.paths.mediaRoot.writable && summary.paths.mediaHistoryRoot.writable;
    const isHealthy = summary.content.allValid && (!summary.environment.isProduction || mediaReady);
    const statusCode = isHealthy ? 200 : 503;

    return NextResponse.json(
      {
        status: isHealthy ? "ok" : "error",
        timestamp: summary.timestamp,
        environment: {
          nodeEnv: summary.environment.nodeEnv,
          appPort: summary.environment.appPort,
        },
        storage: {
          mode: summary.storage.mode,
          usingPersistentRateLimit: summary.storage.usingPersistentRateLimit,
          mediaWritable:
            summary.paths.mediaRoot.writable && summary.paths.mediaHistoryRoot.writable,
        },
        content: {
          shows: {
            valid: summary.content.shows.valid,
            count: summary.content.shows.count,
          },
          merch: {
            valid: summary.content.merch.valid,
            count: summary.content.merch.count,
          },
          audit: {
            valid: summary.content.audit.valid,
            count: summary.content.audit.count,
          },
        },
        warnings: summary.warnings.map((warning) => ({
          severity: warning.severity,
          message: warning.message,
        })),
      },
      { status: statusCode },
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    );
  }
}
