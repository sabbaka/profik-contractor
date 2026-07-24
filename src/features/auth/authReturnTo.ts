// Job ids are backend UUIDs, so this regex is a strict whitelist that
// prevents arbitrary redirect targets coming in via the returnTo param.
const JOB_DETAIL_RETURN_TO_RE = /^\/\(contractor\)\/jobs\/[0-9a-fA-F-]{36}$/;

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
