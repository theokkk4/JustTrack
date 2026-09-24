# JustTrack

**Track food. Track progress. Just Track.**

JustTrack is a free, open-source calorie and macro tracker for iPhone, built for speed: open the app, scan or search, confirm, done. No ads, no subscriptions, no analytics.

> **Status:** early development. Accounts (email + Sign in with Apple), onboarding with personalized calorie targets, and the secured database are in place; food search and scanning are being built next.

## Stack

- [Expo](https://expo.dev) (SDK 57) + React Native + TypeScript
- [Expo Router](https://docs.expo.dev/router/introduction/) for navigation
- [Supabase](https://supabase.com) for auth, Postgres, and Edge Functions
- [EAS Build / Submit](https://docs.expo.dev/eas/) for iOS builds and TestFlight — no local Xcode required

## Development

```bash
npm install
cp .env.example .env   # then fill in your Supabase URL and anon key
npx expo start
```

Scan the QR code with your iPhone camera to open the app in Expo Go.

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # expo lint
npm test            # jest
```

## Project layout

```text
app/            Screens and navigation (Expo Router)
components/     UI kit (ui/), food, nutrition, scanner, navigation
constants/      Design tokens, icons, brand, nutrition defaults
contexts/       Theme, preferences, diary state
hooks/          Data and utility hooks
lib/            Supabase client, nutrition math, API wrappers
services/       App-level data logic
utils/          Formatting, dates, units
supabase/       Database migrations and Edge Functions
```

## License

[MIT](LICENSE). Note that the app's source is open, but third-party data it uses (such as the food database) is subject to its providers' own terms.
