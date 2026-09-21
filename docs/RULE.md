# AquaStock implementation rules

`CLAUDE.md`/`AGENTS.md` are the repo-wide operating standard. This file records AquaStock-specific choices that are easy to miss when working inside one app.

## Product and safety

- This is a hackathon demo, not a real offering — never let copy, UI, or docs imply otherwise. Every legal-facing surface carries "Demo — this does not constitute an offer of securities" / "Demo — no constituye una oferta de valores."
- Treat token amounts, vesting and claimed figures, pool rules and on-chain addresses as correctness-sensitive. Never show a match as vested, claimed or paid unless the chain says so; amounts are exact BigInt arithmetic (never floats), and typed amounts round up while balances display rounded down.
- Disclose what is real, next to the action it affects: the token's issuer can pause transfers, freeze accounts, move tokens out of any account and change the display multiplier, and the program's upgrade authority is the team's deploy wallet. Label every stand-in (illustrative numbers, demo timescales) as exactly that.
- Never add a server-held signing key, and never move funds from the server. Every write is a transaction the person's wallet signs; a sponsor's off-chain edits are proven by a wallet-signed message.
- Read [ABOUT.md](ABOUT.md) and [TONE.md](TONE.md) before changing public product copy.

## Architecture

- Keep public marketing in `apps/web`, the actual product (wallet-connect, pools, positions, sponsor tools, operator console) in `apps/dapp`. There is no `apps/api` and no `apps/mobile` in this repo — don't invent server-authority code that assumes either exists.
- Keep feature-specific code in its owning app. Promote code to `packages/*` only after it has a stable, genuinely cross-consumer contract.
- `packages/db-prisma/prisma/schema.prisma` and its checked-in migrations are the off-chain database source of truth, for descriptive pool text and the verified activity feed only: on-chain state always wins, and Prisma rows are a display cache. Follow [ARCHITECTURE.md](ARCHITECTURE.md).
- `apps/dapp` accesses the database and any future on-chain program directly through its own Next.js route handlers — there's no separate backend to delegate privileged operations to.
- Validate all untrusted input (wallet addresses, amounts, form data) at the server boundary with explicit schemas.

## React and UI

- Server-render by default in both apps. Add client components only for interaction, browser APIs, stateful providers, or motion.
- Reuse local primitives/components before adding a new one — check [COMPONENTS.md](COMPONENTS.md) first. Don't assume similarly named components in `apps/web` and `apps/dapp` are interchangeable; they're separate trees.
- Use Tailwind semantic tokens and the palette in [VISUAL.md](VISUAL.md). Avoid one-off arbitrary colors or inline styles when a token/utility fits.
- Keep empty, loading, error, and disabled states covered for anything a user can actually reach.
- Preserve keyboard focus, accessible labels, contrast, and reduced-motion behavior.

## Routes, content, and assets

- Use the locale-aware navigation helpers for both apps' routes. Preserve `en`/`es` parity when adding a string namespace — `apps/dapp/src/lib/i18n/locale-parity.test.ts` enforces this in CI.
- Don't document or market a planned screen as live. [ROUTES.md](ROUTES.md) maps what actually exists; [ROADMAP.md](ROADMAP.md) describes direction.
- Use only assets from the owning app's own public tree, and treat everything currently in [ASSETS.md](ASSETS.md) as inherited placeholder art, not approved AquaStock branding.

## Validation

- Format changed docs/code with `pnpm format`.
- Run the narrowest relevant lint/typecheck/test first; broaden to `pnpm check` when a shared package changes.
- Don't run dependency-adding commands or change the lockfile without user direction; `pnpm install` to sync an existing lockfile is fine.
- Don't use destructive Git commands to clear unrelated work.
