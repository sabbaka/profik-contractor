# Profik Pro (profik-contractor)

The contractor-side app of the Profik marketplace: cleaning professionals browse open jobs near them, send priced offers, chat with clients, and manage their platform balance. The customer-side app lives in the sibling `profik/` directory; both share the backend in `profik-backend/`.

Built with Expo SDK 54 / React Native 0.81 / Expo Router, Redux Toolkit + RTK Query, and Tamagui.

- **Store title:** Profik Pro
- **Bundle ID / package:** `com.profik.contractor`
- **EAS project:** `40e934e5-f375-4c9d-a65d-de5f48d4ae49` (owner `sabbaka`)

## Getting started

```bash
npm install
```

Create `.env` from `.env.example`:

```bash
EXPO_PUBLIC_API_URL=https://profik-backend.onrender.com   # or your local backend
GOOGLE_MAPS_API_KEY=your_native_google_maps_sdk_key        # used by Android release builds
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_places_web_key
```

Run the dev server:

```bash
npx expo start
```

Note: push notifications require a development build on a physical device (`eas build --profile development`) — they don't work in Expo Go or simulators.

## Project layout

- `app/` — file-based routes (Expo Router): `auth/` login + SMS signup, `(contractor)/(tabs)/` open jobs + my jobs, `jobs/[id]` job detail, `offer-chat/[offerId]`, `balance`
- `src/api/profikApi.ts` — RTK Query API layer (base URL from `EXPO_PUBLIC_API_URL`)
- `src/hooks/usePushNotifications.ts` — push permission + Expo token registration
- `app.config.ts` — app config incl. iOS permission strings and store identifiers

## Build & release

```bash
# Internal test build
eas build --platform ios --profile preview

# Production build (auto-increments build number) and submission
eas build --platform ios --profile production
eas submit --platform ios
```

Store listing metadata (title, descriptions, keywords in en/cs/sk, review notes) is maintained in `store.config.json` and mirrored as Fastlane metadata. See [fastlane/README.md](fastlane/README.md) for pushing metadata to App Store Connect and the remaining pre-submission checklist (demo contractor account, screenshots, age rating, pricing).

Before the first App Store submission, create the App Store Connect app record for `com.profik.contractor`. Once Apple assigns the app ID, add it as `"ascAppId"` under `submit.production.ios` in `eas.json` (the client app uses the same field, e.g. `6759965214`).
