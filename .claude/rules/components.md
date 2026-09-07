# Components

## Every component carries a doc block

Each exported component gets a JSDoc block above it. It answers what the
component is, when it is used, and anything a reader would otherwise have to
discover by reading the whole file.

```tsx
/**
 * Asks for a display name at the one moment it matters — sending an offer —
 * for accounts created with nothing but a phone number. Driven by
 * `useNameGate`; dismissing it abandons the offer rather than sending it
 * anonymously, since the client picks between offers by who they're from.
 *
 * Reuses `useEditProfileForm`, so this writes to the same `PATCH /users/me`
 * as the Edit Profile screen and the name shows up there afterwards.
 */
export function NamePromptSheet({ open, onOpenChange, onSaved }: NamePromptSheetProps);
```

Good doc blocks record:

- what the thing is, in one sentence;
- when it appears, if that is conditional;
- rules a future reader would break by accident;
- variants or modes, if the component has more than one shape.

Do not restate the props — the interface already does that. Do not write
`/** JobCard component. */`; that is worse than nothing because it looks like
documentation.

Prop interfaces get inline comments only where a name is not self-explanatory:

```tsx
interface RowProps {
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  pill: StatusPillProps;
  /** Suppresses the row's bottom divider — the row is the last one. */
  isLast?: boolean;
}
```

## Comments explain why, never what

The code already says what it does. A comment earns its place when it explains a
decision, a constraint, or a trap.

Worth writing:

```tsx
// Non-modal Sheets keep their children mounted even while closed, so the
// `autoFocus` name input would grab the keyboard as soon as the screen that
// renders this sheet opens, rather than when the sheet itself does. Focus is
// driven by `open` instead — see the effect above.

// Only force a logout when there is a token to invalidate — guests may
// legitimately receive 401s from protected endpoints while browsing.
```

Not worth writing:

```tsx
// set the state              ← says nothing
setOpen(true);

// map over the jobs          ← the code says this
jobs.map(...)

// Header row                 ← if the markup needs a label, extract a component
```

Section-header comments inside JSX (`{/* Property */}`) are fine sparingly,
when a screen has several distinct regions. Do not label every stack.

Delete commented-out code rather than leaving it. If it might come back, that
is what git is for.

## Colours come from tokens

Never hardcode a hex value that should follow the theme. Use `useThemeColors()`
(the compatibility shim over Tamagui's theme, see `src/theme.ts`) rather than
raw hex, and prefer it over reading `useTheme().val` directly in new code:

```tsx
const colors = useThemeColors();
<YStack backgroundColor={colors.bgCard} borderColor={colors.borderSubtle} />
<Text style={{ color: colors.textPrimary }} />
```

New colours are added to `tamagui.config.ts` (both `light` and `dark` themes)
**and** to the `ThemeColors` interface + mapping in `src/theme.ts` if read
through `useThemeColors()`.

Literal hex is acceptable only for colours that are deliberately
theme-independent — the orange brand gradient (`#FF8A2B` → `#E85D00`), white on
that gradient, status-dot colours in a fixed-dark hero.

Pick the token by meaning, not by how it looks. `textSecondary` is for labels;
a client's own message is content and takes `textPrimary`. Choosing the wrong
one is invisible in one theme and unreadable in the other.

### Theme reactivity

Tamagui distributes the active theme by subscription, not context. Two things
follow from that, both hit here already:

- **Wrap the tree in `<Theme name={mode}>`, not just `defaultTheme` on
  `TamaguiProvider`.** `defaultTheme` only seeds the first render — it is not
  re-read on update. `app/_layout.tsx`'s `ThemedApp` wraps everything below
  `TamaguiProvider` in `<Theme name={mode}>` for exactly this reason; without
  it, switching appearance in Settings (or the OS flipping dark mode while on
  "system") updates non-Tamagui bits like `<StatusBar>` but leaves every
  Tamagui-styled surface frozen on whatever theme was active at mount, until a
  full JS reload.
- `experiments.reactCompiler` is now **off** in `app.config.ts`, matching
  `profik_client` — it was on, and the compiler's automatic memoization froze
  leaf nodes (components whose own props don't change when the theme does)
  with stale colours. Flipping it is a Babel/build-time change: a plain reload
  is not enough, and even `npx expo start -c` only clears Metro's transform
  cache — if a stale build artifact or a native rebuild is involved, confirm
  the fix with a fresh `npx expo start -c` **and** a full app relaunch before
  concluding the flag change didn't help.
- **A component styled with a `"$token"` string prop directly
  (`backgroundColor="$bgPrimary"`, `borderColor="$borderToken"`) can go stale
  on an appearance switch and only catch up when something else forces that
  component to re-render** — this hit `TabBar.tsx`: its background stayed on
  the old theme until the active tab changed (a real prop change), at which
  point it snapped to the current theme. `useThemeColors()` did not have this
  problem anywhere else in the app. Root cause not fully pinned down (Tamagui
  documents this style-prop path as updating via its own subscription,
  separate from the `useTheme()` hook's normal React re-render), but the fix
  that resolved it was mechanical: call `useThemeColors()` and pass the
  resolved value (`backgroundColor={colors.bgPrimary}`) instead of the token
  string. **Prefer `useThemeColors()` over a `"$token"` string prop for any
  colour that must react live to an appearance change** — not just as a style
  preference, but because the string-prop path has a demonstrated staleness
  bug in this app. A one-off grep for the pattern
  (`grep -rnE '="\$[a-zA-Z]+"' --include="*.tsx"` for color-ish prop names)
  found and fixed every remaining instance (`TabBar.tsx`,
  `ErrorBoundary.tsx`) the day this was found — if a new one shows up
  frozen after a theme switch, this is the first thing to check.

## User-facing strings are translated

All copy goes through `useTranslation()` and lives in
`src/i18n/locales/en.json` **and** `cs.json`. Add both; do not leave Czech for
later.

Counted strings use i18next plurals. Czech needs three forms:

```json
"offersBadge_one":   "{{count}} nabídka",
"offersBadge_few":   "{{count}} nabídky",
"offersBadge_other": "{{count}} nabídek"
```

The single exception is dev-only UI behind `__DEV__` — those labels stay in
English and get no keys, since nobody outside the team sees them (see the
"Reset onboarding" row on the Profile screen).

## Writing the copy

- Name things by what the person does, not by how the system works. "Details"
  describes what's inside; the chevron already said "tap this".
- One element, one job. A label labels; do not make it also explain.
- The same action keeps the same name across the whole flow.
- Empty states invite an action. Errors say what happened and what to do, in
  the interface's voice, without apologising.

## Layout traps this codebase has already hit

- **A `Text` with a custom font (Geist, Inter bold weights) needs an explicit
  `lineHeight` and `textAlign="center"` when it sits centred in a fixed-size
  box** — e.g. a single-letter avatar badge. Without it, the glyph renders off
  a font-metric-driven line box that does not match the visual box, and looks
  like it has drifted or clipped out of the circle/square around it. Every
  `Text` variant in `src/components/ui/ui.tsx` already pairs `fontSize` with a
  `lineHeight`; match that when writing an inline style instead of a variant.
- **Buttons have a fixed height.** A label that wraps overflows the pill
  instead of growing it. If a label needs two lines, the layout is wrong, not
  the label.
- **Side-by-side buttons break on narrow screens and in Czech.** Full-width
  stacked is the safer default for a pair of CTAs.
- **Long API text needs `numberOfLines`.** Client messages and job
  descriptions are free text and will otherwise stretch a card to any height.
- **Touch targets are at least 44pt.** Use `minHeight` or `hitSlop`.
- **A `<Sheet modal={false}>`'s content stays mounted while closed.**
  Tamagui's `unmountChildrenWhenHidden` only takes effect for `modal` Sheets —
  it is a silent no-op on `modal={false}` ones, which this app uses
  deliberately (a modal Sheet portals to the app root, which sits *underneath*
  a native fullScreenModal on iOS). An `autoFocus` input inside a non-modal
  Sheet therefore grabs the keyboard as soon as the screen that renders the
  sheet mounts, not when the sheet opens. Drive focus from the `open` prop with
  a ref instead (`NamePromptSheet.tsx` is the reference), and never put
  `autoFocus` on anything inside a `modal={false}` Sheet.

## Accessibility floor

Anything tappable that is not a `Button` gets `accessibilityRole="button"` and
an `accessibilityLabel` that names the action and its subject. Icon-only
controls always need a label — there is no text for a screen reader to fall
back on.
