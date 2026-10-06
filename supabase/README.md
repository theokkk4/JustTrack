# JustTrack backend (Supabase)

```text
supabase/
  migrations/   Postgres schema, row level security, and RPC functions (applied in order)
  tests/        SQL checks you can run against any JustTrack database
  functions/    Edge Functions (FatSecret proxy, AI meal analysis)
```

## Security model

Every table holds a `user_id` and has row level security enabled. Signed-in users can only
read and write their own rows; signed-out clients get nothing. Child rows (`meal_items`,
`saved_meal_items`) reference their parent by `(id, user_id)`, so an item can never be
attached to someone else's meal. `supabase/tests/rls_isolation.sql` verifies all of this —
paste it into the SQL editor and look for `RLS CHECKS PASSED` in the (intentional) error.

Account deletion (`delete_my_account()`) removes the auth user; every table cascades from it.

## Dashboard settings

These live in the Supabase dashboard rather than in migrations.

**Authentication → Sign In / Providers → Apple**

- Enable the provider.
- Under **Client IDs**, add `com.theokkk4.justtrack` (the iOS bundle identifier) and
  `host.exp.Exponent` (only needed to test Sign in with Apple inside Expo Go).
- Native sign-in doesn't need the OAuth "Secret Key" fields; leave them empty.

**Authentication → URL Configuration → Redirect URLs**

- Add `justtrack://**` so confirmation and password-reset emails open the app.
- Add `exp://**` while developing in Expo Go.
- Add `http://localhost:8081/**` to test sign-up and password reset in the web build (`npx expo start --web`).

**Authentication → Sign In / Providers → Email**

Supabase's built-in mailer is heavily rate limited and meant for testing. Before inviting
testers who'll sign up with email, either set up custom SMTP (Authentication → Emails →
SMTP Settings) or turn off **Confirm email**. Sign in with Apple is unaffected either way.

**Edge Function secrets** (Edge Functions → Secrets)

| Name | Value | Used by |
| --- | --- | --- |
| `FATSECRET_CLIENT_ID` | FatSecret **Client ID** (the same value is the OAuth 1.0 *Consumer Key*) | Food search and details |
| `FATSECRET_CONSUMER_SECRET` | FatSecret **Consumer Secret** (OAuth 1.0) — *not* the Client Secret | Food search and details |
| `FATSECRET_CLIENT_SECRET` | Optional: FatSecret **Client Secret** (OAuth 2.0) | Only used if no Consumer Secret is set |
| `ANTHROPIC_API_KEY` | Anthropic API key | AI meal scanner |

Find the FatSecret values at platform.fatsecret.com → *My Account* → *API Keys*. Use the
OAuth 1.0 Consumer Secret: FatSecret only applies its IP allow-list to OAuth 2.0, and Edge
Functions don't run from fixed IP addresses, so OAuth 2.0 calls from them get rejected
unless your key's allow-list is open (Premier keys can allow ranges; Basic keys can't).

These are server-only. Never put them in `.env` with an `EXPO_PUBLIC_` prefix, and never
paste them into chat or commit them.

## Edge Functions

| Function | Does |
| --- | --- |
| `fatsecret-search` | Searches FatSecret's food database |
| `fatsecret-food` | Looks up full nutrition for up to 50 FatSecret food IDs, through a cache that's purged before content turns 24 hours old |
| `fatsecret-barcode` | Barcode lookup (FatSecret Premier only; Open Food Facts fallback lands with the scanner) |

Each one checks the caller's Supabase session itself, so they're deployed without the
gateway's JWT check (which doesn't understand the project's new asymmetric keys):

```bash
npx supabase functions deploy fatsecret-search --no-verify-jwt
npx supabase functions deploy fatsecret-food --no-verify-jwt
npx supabase functions deploy fatsecret-barcode --no-verify-jwt
```

Unit tests for the shared code run under Deno: `deno test supabase/functions`.

## Setting up a fresh project

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push          # applies supabase/migrations
```

Then copy the project URL and publishable key into `.env` (see `.env.example`).
