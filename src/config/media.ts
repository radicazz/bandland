/** Vercel Blob read/write tokens include the store ID used in the public hostname. */
export function getMediaHost(token: string | undefined): string | undefined {
  const storeId = token?.trim().match(/^vercel_blob_rw_([a-z0-9]+)_/i)?.[1];
  return storeId ? `${storeId.toLowerCase()}.public.blob.vercel-storage.com` : undefined;
}

export function isManagedMediaUrl(value: string, host: string | undefined, prefix = "/media/") {
  if (!host) return false;
  try {
    const url = new URL(value);
    return (
      url.origin === `https://${host}` &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      url.pathname.startsWith(prefix)
    );
  } catch {
    return false;
  }
}
