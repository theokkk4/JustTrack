# JustTrack

**Track food. Track progress. Just Track.**

A free calorie and macro tracker made in Philadelphia for college students — and anyone else. No account, no ads, no subscription. Your log lives on your device; nothing is uploaded.

- **Snap your meal.** Photograph your plate and an AI estimate names what's on it and sizes the portions. You review and fix it before anything is logged, and it's always labeled *Estimated*.
- **Scan a barcode** for packaged foods (Open Food Facts).
- **Search** 5,000+ everyday foods with real portions ("1 cup", "1 medium") from the USDA database that ships inside the app — instant and offline.
- **Fast food, by name.** The menus of the 20 biggest U.S. chains (McDonald's, Starbucks, Chick-fil-A, Chipotle, Taco Bell…) — 6,000+ items with calories and macros — are bundled too. Type "chipotle chicken bowl" or "cfa spicy sandwich", and when the scanner recognizes a chain's cup or wrapper it snaps the item to the menu's real nutrition instead of estimating.
- A daily calorie goal, by hand or estimated from a few body stats, optional macro targets, and a *Today* view with a balance score and calories by meal.

Open source under the MIT license.

## Run it

```bash
npm install
npx expo start          # press w for the browser, or scan the QR code with Expo Go on your phone
```

That's it for the app — it needs no keys. The photo scanner needs one server-side key (see Deploying).

```bash
npm run typecheck       # tsc --noEmit
npm run lint            # expo lint
npm test                # jest
```

## How it works

| Piece | Where |
| --- | --- |
| Screens (Expo Router) | `app/` — tabs: Home, Today, Scan, Profile; modals for Add Food, Edit Entry, Scan Review, Barcode, Goal |
| The log and settings | `lib/log/`, `lib/settings/` — in-memory stores mirrored to on-device storage (`localStorage` on the web) |
| Nutrition math | `lib/nutrition/` — portion scaling, calorie targets (Mifflin–St Jeor), the balance score |
| Food data | `lib/food/` — the bundled USDA database and chain menus with their ranking, Open Food Facts, category tints |
| Photo scan | `hooks/useMealScan.ts` → `lib/scan/` → `api/analyze-meal.ts` |
| Server functions (Vercel) | `api/analyze-meal.ts` (AI estimate, holds the key), `api/foods.ts` (packaged-food search proxy) |

The USDA data is public domain (FoodData Central, FNDDS). Rebuild `assets/data/usda-foods.json` from a newer release with `node scripts/build-food-database.js path/to/surveyDownload.json`. Open Food Facts data is ODbL. Chain menus come from the FatSecret Platform API: refresh `assets/data/chain-foods.json` with `FATSECRET_KEY=… FATSECRET_SECRET=… node scripts/build-chain-foods.js` (credentials stay in your shell; nothing in the app calls FatSecret). The app credits all three wherever food data is shown.

## Deploying (Vercel)

The web app and its two functions deploy together from this repository.

1. Import the repository on [vercel.com](https://vercel.com/new). `vercel.json` already sets the build (`npx expo export --platform web` → `dist/`).
2. In the project's **Settings → Environment Variables**, add `GEMINI_API_KEY` (a Google AI Studio key; optionally `GEMINI_MODEL`, default `gemini-3.5-flash-lite`). Without it the photo scanner shows "isn't set up on this server yet"; everything else works.
3. Deploy. Open the URL on your phone — add it to the home screen for an app-like feel.

The key never ships in the app: `api/analyze-meal.ts` is the only code that sees it. Photos are sent to Gemini for analysis with storage turned off and are not kept. Note that on Google's free tier, requests may be used to improve their products; a paid key avoids that. The function rate-limits per address; for a public launch, add Vercel's firewall rate limiting as well.

## iOS

The same code builds as a native iOS app with EAS (`eas build --platform ios`). A native build needs `EXPO_PUBLIC_API_BASE_URL` set to the deployed web URL so it can reach the functions; the barcode scanner on iOS is still to come (the web scanner uses the browser camera).

## Privacy

There is no account and no analytics. The log, goals, and name are stored only on the device. Meal photos are sent to the analysis function and are not kept. See `app/(tabs)/profile.tsx` for what the app tells users.
