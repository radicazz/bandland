const BCRYPT_HASH = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

/**
 * Reads ADMIN_PASSWORD_HASH, tolerating the quotes and `\$` escapes that `.env` syntax
 * needs but a dashboard value keeps literally. Returns null if no bcrypt hash remains.
 */
export function parseAdminPasswordHash(value: string): string | null {
  const hash = value
    .trim()
    .replace(/^(["'])(.*)\1$/, "$2")
    .replaceAll("\\$", "$");

  return BCRYPT_HASH.test(hash) ? hash : null;
}
