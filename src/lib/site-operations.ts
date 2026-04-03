import "server-only";

import { constants as fsConstants, promises as fs } from "node:fs";
import path from "node:path";

import { readAudit, readMerch, readShows } from "@/lib/content-store";

type ContentKey = "shows" | "merch" | "audit";
type WarningSeverity = "warning" | "error";

export type PathStatus = {
  path: string;
  exists: boolean;
  readable: boolean;
  writable: boolean;
};

export type ContentStatus = {
  key: ContentKey;
  file: PathStatus;
  valid: boolean;
  count: number | null;
  error: string | null;
};

export type SiteOperationsWarning = {
  id: string;
  severity: WarningSeverity;
  message: string;
};

export type SiteOperationsSummary = {
  timestamp: string;
  environment: {
    nodeEnv: string;
    isProduction: boolean;
    appPort: string;
    deployHealthcheckUrl: string;
    authUrlConfigured: boolean;
    publicSiteUrlConfigured: boolean;
    adminPasswordHashConfigured: boolean;
    authSecretConfigured: boolean;
  };
  storage: {
    mode: "repo" | "external";
    repoContentRoot: string;
    contentRoot: string;
    historyRoot: string;
    rateLimitRoot: string | null;
    usingPersistentRateLimit: boolean;
  };
  paths: {
    contentRoot: PathStatus;
    historyRoot: PathStatus;
    rateLimitRoot: PathStatus | null;
  };
  content: {
    shows: ContentStatus;
    merch: ContentStatus;
    audit: ContentStatus;
    allValid: boolean;
  };
  activity: {
    latestAuditAt: string | null;
    latestBackupAt: string | null;
  };
  warnings: SiteOperationsWarning[];
};

type SiteOperationsWarningInput = {
  isProduction: boolean;
  storageMode: "repo" | "external";
  authUrlConfigured: boolean;
  publicSiteUrlConfigured: boolean;
  adminPasswordHashConfigured: boolean;
  authSecretConfigured: boolean;
  historyRootConfigured: boolean;
  historyRootReady: boolean;
  rateLimitRootConfigured: boolean;
  rateLimitRootReady: boolean;
  contentStatuses: Array<Pick<ContentStatus, "key" | "valid" | "error">>;
};

function getRepoContentRoot() {
  return path.join(process.cwd(), "content");
}

function getContentRoot() {
  return process.env.CONTENT_DIR?.trim() || getRepoContentRoot();
}

function getHistoryRoot(contentRoot: string) {
  return process.env.CONTENT_HISTORY_DIR?.trim() || path.join(contentRoot, ".history");
}

function getRateLimitRoot() {
  return process.env.AUTH_RATE_LIMIT_DIR?.trim() || null;
}

function getAppPort() {
  return process.env.APP_PORT?.trim() || process.env.PORT?.trim() || "3000";
}

function getDeployHealthcheckUrl(appPort: string) {
  return (
    process.env.DEPLOY_HEALTHCHECK_URL?.trim() ||
    `http://127.0.0.1:${appPort}/api/health`
  );
}

async function inspectPath(targetPath: string): Promise<PathStatus> {
  try {
    await fs.stat(targetPath);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return {
        path: targetPath,
        exists: false,
        readable: false,
        writable: false,
      };
    }
    throw error;
  }

  const readable = await fs
    .access(targetPath, fsConstants.R_OK)
    .then(() => true)
    .catch(() => false);
  const writable = await fs
    .access(targetPath, fsConstants.W_OK)
    .then(() => true)
    .catch(() => false);

  return {
    path: targetPath,
    exists: true,
    readable,
    writable,
  };
}

function sanitizeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unknown error";
}

async function getLatestBackupAt(historyRoot: string) {
  try {
    const entries = await fs.readdir(historyRoot, { withFileTypes: true });
    const backupFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json"));

    if (backupFiles.length === 0) {
      return null;
    }

    let latestTimestamp = 0;

    for (const entry of backupFiles) {
      const stats = await fs.stat(path.join(historyRoot, entry.name));
      latestTimestamp = Math.max(latestTimestamp, stats.mtimeMs);
    }

    return latestTimestamp > 0 ? new Date(latestTimestamp).toISOString() : null;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

function getLatestAuditAt(createdAtValues: string[]) {
  let latest = 0;

  for (const createdAt of createdAtValues) {
    const parsed = Date.parse(createdAt);
    if (!Number.isNaN(parsed)) {
      latest = Math.max(latest, parsed);
    }
  }

  return latest > 0 ? new Date(latest).toISOString() : null;
}

export function deriveSiteOperationsWarnings({
  isProduction,
  storageMode,
  authUrlConfigured,
  publicSiteUrlConfigured,
  adminPasswordHashConfigured,
  authSecretConfigured,
  historyRootConfigured,
  historyRootReady,
  rateLimitRootConfigured,
  rateLimitRootReady,
  contentStatuses,
}: SiteOperationsWarningInput): SiteOperationsWarning[] {
  const warnings: SiteOperationsWarning[] = [];

  if (isProduction && storageMode === "repo") {
    warnings.push({
      id: "repo-content",
      severity: "warning",
      message:
        "Production is using repo-local content. Set CONTENT_DIR to keep admin changes outside deploys.",
    });
  }

  if (isProduction && !rateLimitRootConfigured) {
    warnings.push({
      id: "rate-limit-not-persistent",
      severity: "warning",
      message:
        "AUTH_RATE_LIMIT_DIR is not configured. Admin login throttling will reset on app restart.",
    });
  }

  if (historyRootConfigured && !historyRootReady) {
    warnings.push({
      id: "history-dir-unavailable",
      severity: "error",
      message:
        "CONTENT_HISTORY_DIR is configured but is missing or not writable. Admin backups may fail.",
    });
  }

  if (rateLimitRootConfigured && !rateLimitRootReady) {
    warnings.push({
      id: "rate-limit-dir-unavailable",
      severity: "error",
      message:
        "AUTH_RATE_LIMIT_DIR is configured but is missing or not writable. Admin login throttling cannot persist safely.",
    });
  }

  if (isProduction && !authUrlConfigured) {
    warnings.push({
      id: "auth-url-missing",
      severity: "error",
      message: "AUTH_URL is missing in production.",
    });
  }

  if (isProduction && !publicSiteUrlConfigured) {
    warnings.push({
      id: "public-site-url-missing",
      severity: "error",
      message: "NEXT_PUBLIC_SITE_URL is missing in production.",
    });
  }

  if (isProduction && !adminPasswordHashConfigured) {
    warnings.push({
      id: "admin-hash-missing",
      severity: "error",
      message: "ADMIN_PASSWORD_HASH is missing in production.",
    });
  }

  if (isProduction && !authSecretConfigured) {
    warnings.push({
      id: "auth-secret-missing",
      severity: "error",
      message: "AUTH_SECRET is missing in production.",
    });
  }

  for (const contentStatus of contentStatuses) {
    if (!contentStatus.valid) {
      warnings.push({
        id: `${contentStatus.key}-invalid`,
        severity: "error",
        message: `${contentStatus.key}.json is unavailable or invalid${
          contentStatus.error ? `: ${contentStatus.error}` : "."
        }`,
      });
    }
  }

  return warnings;
}

export async function getSiteOperationsSummary(): Promise<SiteOperationsSummary> {
  const timestamp = new Date().toISOString();
  const repoContentRoot = getRepoContentRoot();
  const contentRoot = getContentRoot();
  const historyRoot = getHistoryRoot(contentRoot);
  const rateLimitRoot = getRateLimitRoot();
  const appPort = getAppPort();
  const deployHealthcheckUrl = getDeployHealthcheckUrl(appPort);
  const isProduction = process.env.NODE_ENV === "production";

  const [contentRootStatus, historyRootStatus, rateLimitRootStatus] = await Promise.all([
    inspectPath(contentRoot),
    inspectPath(historyRoot),
    rateLimitRoot ? inspectPath(rateLimitRoot) : Promise.resolve(null),
  ]);

  const filePaths = {
    shows: path.join(contentRoot, "shows.json"),
    merch: path.join(contentRoot, "merch.json"),
    audit: path.join(contentRoot, "admin-audit.json"),
  } as const;

  const [showsFileStatus, merchFileStatus, auditFileStatus] = await Promise.all([
    inspectPath(filePaths.shows),
    inspectPath(filePaths.merch),
    inspectPath(filePaths.audit),
  ]);

  const [showsResult, merchResult, auditResult, latestBackupAt] = await Promise.all([
    readShows().then(
      (data) => ({ data, error: null }),
      (error: unknown) => ({ data: null, error: sanitizeErrorMessage(error) }),
    ),
    readMerch().then(
      (data) => ({ data, error: null }),
      (error: unknown) => ({ data: null, error: sanitizeErrorMessage(error) }),
    ),
    readAudit().then(
      (data) => ({ data, error: null }),
      (error: unknown) => ({ data: null, error: sanitizeErrorMessage(error) }),
    ),
    getLatestBackupAt(historyRoot),
  ]);

  const shows: ContentStatus = {
    key: "shows",
    file: showsFileStatus,
    valid: showsFileStatus.exists && showsResult.error === null,
    count: showsResult.data?.length ?? null,
    error: !showsFileStatus.exists ? "File does not exist" : showsResult.error,
  };
  const merch: ContentStatus = {
    key: "merch",
    file: merchFileStatus,
    valid: merchFileStatus.exists && merchResult.error === null,
    count: merchResult.data?.length ?? null,
    error: !merchFileStatus.exists ? "File does not exist" : merchResult.error,
  };
  const audit: ContentStatus = {
    key: "audit",
    file: auditFileStatus,
    valid: auditFileStatus.exists && auditResult.error === null,
    count: auditResult.data?.length ?? null,
    error: !auditFileStatus.exists ? "File does not exist" : auditResult.error,
  };

  const warnings = deriveSiteOperationsWarnings({
    isProduction,
    storageMode: contentRoot === repoContentRoot ? "repo" : "external",
    authUrlConfigured: Boolean(process.env.AUTH_URL?.trim()),
    publicSiteUrlConfigured: Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim()),
    adminPasswordHashConfigured: Boolean(process.env.ADMIN_PASSWORD_HASH?.trim()),
    authSecretConfigured: Boolean(process.env.AUTH_SECRET?.trim()),
    historyRootConfigured: Boolean(process.env.CONTENT_HISTORY_DIR?.trim()),
    historyRootReady: historyRootStatus.exists && historyRootStatus.writable,
    rateLimitRootConfigured: Boolean(rateLimitRoot),
    rateLimitRootReady: Boolean(rateLimitRootStatus?.exists && rateLimitRootStatus.writable),
    contentStatuses: [shows, merch, audit],
  });

  return {
    timestamp,
    environment: {
      nodeEnv: process.env.NODE_ENV || "development",
      isProduction,
      appPort,
      deployHealthcheckUrl,
      authUrlConfigured: Boolean(process.env.AUTH_URL?.trim()),
      publicSiteUrlConfigured: Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim()),
      adminPasswordHashConfigured: Boolean(process.env.ADMIN_PASSWORD_HASH?.trim()),
      authSecretConfigured: Boolean(process.env.AUTH_SECRET?.trim()),
    },
    storage: {
      mode: contentRoot === repoContentRoot ? "repo" : "external",
      repoContentRoot,
      contentRoot,
      historyRoot,
      rateLimitRoot,
      usingPersistentRateLimit: Boolean(rateLimitRoot),
    },
    paths: {
      contentRoot: contentRootStatus,
      historyRoot: historyRootStatus,
      rateLimitRoot: rateLimitRootStatus,
    },
    content: {
      shows,
      merch,
      audit,
      allValid: [shows, merch, audit].every((status) => status.valid),
    },
    activity: {
      latestAuditAt: getLatestAuditAt(
        auditResult.data?.map((entry) => entry.createdAt) ?? [],
      ),
      latestBackupAt,
    },
    warnings,
  };
}
