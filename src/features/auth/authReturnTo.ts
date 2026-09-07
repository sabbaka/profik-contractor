// Job ids are backend UUIDs, so this regex is a strict whitelist that
// prevents arbitrary redirect targets coming in via the returnTo param.
//
// The shape is spelled out rather than counted: [0-9a-fA-F-]{36} is also 36
// characters long and would have accepted a string of nothing but dashes.
const JOB_DETAIL_RETURN_TO_RE =
  /^\/\(contractor\)\/jobs\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function buildJobDetailReturnTo(jobId: string): string {
  return `/(contractor)/jobs/${jobId}`;
}

export function normalizeAuthReturnTo(
  value: string | string[] | undefined,
): string | undefined {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && JOB_DETAIL_RETURN_TO_RE.test(candidate)
    ? candidate
    : undefined;
}
