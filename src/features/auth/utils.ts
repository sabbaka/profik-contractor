const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

/**
 * Backend may return avatar URLs in two shapes:
 *   • absolute  — e.g. "https://cdn.example.com/avatars/abc.webp"
 *   • relative  — e.g. "/avatars/abc-123.webp" (served from the API host)
 *
 * `<Image>` only accepts absolute URLs, so this helper normalises any relative
 * value against `EXPO_PUBLIC_API_URL`. Returns `undefined` for empty input so
 * call sites can use it directly in conditional rendering.
 */
export function resolveAvatarUrl(
  url: string | null | undefined,
): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (!API_URL) return url;
  const base = API_URL.replace(/\/+$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${base}${path}`;
}
