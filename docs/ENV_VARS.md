# AquaStock environment variables

There is no shared root `.env` — each app reads its own `.env.local`, copied from its own `.env.example`. This doc is a consolidated read; the `.env.example` files are the source of truth.

## Root (`.env.example`)

Index-only — points to `apps/web/.env.example` and `apps/dapp/.env.example`, and notes that off-chain data is served through `apps/dapp`'s own route handlers rather than a separate API service.

## What you actually need for local development

Only two variables are load-bearing right now: `DATABASE_URL`/`DIRECT_URL` (Postgres) and `BETTER_AUTH_SECRET`, and only for `apps/dapp`'s admin-console login (Better Auth's session/user tables) — nothing on the public `apps/web` marketing site touches a database. Everything else below (Resend, PostHog, Upstash, Arcjet) is present in the code but not wired into anything currently reachable on either live site — the contact/newsletter form components that use Resend/Upstash aren't rendered on any page, PostHog's provider no-ops cleanly if its key is unset, and Arcjet is already documented as optional locally. The one exception: `apps/dapp`'s real "Forgot password" flow does call Resend — only matters if you test that specific flow.

## `apps/web/.env.example`

| Variable                                               | Purpose                                                                                                                                                               |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_BASE_URL`                                 | Public URL of the marketing site.                                                                                                                                     |
| `NEXT_PUBLIC_DAPP_URL`                                 | Public URL of `apps/dapp`, for the "Connect wallet"/"Learn more" links. Falls back to the production domain if unset — set it locally or those links leave localhost. |
| `DATABASE_URL` / `DIRECT_URL`                          | Pooled / direct Postgres connection strings for `packages/db-prisma`. Not actually read by anything on the homepage today.                                            |
| `RESEND_API_KEY` / `RESEND_NEWSLETTER_AUDIENCE_ID`     | Contact/newsletter form email delivery — the form components exist but aren't rendered on any live page yet.                                                          |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`  | Form rate limiting — same caveat as Resend above.                                                                                                                     |
| `ARCJET_KEY`                                           | Bot/abuse protection on form submissions (optional locally).                                                                                                          |
| `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` | Analytics — the provider no-ops if unset.                                                                                                                             |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`                 | Search Console ownership verification.                                                                                                                                |

## `apps/dapp/.env.example`

| Variable                                               | Purpose                                                                                                                                                                 |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_BASE_URL`                                 | Public URL of the dApp.                                                                                                                                                 |
| `NEXT_PUBLIC_WEB_URL`                                  | Public URL of `apps/web`, for links back to the marketing site. Same "falls back to prod" caveat.                                                                       |
| `NEXT_PUBLIC_SOLANA_NETWORK`                           | Cluster for the hackathon build — `devnet`. Declared but not yet read anywhere (no wallet-adapter wired up).                                                            |
| `NEXT_PUBLIC_SOLANA_RPC_URL`                           | RPC endpoint for wallet-adapter connect + on-chain reads (once wired). Same "not yet read" caveat.                                                                      |
| `NEXT_PUBLIC_ANCHOR_PROGRAM_ID`                        | Deployed Anchor program id — empty until the program exists (`docs/ROADMAP.md`).                                                                                        |
| `DATABASE_URL` / `DIRECT_URL`                          | Same Postgres as `apps/web` — **required**, backs the admin-console login (Better Auth tables). The investor-facing UI itself reads a static demo dataset, not this DB. |
| `BETTER_AUTH_SECRET`                                   | Admin-console session/cookie signing secret. Optional in dev (placeholder fallback), **required in production**.                                                        |
| `RESEND_API_KEY` / `RESEND_NEWSLETTER_AUDIENCE_ID`     | Only used by the admin console's "Forgot password" reset-link email — optional unless testing that flow.                                                                |
| `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` | Analytics — the provider no-ops if unset.                                                                                                                               |
| `ARCJET_KEY`                                           | Bot/abuse protection (optional locally).                                                                                                                                |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`  | Rate limiting — not currently on any reachable code path (the auth-form rate limiter that uses this isn't wired into the real sign-in/forgot-password forms yet).       |

## Not present (deliberately)

No `STRIPE_*`, `PERSONA_*`, `CROSSMINT_*`, `DLOCAL_*`, `KOYWE_*`, `STELLAR_*`, or `API_URL`/`NEXT_PUBLIC_API_URL` variables — the old backend service and payment providers these belonged to were removed. `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` were also removed (previously referenced by unused `utils/supabase/*` client files left over from the prior project this repo was built from — the database itself is plain Postgres via Prisma, not the Supabase SDK). If a future change reintroduces any of these categories, add the variable to the relevant `.env.example` and `turbo.json`'s `globalEnv`, and document it here.

## Rules

- Never commit a real `.env`/`.env.local` file.
- `.env.example` files describe the shape of required config with placeholder values, never real secrets.
