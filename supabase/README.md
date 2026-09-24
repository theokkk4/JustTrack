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

**Authentication → Sign In / Providers → Email**

Supabase's built-in mailer is heavily rate limited and meant for testing. Before inviting
testers who'll sign up with email, either set up custom SMTP (Authentication → Emails →
SMTP Settings) or turn off **Confirm email**. Sign in with Apple is unaffected either way.

**Edge Function secrets** (Project Settings → Edge Functions → Secrets)

| Name | Used by |
| --- | --- |
| `FATSECRET_CLIENT_ID` / `FATSECRET_CLIENT_SECRET` | Food search, food details, barcode lookup |
| `ANTHROPIC_API_KEY` | AI meal scanner |

These are server-only. Never put them in `.env` with an `EXPO_PUBLIC_` prefix.

## Setting up a fresh project

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push          # applies supabase/migrations
```

Then copy the project URL and publishable key into `.env` (see `.env.example`).
