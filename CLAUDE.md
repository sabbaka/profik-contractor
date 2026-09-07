# Profik Pro (contractor)

Expo / React Native app for the contractors of the Profik cleaning marketplace.
They browse open jobs, send offers, chat with the client, and get paid.

Clients use a **separate app**, `profik`. That app is the source of truth for
shared conventions: when the two disagree on how something is done, align this
one to it rather than the other way round.

## Rules

- @.claude/rules/i18n.md — translated copy, dates, what the checker misses

## Always

- Run `npm run typecheck`, `npm run lint` and `npm run i18n:check` before
  reporting work as done, and say plainly what you did not verify.
- Match the surrounding code. A change that is stylistically foreign needs
  review it should not need.
- Ask before adding a dependency.
