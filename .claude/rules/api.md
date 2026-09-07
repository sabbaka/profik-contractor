# Working with the API

## The spec lives in the sibling client repo

This repo does not carry its own `openapi.json`. The backend is shared with
`profik_client` (the client-side sibling app) — when you need the authoritative
shape of an endpoint or DTO, check `../profik_client/openapi.json` (adjust the
path to wherever that repo is checked out locally) rather than guessing from
this app's existing types, which are a hand-maintained subset and can lag the
backend. Field names are not guessable — verify before adding or changing
anything that talks to the API.

If the spec and this app disagree, the spec wins and the app has a bug. If a
field this app needs is present in the spec but missing from this app's types
(the `Job` structured-details fields — `roomsCount`, `area`, `vacuumCleaner`,
etc. — were exactly this until they were added), add it to `src/api/types.ts`
rather than working around its absence.

## One API file

Every HTTP call in the app goes through `src/api/profikApi.ts`. There is no
second client. Never call `fetch` or `axios` from a component, hook, or util.

An endpoint looks like this:

```ts
getJobById: builder.query<Job, string>({
  query: (id) => ({ url: `/jobs/${id}`, method: "GET" }),
  providesTags: (_result, _error, id) => [{ type: "Jobs", id } as any],
}),
```

and its hook is re-exported from the block at the bottom of the file. Adding an
endpoint without exporting its hook is an easy thing to forget.

Auth is automatic: `prepareHeaders` attaches the bearer token from the store.
Never pass a token by hand.

## Types mirror DTOs

- Auth/profile response and request types live in `src/features/auth/types.ts`
  (`User`, `AuthResponse`, `VerifyOtpParams`, ...).
- Job/offer types live in `src/api/types.ts` directly — there is no
  `src/features/jobs/` domain folder (see `architecture.md`). Add new job/offer
  fields there, not in a new domain file.
- `MeResponse` (the shape of `GET /auth/me` and `PATCH /users/me`) is defined
  inline in `src/api/profikApi.ts`, next to the endpoints that use it.

Mirror the spec honestly:

- A field only some responses populate is **optional**, ideally with a comment
  saying which endpoint populates it.
- Nullable fields are `T | null`, not `T | undefined` — the `Job` location
  fields (`addressLine`, `city`, `lat`, `lng`, ...) are `| null` because the
  backend strips them for anonymous/guest responses. The structured job-detail
  fields added alongside them (`roomsCount`, `area`, ...) are instead plain
  optional (`?:`) — they simply don't exist on jobs created before that part of
  the wizard shipped, which is a different shape of "missing" than "stripped
  for this caller".
- Do not widen a type to `any` to make an error go away.

## Cache and invalidation

Tags in use: `Jobs`, `Offers`, `OfferMessages`.

A mutation invalidates what it actually changed. Prefer per-id tags over blunt
ones — a flat `providesTags: ["Offers"]` means accepting one offer refetches
every offer query in the app.

`refetchOnFocus` works because `src/store/rtkListeners.ts` drives focus from
React Native's `AppState`; RTK Query's built-in listener binds `window` and does
nothing on native. Do not replace it with `setupListeners(dispatch)`.

## Identity changes reset everything

On login and logout, dispatch `profikApi.util.resetApiState()` alongside the
auth change (see `usePhoneAuth.ts` and `useAuth.ts`). Without it the next user
sees the previous user's cached data.

The same class of bug applies to anything keyed to a device rather than a
session — the push token is unregistered **before** the auth token is cleared,
because the call needs the header (`useAuth.ts`'s `logout`).

A `401` from an endpoint logs the user out globally **only when a token was
actually set** — see `baseQueryWithReauth` in `profikApi.ts`. Guests
legitimately get 401s from protected endpoints while browsing anonymously and
must not be force-logged-out for it (there is nothing to log them out of). Do
not handle 401 per-call, and do not remove the `hasToken` guard when touching
that function.

## Errors

`extractErrorMessage` (`src/features/auth/types.ts`) pulls a server message out
of an unknown error. It's fine for the common case and is reused outside auth
(e.g. `profile.tsx`'s delete-account flow) — despite living in `features/auth`,
treat it as the app's general-purpose extractor rather than duplicating it.

When an endpoint has failure modes the user should be told apart, classify by
status instead of surfacing a raw string. `classifyPhoneAuthError` in
`src/features/auth/errors.ts` is the pattern to copy — it inspects
`error.status` (a number for HTTP responses, a string tag like `FETCH_ERROR` /
`TIMEOUT_ERROR` for transport failures) and maps each case to its own
translated message via `phoneAuthErrorKey`.

Every caught error that is not shown to the user goes to `logError` from
`src/utils/logger.ts`, which forwards to Sentry (see `setupGlobalErrorHandlers`
for how uncaught errors reach it too). Never swallow silently, and never leave
`console.log` behind.

## Endpoints or fields this app does not use yet

Check `profikApi.ts`'s existing endpoint list and `Job`/`Offer` types before
assuming something needs to be added — this app deliberately does not surface
every field the backend returns (e.g. `Job.scheduledDates` / `timeSlot` are
typed but not yet rendered anywhere in the UI). Wire a field or endpoint when a
feature needs it, not speculatively.
