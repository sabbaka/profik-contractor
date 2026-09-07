# Profik Contractor

Expo / React Native app for the Profik cleaning marketplace, for the
**contractor** side: browse open jobs, send offers, chat with the client once
hired, get paid.

Clients use a **separate app** (`profik_client`, a sibling repo). Signing in
here always requests `role: "contractor"` on OTP verify
(`src/features/auth/hooks/usePhoneAuth.ts`); there is no hard rejection of a
client account at login. Contractor-only UI (making an offer, etc.) checks
`me?.role === "contractor"` at the point of use instead — see
`useJobOffer.ts`. Never add client-posting-a-job flows here.

## Rules

Read the file that covers what you are about to touch.

- @.claude/rules/architecture.md — where code goes and why
- @.claude/rules/components.md — component docs, comment discipline, UI conventions
- @.claude/rules/api.md — RTK Query, types, errors
- @.claude/rules/code-quality.md — checks that must pass before you are done, and the commit format

## Always

- This app and `profik_client` share one backend. When something here looks
  wrong or a field seems missing, check the sibling repo before guessing —
  it often already solved the same problem, or has the answer in its
  `openapi.json` (this repo does not carry a copy).
- Match the surrounding code. This codebase has settled conventions; a change
  that is stylistically foreign is a change that needs review it should not need.
- Run the checks in `code-quality.md` before reporting work as done, and say
  plainly what you did not verify. You cannot run the app — never claim a visual
  result you have not seen.
- Ask before adding a dependency. The install cost is rarely the real cost.
