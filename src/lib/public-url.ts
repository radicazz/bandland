export function isHttpsUrl(value: string | undefined): value is string {
  return Boolean(value && /^https:\/\//i.test(value) && URL.canParse(value));
}
