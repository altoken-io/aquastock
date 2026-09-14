# AquaStock route map

An implementation map, not a promise of what's built — several rows below are explicitly marked not-yet-implemented. Verify against the actual route files before relying on this for anything beyond orientation.

## Public web (`apps/web`)

Locale-aware under `apps/web/src/app/(frontend)/[locale]`, using `next-intl` with `en`/`es`.

| URL shape                                              | Source                                               | Purpose                                                                                      |
| ------------------------------------------------------ | ---------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `/{locale}`                                            | `[locale]/page.tsx`                                  | Marketing homepage: Hero, How It Works, Use Cases, FAQ, Early Access CTA sections.           |
| `/{locale}/privacy`                                    | `[locale]/privacy/page.tsx`                          | Privacy Policy (placeholder content).                                                        |
| `/{locale}/terms`                                      | `[locale]/terms/page.tsx`                            | Terms of Service (placeholder content, carries the "not an offer of securities" disclaimer). |
| `/api/trpc/[trpc]`                                     | `(backend)/api/trpc/[trpc]/route.ts`                 | Local tRPC route handler (a `hello` procedure only so far).                                  |
| `/manifest.webmanifest`, `/robots.txt`, `/sitemap.xml` | `app/manifest.ts`, `app/robots.ts`, `app/sitemap.ts` | Standard Next.js SEO endpoints.                                                              |

### Not yet implemented

No project-browsing, funding, or dashboard UI exists on the public site — that lives in `apps/dapp`.

## dApp (`apps/dapp`)

Locale-aware under `apps/dapp/src/app/[locale]`. Two separate shells, chosen
per page rather than shared in `layout.tsx` (see `docs/COMPONENTS.md`):
`PublicShell` (investor-facing: real nav, theme/language switchers, the
sandbox-demo notice) and `DashboardShell` (staff admin console: dark-first
sidebar). `AuthShell` wraps the auth pages with its own split-panel layout.
All investor-facing project/funding/impact content below is backed by
**static demo data** (`src/lib/demo/*`), not a live database or the Solana
program — see `docs/ROADMAP.md`; there is still no wallet-adapter, no
on-chain program, and no route handlers over `packages/db-prisma`.

**`/` is the login page, not a marketing home** — `apps/dapp` has no
marketing/pitch content at all; that lives exclusively in `apps/web`. See
memory: dapp-home-is-login.

| URL shape                        | Source                                   | Purpose                                                                                                                               |
| -------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `/{locale}`                      | `[locale]/page.tsx`                      | Staff/government admin console sign-in (the app's home route). No public sign-up — see memory: better-auth-scope.                     |
| `/{locale}/projects`             | `[locale]/projects/page.tsx`             | Browse every demo project. The de facto investor landing (linked from the shell's brand mark).                                        |
| `/{locale}/projects/{slug}`      | `[locale]/projects/[slug]/page.tsx`      | Project detail: funding split (government/community), milestone timeline, impact records, demo "fund"/Explorer CTAs.                  |
| `/{locale}/impact`               | `[locale]/impact/page.tsx`               | My Impact: empty state (no wallet-connect yet) + a worked example from the demo dataset.                                              |
| `/{locale}/forgot-password`      | `[locale]/forgot-password/page.tsx`      | Admin password-reset request.                                                                                                         |
| `/{locale}/reset-password`       | `[locale]/reset-password/page.tsx`       | Admin password-reset completion (token in the URL).                                                                                   |
| `/{locale}/dashboard`            | `[locale]/dashboard/page.tsx`            | Admin command center: KPI stats, milestone-verification queue, recent activity, projects table. Session-gated.                        |
| `/{locale}/dashboard/projects`   | `[locale]/dashboard/projects/page.tsx`   | Admin: every project in the demo dataset. Session-gated.                                                                              |
| `/{locale}/dashboard/milestones` | `[locale]/dashboard/milestones/page.tsx` | Admin: every milestone awaiting verification, across projects. "Mark verified" stays disabled — no Anchor program yet. Session-gated. |
| `/api/auth/[...all]`             | `app/api/auth/[...all]/route.ts`         | Better Auth route handler (email/password only).                                                                                      |
| `/api/trpc/[trpc]`               | `app/api/trpc/[trpc]/route.ts`           | Local tRPC route handler (a `hello` procedure only so far).                                                                           |
| `/api/version`                   | `app/api/version/route.ts`               | Version/health endpoint.                                                                                                              |

### Planned (Day 2-4, not yet implemented)

No source file exists for any of these yet — do not treat this as a promise
of exact shape or timing.

| Planned surface                          | Purpose                                                                                                                             |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Wallet-connect + fund-a-position         | Real Solana wallet adapter wiring behind the project detail page's (currently disabled, demo-labeled) "Fund this position" control. |
| Live milestone verification              | Wiring `/dashboard/milestones`' "Mark verified" control to the Anchor program once it exists, replacing the demo dataset.           |
| Route handlers over `packages/db-prisma` | Serving real project/position/milestone/impact data instead of `src/lib/demo/*`'s static dataset.                                   |

## Route rules

- Keep localized content routes in their app's `[locale]` subtree; use the app's `next-intl` navigation helpers (`@/lib/i18n/navigation`).
- Validate path/search params, headers, cookies, and request bodies at the server boundary — same rule as any other app.
- `src/proxy.ts` guards `/dashboard/*` by cookie presence (optimistic); each `/dashboard/*` page itself calls `requireAdminSession()` (`src/lib/auth/require-admin-session.ts`) for the real `auth.api.getSession` check — defense in depth.
- There is no separate backend service. Once the on-chain program exists, treat wallet-signature verification (not a route existing) as the actual authorization boundary for any funding action.
- Document a route here only after its source file exists. Planned screens belong in `docs/ROADMAP.md`, not this table.
