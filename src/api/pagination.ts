/**
 * Cursor helpers for the endpoints that answer with a bare array.
 *
 * The backend paginates `/jobs/open`, `/jobs/my` and friends without an
 * envelope — the released apps send no query at all and expect a plain array,
 * so the contract stayed additive and the cursor is simply the `id` of the
 * last item (see `jobs.service.ts`'s `getOpenJobs`). "There is another page"
 * is therefore inferred from a *full* page, which only holds if the same
 * `pageSize` reaches both the `limit` param and the callback below. Declare
 * the two next to each other and pass the same constant to both.
 *
 * Kept in step with the same file in the client app; change one, change both.
 */
export function forwardIdCursor<T>(
  pageSize: number,
  getId: (item: T) => string,
) {
  return {
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: T[]): string | undefined =>
      lastPage.length < pageSize
        ? undefined
        : getId(lastPage[lastPage.length - 1]),
  };
}
