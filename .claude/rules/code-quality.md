# Code quality

## The checks

Work is not done until all six pass. Run them yourself; do not ask the user
to find out for you.

```bash
npm run typecheck     # tsc --noEmit — must be silent
npm run lint          # expo lint (eslint) — zero errors
npm run format:check  # prettier — the whole repo is clean, keep it that way
npm run i18n:check    # scripts/check-hardcoded-strings.mjs — see i18n.md for what it can't see
npm run shared:check  # modules mirrored in the client app — see below
npm test              # jest — see below
```

CI runs all six on every push and pull request (`.github/workflows/ci.yml`,
`Contractor CI`).

Prettier owns formatting here, using the same `.prettierrc` as the client so the
two apps format identically. Unlike the client, this repo was reformatted in one
go, so `format:check` is green and a red one is your change, not legacy drift —
run `npm run format` instead of hand-formatting around it. The reformat commit
is listed in `.git-blame-ignore-revs`, which GitHub applies on its own; locally
it is `git config blame.ignoreRevsFile .git-blame-ignore-revs`, once per clone.

Rules of thumb:

- **Zero type errors, always.** No `@ts-ignore` to get past one — the few that
  exist (`profikApi.util.resetApiState()` calls) are a known Redux Toolkit
  typing gap, not a precedent for new ones.
- **Zero new lint errors.** The repo can carry pre-existing warnings in files
  nobody has touched; do not add to them, and do not mass-fix them inside an
  unrelated change.

## Tests

`jest` with the `jest-expo` preset. Tests sit next to the code they cover as
`*.test.ts`, and they cover **logic, not screens** — pure functions and hooks
through `renderHook`. Nothing renders a component, which is what keeps Tamagui
and reanimated out of the test environment entirely; that boundary is the
reason the setup is small enough to stay working.

There is no coverage threshold. Coverage on a suite this young is a number, not
a signal — the tests that exist were written for places that have already
broken, and that is the standard for adding one.

Two things to know before writing one:

- **`renderHook` is async** (RNTL 14, React 19). `await` it, and `await act()`.
- **A `jest.mock` factory may only reference names prefixed with `mock`.** Jest
  hoists the factory above the imports, so anything else is not yet defined.

Global mocks live in `jest.setup.ts` — Sentry, `expo-router`, AsyncStorage,
SecureStore, and `EXPO_PUBLIC_API_URL`, which `profikApi` reads at module load.
The setup, `jest.config.js` and `babel.config.js` are byte-identical to the
client app's; keep them that way.

## Modules mirrored in the client app

Eleven modules carry the same logic in both apps and say so in their own doc
comments. Nothing enforced that, so the two could drift silently until a bug
appeared in one app and not the other.

`npm run shared:check` compares each file against the hash recorded in
`shared-modules.json`. Changing one fails the check; that failure is the prompt
to carry the change into the client app and then run `npm run shared:sync` to
record the new state.

It cannot verify the sibling was actually updated — the two are separate
checkouts and CI has only one of them. It tells you _when_ to look, which is
the part that was missing.

## Node version

Expo SDK 57 (the version this app is on) requires Node
`^20.19.4 || ^22.13.0 || ^24.3.0 || >=25.0.0` — this is metro's engine range,
not a soft recommendation. `.nvmrc` at the repo root pins `v22.16.0`. If
`npm install` or `expo-doctor` was run under a different Node than the one the
app is actually launched with, `package-lock.json` can drift to versions that
don't match — `nvm use` (or read `.nvmrc`) before installing, not after
something looks wrong.

CI (`ci.yml`) reads `.nvmrc` through `node-version-file`, so it runs the same
version as a local checkout. It used to ask for a bare major (`20`), which
resolved to whatever `20.x` was current — inside Expo's range, but below the
`^22.13.0 || >=24` that `@testing-library/react-native` declares. The suite ran
anyway; a toolchain on a version its own engines field calls unsupported is
simply not somewhere to stand.

## The lockfile has to survive `npm ci`

EAS installs dependencies with **`npm ci`**, not `npm install`. The difference
matters: `npm ci` refuses a `package-lock.json` that disagrees with
`package.json` instead of quietly repairing it, and it does so as the very first
step of the build — the failure reads `Install dependencies` and says nothing
about lockfiles.

So after anything that regenerates or edits the lockfile — adding a dependency,
an SDK upgrade, resolving a merge conflict in `package-lock.json`, deleting
`node_modules` — verify it the way EAS will:

```bash
rm -rf node_modules && npm ci
```

A local `npm install` proves nothing here; it is the command that hides the
problem. This has already cost one build (`fix(deps): make the lockfile
installable with npm ci`).

Commit `package-lock.json` with the change that altered it, never separately.

## Verify honestly

You cannot run the app. Type-checking and linting prove the code compiles, not
that it looks right or behaves correctly on a device.

Say what you verified and what you did not. "tsc and eslint pass; I have not
seen this rendered" is a complete and useful report. Claiming a visual result
you have not seen is not.

When a fix depends on a build-time flag (anything in `app.config.ts`), say that
a cache-clearing restart is required — `npx expo start -c`. A bundle reload is
not enough.

## Commits

Format, matching this repo's actual history:

```
<type>(<scope>): <summary>
```

or, when there's no natural scope:

```
<type>: <summary>
```

- a type prefix — `fix:`, `feat:`, `chore:`, `docs:`, `refactor:`, `ci:`
- scope in parens is optional and names the area touched — `fix(jobs):`,
  `chore(android):`
- the summary is in **English**, lower case, describing what the commit does,
  no trailing period
- **do not add a co-authorship trailer, a "Generated with" line, or any other
  AI-attribution footer to the commit message** — the message is just the
  `<type>(<scope>): <summary>` line (plus a body if one is warranted), nothing
  appended after it

Split unrelated work into separate commits, ordered so each one builds. If a
UI fix depends on a type change, the type change lands first.

Commit or push **only when asked.**

### Stage your own work, not the tree

More than one Claude session may be running against this working tree at the
same time, and a sibling session's edits appear in `git status` exactly like
your own. Before committing, look at `git status` and `git diff --stat` and
stage the paths you actually changed.

`git commit -a` and `git add .` are how another session's half-finished work
gets committed under your message. If the tree holds changes you cannot account
for, say so and ask rather than guessing which are yours.

## Do not commit

- `*.pen` — Pencil design sources
- `.env` — secrets belong in EAS, not the repo (already gitignored)
- Google service-account JSON (`iron-bedrock-*.json`) — already gitignored
- debug logging of any kind

`docs/` is currently untracked in this repo (not gitignored) — check with the
user before adding files there to a commit; it may be intentionally kept local.

Before committing, check the diff for stray `console.log`.

## Dependencies

Install Expo-managed packages with `npx expo install <pkg>`, not
`npm install` — it picks the version matching the installed SDK. Ask before
adding anything new.
