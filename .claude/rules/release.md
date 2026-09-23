# Releases

The full procedure is in the README under **Build & release**. This file is the
part that is easy to get wrong, and was got wrong repeatedly before the setup
below existed.

## One number, in one place

The version lives in `package.json` and nowhere else. `app.config.ts` reads it
from there (`const { version } = require('./package.json')`), and so does
`fastlane/Deliverfile`.

```bash
npm version patch   # bumps package.json and the lockfile together
```

Never hand-edit a version string. A bump typed into `app.config.ts` or a
store config drifts from `package.json` on the next `npm version`, and the
repository has a `chore(release): sync package.json to 1.0.12` commit that
exists purely to undo that.

## Build numbers are not yours

`eas.json` sets `cli.appVersionSource: "remote"` and `autoIncrement: true` on
the production profile. **EAS owns `buildNumber` (iOS) and `versionCode`
(Android)** and increments one per production build.

Do not add `ios.buildNumber` or `android.versionCode` to `app.config.ts`, and do
not "fix" a mismatch by writing one in. Those fields are ignored under remote
versioning, so the edit does nothing except look authoritative to the next
reader. To find out what actually went to a store:

```bash
eas build:version:get --platform ios
```

There is a real constraint underneath: Google Play refuses a `versionCode` it
has already seen, even on a different track. That is what makes a hand-managed
counter expensive to get wrong, and why the counter was handed to EAS.

## Releasing is a pushed tag

A tag `v<version>` triggers `.eas/workflows/release.yml`, which builds both
platforms and submits each to its store. Android goes to the **alpha** track,
iOS to TestFlight via App Store Connect.

Consequences worth stating plainly before you tag:

- **A tag is a submission**, not a build. It reaches a store review queue.
- Tag only what is committed and pushed. The workflow builds the tag, not your
  working tree.
- Signing credentials come from EAS, not from the repository. A path to a key
  file in `eas.json` is a bug — the Play service-account key was moved to EAS
  credentials for exactly this reason.

## Over-the-air updates

Both apps carry `expo-updates`, a manifest URL and
`runtimeVersion: { policy: "appVersion" }` in `app.config.ts`. A published
update downloads in the background and takes effect on the **next** cold start,
so a change appears on the second launch after it is published and never on the
first. There is no banner and no restart prompt; that is deliberate, because
reloading mid-session would discard a half-filled form.

A tag is still a submission. An update is not a release — it is faster than one,
which is the whole point and also the reason it deserves more care, not less.

### The version is the audience

`runtimeVersion` resolves to `version` from `package.json`, and an update only
reaches builds whose version string matches it exactly. Two consequences:

- **`npm version` and `eas update` do not mix.** After a bump, an update targets
  a runtime version no phone is running yet. It publishes, EAS reports success,
  and nobody receives it. Nothing anywhere reports this as a problem.
- **To fix a version that is in a store, publish from a tree at that version.**
  If `main` has already moved on, branch from the release tag, cherry-pick the
  fix, and publish from there.

Nothing built before this setup landed can be reached at all — those binaries
have no updater compiled into them, and no publish will ever change that. The
first build that can receive an update is the first one built with
`expo-updates` present.

### What an update cannot carry

It carries a JS bundle and its assets: everything under `app/` and `src/`, the
locale files, tamagui tokens, images imported from JS. It does not carry:

- a native dependency added, removed or version-bumped — any `expo-*` module,
  `react-native-maps`, `@sentry/react-native`;
- a `plugins` entry, or any prop passed to one — permission strings, the
  notification icon, the splash configuration;
- anything under `ios.*` or `android.*` in `app.config.ts` — bundle id, scheme,
  `newArchEnabled`, `infoPlist`, adaptive icons, the Google Maps key;
- the app icon and splash image, which the plugins bake into the binary.

The test is one question: **would this change alter the output of
`npx expo prebuild --clean`?** If yes it is a build, not an update. Shipped as
an update it produces a white screen, or a crash at the first call into a module
the installed binary does not contain.

The cheap gate, before every publish:

```bash
git diff v<last-release>..HEAD -- package.json package-lock.json app.config.ts
```

A non-empty diff means this is not an update.

### Publishing

```bash
eas update --branch production --environment production --message "<what>"
eas env:exec production -- npx sentry-expo-upload-sourcemaps dist
```

Both lines are load-bearing.

**`--environment production` is not optional.** There is no default. Without it
the bundle is built against your local `.env`, and `EXPO_PUBLIC_API_URL` is
baked into the JS at bundle time — an update published from a laptop pointed at
a local backend would send every user there, silently, with no way to tell from
the EAS output.

**The Sentry step is separate and manual.** The `@sentry/react-native/expo`
plugin is a prebuild-time mod: it installs an Xcode build phase and a gradle
hook, and neither of them runs during `eas update`. Symbolication today works
only because a native build happens. Without this upload, every stack trace from
OTA-delivered code arrives minified. `eas update` leaves the sourcemaps it
generated in `dist/` — upload those, and do not re-export in between or the
debug ids stop matching the bundle people are running. `SENTRY_ALLOW_FAILURE` is
a build env var and does not apply here; this step fails loudly, which is the
right trade when nothing has shipped yet.

Channels map to build profiles in `eas.json`: `production` on the production
profile, `preview` on every other one. Stage on `preview` first —
`eas build --profile preview` is a release build (an APK, or an iOS simulator
app compiled on EAS), so it is the only way to exercise the real update path
without a store round trip. The `development` and `simulator` profiles are dev
clients; `expo-updates` is disabled in them and they still load from metro.

Ship a risky change gradually:

```bash
eas update --branch production --environment production --rollout-percentage 10 --message "<what>"
eas update:edit            # raise the percentage once Sentry stays quiet
```

### Rolling back

```bash
eas update:list --branch production                     # find a known-good group
eas update:republish --branch production --group <ID>   # preferred
eas update:roll-back-to-embedded --branch production    # back to the store bundle
eas channel:pause production                            # stop serving anything at all
```

Do not roll back by publishing a fresh `eas update`. That re-bundles the working
tree — the state that just broke — and ships a second unverified build under
time pressure.

Rollback is not instant, and it does not rescue a crash on launch: a client runs
the bad bundle first and checks for an update afterwards. That asymmetry is why
`preview` exists.

### Do not add `expo-updates` to `plugins`

`@expo/prebuild-config` applies it to every installed SDK package already. A
manual entry does nothing except look authoritative to the next reader — the
same class of mistake as writing `buildNumber` into `app.config.ts`.

## Builds that are not releases

Use a profile directly; none of these submit anything.

```bash
eas build --platform android --profile apk        # installable Android test build
eas build --platform ios --profile simulator      # dev client for the iOS simulator
```

The `simulator` profile exists because local iOS builds do not currently
compile on every machine here — Expo SDK 57 ships `expo-modules-jsi`, whose
`RuntimeScheduler.h` uses an annotation older Swift toolchains reject. It
produces a `.tar.gz`; unpack it and install the `.app`:

```bash
xcrun simctl install booted <path>.app
```

It is a development client, so it needs metro (`npx expo start --dev-client`).
Unlike Expo Go it carries the native modules, which is what makes push
notifications testable.

A store `.ipa` will not run on a simulator — wrong architecture slice and a
provisioning profile it cannot satisfy. Do not try to reuse a production
artifact for this.

## Claude does not release

Do not run `npm version`, create a tag, or push one unless the user asks in
those words. The same holds for `eas update`, `eas update:republish`,
`eas update:roll-back-to-embedded` and `eas channel:*` — an update reaches users
without passing a review queue first, which makes publishing one more immediate
than tagging, not less. Preparing a release and performing one are different
acts, and only the first is ever implied.
