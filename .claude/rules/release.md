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
those words. Preparing a release and performing one are different acts, and only
the first is ever implied.
