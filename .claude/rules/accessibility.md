# Accessibility

Anything tappable that is not a `Button` gets `accessibilityRole="button"` and,
when it has no visible text, an `accessibilityLabel` that names the action.
An icon-only control without a label is silent to a screen reader — VoiceOver
announces it as "button" and nothing more.

`Button`, `NavHeader` and `TabBar` already carry theirs, so most screens inherit
the floor for free. What still needs a decision each time:

- **A control with visible text does not need a label.** VoiceOver reads the
  nested `Text`; a label would replace it, usually with something worse. Give it
  the role, and nothing else.
- **A label is copy.** It goes through `t()` and into both locale files like any
  other string — `a11y.*` is the namespace. This is easy to forget precisely
  because the string never appears on screen, so `npm run i18n:check` flags a
  hardcoded `accessibilityLabel` the same as visible text. See
  [i18n.md](i18n.md).
- **Say what the control does, not what it looks like.** "Send message", not
  "paper plane".
- **State belongs in `accessibilityState`, not in the label.** Selected tabs and
  disabled or busy buttons carry `{{ selected }}`, `{{ disabled }}`,
  `{{ busy }}`. A label that says "selected" goes stale the moment it isn't.

The client app is the source of truth here too — its `components.md` holds the
same floor, and the two should not drift.
