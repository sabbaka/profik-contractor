# Architecture

Four layers, one direction of dependency. Anything that reaches upward is a bug.

```
app/         routes — thin, no logic
  ↓
src/components/   presentation — renders what it is handed
  ↓
src/features/     domain logic — forms, rules, orchestration
  ↓
src/api/          transport — RTK Query, the only place that talks HTTP
```

`src/store/`, `src/i18n/`, `src/theme.ts` and `src/utils/` sit beside all of it
and may be used from anywhere.

## Routes stay thin

Files under `app/` declare navigation and nothing else. A route that needs a
screen imports one:

```tsx
// app/(contractor)/jobs/[id].tsx
import { JobDetail } from "@/src/components/jobs/detail/JobDetail";

export default function JobDetailRoute() {
  return <JobDetail />;
}
```

Route files may read params (`useLocalSearchParams`) and pass them down. They do
not fetch, validate, or branch on business state. If a route file grows past
about fifty lines, the screen belongs in `src/components/`.

Layout files are the exception — `app/_layout.tsx` owns providers and the auth
gate (`AuthGate`), `app/(contractor)/_layout.tsx` owns the stack.

## Feature modules

Domain logic that isn't tied to one screen lives in `src/features/<domain>/`:

```
src/features/auth/
├── types.ts, errors.ts, utils.ts, phone.ts, guestRoutes.ts, authReturnTo.ts
└── hooks/
    ├── usePhoneAuth.ts     OTP sign-in flow
    ├── useAuth.ts          logout only — sign-in lives in usePhoneAuth
    ├── useNameGate.ts      gate an action behind "do you have a name set"
    └── index.ts            barrel
```

`src/features/balance/` is the other existing domain (topping up, forms).

**Job domain logic does not have a `src/features/jobs/` folder.** It lives
colocated with the screen instead, under `src/components/jobs/detail/hooks/`
(`useJobOffer.ts`) and job types live directly in `src/api/types.ts`, not a
separate domain `types.ts`. This is an existing inconsistency, not a pattern to
copy elsewhere — but match it when touching the jobs screen specifically,
rather than introducing a `src/features/jobs/` folder that would split the
domain across two places.

**Hooks own the decisions.** A screen component should read as a description of
what is on screen; every "should we show this", "what happens on submit",
"which mutation runs" belongs in a hook. `useJobOffer.ts` is the reference:
`JobDetail.tsx` destructures flags and handlers and renders them.

## Components

```
src/components/
├── ui/           primitives — Button, Text, Card, TabBar, ...
├── form/         react-hook-form field wrappers (FormInput, ...)
├── jobs/         job domain, split by screen area (detail/, ...)
├── auth/         auth-adjacent UI shared across screens (NamePromptSheet)
├── profile/      profile-adjacent shared UI (ContractorProfileButton)
├── layout/       chrome shared across screens (ContractorHeader)
├── onboarding/   onboarding step illustrations and progress UI
└── MapPreview.{native,web}.tsx, OpenJobsMap.{native,web}.tsx — platform-split
```

Only `src/components/form/` and `src/components/auth/` currently export
through an `index.ts` barrel. Import from the barrel where one exists; import
directly from the file otherwise — do not assume every folder has one.

Platform-specific components use RN's suffix resolution with a bridge file —
see `src/components/MapPreview.tsx` and its `.native` / `.web` siblings.

## Where does this go?

| You are adding                              | It goes in                                                                                                             |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| A screen                                    | `src/components/<domain>/`, with a thin route in `app/`                                                                |
| A reusable visual primitive                 | `src/components/ui/`                                                                                                   |
| A zod/RHF schema + submit handler           | `src/features/<domain>/hooks/`, or the screen's own `hooks/` for jobs                                                  |
| A pure formatter (dates, prices, addresses) | `src/utils/` (e.g. `currency.ts`) or the feature's `utils.ts`                                                          |
| An endpoint                                 | `src/api/profikApi.ts` — see `api.md`                                                                                  |
| A type mirroring a backend DTO              | `src/api/types.ts` for jobs/offers; `src/features/<domain>/types.ts` for auth/balance                                  |
| A persisted flag                            | `src/utils/*Storage.ts`, one module per concern (`onboardingStorage.ts`, `appearanceStorage.ts`, `languageStorage.ts`) |
| A user-facing string                        | `src/i18n/locales/{en,cs}.json`                                                                                        |
| A colour                                    | `tamagui.config.ts` tokens, both themes                                                                                |

## Imports

Use the `@/` alias for anything outside the current folder:

```ts
import { Button } from "@/src/components/ui/ui"; // yes
import { Button } from "../../../ui/ui"; // no
```

## State

Redux Toolkit holds auth only (`src/store/authSlice.ts`). Server data lives in
RTK Query's cache — do not copy it into Redux. Everything else is local
component state or a hook.

Do not introduce another state library, another HTTP client, or another
navigation library.

## Guest mode

The app is usable without an account. `src/features/auth/guestRoutes.ts`
(`isGuestAccessibleRoute`) is the single list of routes a signed-out user may
reach; `AuthGate` in `app/_layout.tsx` enforces it.

When adding a screen, decide explicitly whether guests get it, and add it to
that list if so. When adding a query, `skip` it for guests (`useIsGuest`)
rather than letting it 401 — note that a guest 401 is expected and does
**not** force a logout (see `api.md`).
