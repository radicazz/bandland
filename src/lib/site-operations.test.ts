import { describe, expect, it } from "vitest";

import { deriveSiteOperationsWarnings } from "@/lib/site-operations";

describe("deriveSiteOperationsWarnings", () => {
  it("warns when production uses repo-local content and no persistent rate-limit storage", () => {
    const warnings = deriveSiteOperationsWarnings({
      isProduction: true,
      storageMode: "repo",
      authUrlConfigured: true,
      publicSiteUrlConfigured: true,
      adminPasswordHashConfigured: true,
      authSecretConfigured: true,
      historyRootConfigured: false,
      historyRootReady: true,
      rateLimitRootConfigured: false,
      rateLimitRootReady: false,
      mediaRootConfigured: true,
      mediaRootReady: true,
      mediaHistoryRootReady: true,
      contentStatuses: [
        { key: "shows", valid: true, error: null },
        { key: "merch", valid: true, error: null },
        { key: "audit", valid: true, error: null },
      ],
    });

    expect(warnings.map((warning) => warning.id)).toContain("repo-content");
    expect(warnings.map((warning) => warning.id)).toContain("rate-limit-not-persistent");
  });

  it("emits errors for missing runtime config and invalid content", () => {
    const warnings = deriveSiteOperationsWarnings({
      isProduction: true,
      storageMode: "external",
      authUrlConfigured: false,
      publicSiteUrlConfigured: false,
      adminPasswordHashConfigured: false,
      authSecretConfigured: false,
      historyRootConfigured: true,
      historyRootReady: false,
      rateLimitRootConfigured: true,
      rateLimitRootReady: false,
      mediaRootConfigured: true,
      mediaRootReady: true,
      mediaHistoryRootReady: true,
      contentStatuses: [
        { key: "shows", valid: false, error: "File does not exist" },
        { key: "merch", valid: true, error: null },
        { key: "audit", valid: false, error: "Invalid JSON" },
      ],
    });

    expect(warnings.filter((warning) => warning.severity === "error")).toHaveLength(8);
    expect(warnings.find((warning) => warning.id === "shows-invalid")?.message).toMatch(
      /shows\.json/i,
    );
    expect(warnings.find((warning) => warning.id === "audit-invalid")?.message).toMatch(
      /Invalid JSON/i,
    );
  });

  it("stays quiet for a healthy external production setup", () => {
    const warnings = deriveSiteOperationsWarnings({
      isProduction: true,
      storageMode: "external",
      authUrlConfigured: true,
      publicSiteUrlConfigured: true,
      adminPasswordHashConfigured: true,
      authSecretConfigured: true,
      historyRootConfigured: true,
      historyRootReady: true,
      rateLimitRootConfigured: true,
      rateLimitRootReady: true,
      mediaRootConfigured: true,
      mediaRootReady: true,
      mediaHistoryRootReady: true,
      contentStatuses: [
        { key: "shows", valid: true, error: null },
        { key: "merch", valid: true, error: null },
        { key: "audit", valid: true, error: null },
      ],
    });

    expect(warnings).toHaveLength(0);
  });

  it("reports missing persistent media configuration in production", () => {
    const warnings = deriveSiteOperationsWarnings({
      isProduction: true,
      storageMode: "external",
      authUrlConfigured: true,
      publicSiteUrlConfigured: true,
      adminPasswordHashConfigured: true,
      authSecretConfigured: true,
      historyRootConfigured: true,
      historyRootReady: true,
      rateLimitRootConfigured: true,
      rateLimitRootReady: true,
      mediaRootConfigured: false,
      mediaRootReady: false,
      mediaHistoryRootReady: false,
      contentStatuses: [
        { key: "shows", valid: true, error: null },
        { key: "merch", valid: true, error: null },
        { key: "audit", valid: true, error: null },
      ],
    });

    expect(warnings.map((warning) => warning.id)).toContain("media-dir-not-configured");
  });

  it("reports unavailable configured media directories", () => {
    const warnings = deriveSiteOperationsWarnings({
      isProduction: true,
      storageMode: "external",
      authUrlConfigured: true,
      publicSiteUrlConfigured: true,
      adminPasswordHashConfigured: true,
      authSecretConfigured: true,
      historyRootConfigured: true,
      historyRootReady: true,
      rateLimitRootConfigured: true,
      rateLimitRootReady: true,
      mediaRootConfigured: true,
      mediaRootReady: false,
      mediaHistoryRootReady: false,
      contentStatuses: [
        { key: "shows", valid: true, error: null },
        { key: "merch", valid: true, error: null },
        { key: "audit", valid: true, error: null },
      ],
    });

    expect(warnings.map((warning) => warning.id)).toEqual(
      expect.arrayContaining(["media-dir-unavailable", "media-history-unavailable"]),
    );
  });
});
