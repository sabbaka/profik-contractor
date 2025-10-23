# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

---

## Quick Start (Contractor app)

- **[Requirements]** Node 18+, npm 9+, Expo CLI
- **[Install]**

```bash
npm install
```

- **[Environment]** Create `.env` from `.env.example` and set:

```bash
EXPO_PUBLIC_API_URL=https://your-backend.example.com
GOOGLE_MAPS_API_KEY=your_native_google_maps_key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_browser_key_optional
```

- **[Run]**

```bash
npx expo start -c
```

- **[Routing]** File-based routes under `app/` using Expo Router:

  - `app/_layout.tsx` provides providers and auth gate
  - `app/(contractor)/open/map.tsx` Map view (native uses `react-native-maps`, web fallback)
  - `app/(contractor)/open/index.tsx` Open Jobs list
  - `app/(contractor)/jobs/[id].tsx` Job Details

- **[Maps]**

  - Native maps via `react-native-maps` guarded (no web import).
  - Components split: `components/OpenJobsMap.native.tsx` and `.web.tsx`.

- **[Config]**

  - `app.config.ts` (if present) or `app.json` should source Google Maps key from env.
  - API base URL is `EXPO_PUBLIC_API_URL` in `src/api/profikApi.ts`.

- **[Builds]**

  - Move secrets to EAS and build:

```bash
eas build --platform ios --profile preview
eas build --platform android --profile preview
