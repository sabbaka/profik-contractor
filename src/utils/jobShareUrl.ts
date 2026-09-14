const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

/**
 * The backend renders `GET /share/jobs/:id` as a standalone HTML preview
 * page (og:tags for a rich link + an "Open in app" button pointing at
 * `profikcontractor://jobs/:id`) — see docs/job-share-link-backend.md. This
 * is what gets shared, not the custom scheme directly: most messaging apps
 * (Telegram included) only auto-linkify http(s), never a custom scheme.
 */
export function buildJobShareUrl(jobId: string): string {
  return `${API_URL.replace(/\/+$/, "")}/share/jobs/${jobId}`;
}
