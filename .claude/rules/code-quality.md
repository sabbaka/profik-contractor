# Code quality

## The checks

Work is not done until all three pass. Run them yourself; do not ask the user
to find out for you.

```bash
npm run typecheck   # tsc --noEmit — must be silent
npm run lint         # expo lint (eslint) — zero errors
npm run i18n:check   # scripts/check-hardcoded-strings.mjs — see i18n.md for what it can't see
```

CI runs all three on every push and pull request (`.github/workflows/ci.yml`,
`Contractor CI`). There is no `format:check` script — Prettier is not
configured in this repo; match the surrounding formatting by hand instead of
assuming a formatter will fix it.

Rules of thumb:

- **Zero type errors, always.** No `@ts-ignore` to get past one — the few that
  exist (`profikApi.util.resetApiState()` calls) are a known Redux Toolkit
  typing gap, not a precedent for new ones.
- **Zero new lint errors.** The repo can carry pre-existing warnings in files
  nobody has touched; do not add to them, and do not mass-fix them inside an
  unrelated change.

## Node version

Expo SDK 57 (the version this app is on) requires Node
`^20.19.4 || ^22.13.0 || ^24.3.0 || >=25.0.0` — this is metro's engine range,
not a soft recommendation. `.nvmrc` at the repo root pins `v22.16.0`. If
`npm install` or `expo-doctor` was run under a different Node than the one the
app is actually launched with, `package-lock.json` can drift to versions that
don't match — `nvm use` (or read `.nvmrc`) before installing, not after
something looks wrong.

CI (`ci.yml`) requests Node `20` (major only, via `actions/setup-node`) — this
resolves to whatever the latest `20.x` patch is at build time, which needs to
stay within the range above; it is not pinned to `.nvmrc`.

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
