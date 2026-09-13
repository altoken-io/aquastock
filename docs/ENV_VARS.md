# AquaStock environment variables

There is no shared root `.env` — each app reads its own `.env.local`, copied from its own `.env.example`. This doc is a consolidated read; the `.env.example` files are the source of truth.

## Root (`.env.example`)

Index-only — points to `apps/web/.env.example` and `apps/dapp/.env.example`, and notes that off-chain data is served through `apps/dapp`'s own route handlers rather than a separate API service.

## `apps/web/.env.example`

| Variable                                               | Purpose                                                               |
| ------------------------------------------------------ | --------------------------------------------------------------------- |
| `NEXT_PUBLIC_BASE_URL`                                 | Public URL of the marketing site.                                     |
| `DATABASE_URL` / `DIRECT_URL`                          | Pooled / direct Postgres connection strings for `packages/db-prisma`. |
| `RESEND_API_KEY` / `RESEND_NEWSLETTER_AUDIENCE_ID`     | Contact/newsletter form email delivery.                               |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`  | Form rate limiting.                                                   |
| `ARCJET_KEY`                                           | Bot/abuse protection on form submissions (optional locally).          |
| `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` | Analytics.                                                            |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`                 | Search Console ownership verification.                                |

## `apps/dapp/.env.example`

| Variable                                               | Purpose                                                                          |
| ------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_BASE_URL`                                 | Public URL of the dApp.                                                          |
| `NEXT_PUBLIC_SOLANA_NETWORK`                           | Cluster for the hackathon build — `devnet`.                                      |
| `NEXT_PUBLIC_SOLANA_RPC_URL`                           | RPC endpoint for wallet-adapter connect + on-chain reads (once wired).           |
| `NEXT_PUBLIC_ANCHOR_PROGRAM_ID`                        | Deployed Anchor program id — empty until the program exists (`docs/ROADMAP.md`). |
| `DATABASE_URL` / `DIRECT_URL`                          | Same Postgres as `apps/web`.                                                     |
| `RESEND_API_KEY` / `RESEND_NEWSLETTER_AUDIENCE_ID`     | Contact/newsletter form email delivery.                                          |
| `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` | Analytics.                                                                       |
| `ARCJET_KEY`                                           | Bot/abuse protection (optional locally).                                         |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`  | Rate limiting.                                                                   |

## Not present (deliberately)

No `BETTER_AUTH_*`, `STRIPE_*`, `PERSONA_*`, `CROSSMINT_*`, `DLOCAL_*`, `KOYWE_*`, `STELLAR_*`, or `API_URL`/`NEXT_PUBLIC_API_URL` variables — the old backend service, payment providers, and auth system these belonged to were removed. If a future change reintroduces any of these categories, add the variable to the relevant `.env.example` and `turbo.json`'s `globalEnv`, and document it here.

## Rules

- Never commit a real `.env`/`.env.local` file.
- `.env.example` files describe the shape of required config with placeholder values, never real secrets.
