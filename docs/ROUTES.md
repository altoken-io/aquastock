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

Locale-aware under `apps/dapp/src/app/[locale]`, wrapped in `DappShell` (`components/dapp-shell.tsx`: logo, theme switcher, language switcher — no navigation yet beyond that).

| URL shape               | Source                          | Purpose                                                                                                                                    |
| ----------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `/{locale}`             | `[locale]/page.tsx`             | **Placeholder home page only** — a title and one line of copy inside `DappShell`. No project list, no wallet-connect, no funding flow yet. |
| `/{locale}/coming-soon` | `[locale]/coming-soon/page.tsx` | Generic maintenance/coming-soon page (unused by any current flow).                                                                         |
| `/api/trpc/[trpc]`      | `app/api/trpc/[trpc]/route.ts`  | Local tRPC route handler (a `hello` procedure only so far).                                                                                |
| `/api/version`          | `app/api/version/route.ts`      | Version/health endpoint.                                                                                                                   |

### Planned (Day 1-4, not yet implemented)

No source file exists for any of these yet — do not treat this as a promise of exact shape or timing.

| Planned surface     | Purpose                                                                                                                      |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Project list / home | Browse water-infrastructure projects.                                                                                        |
| Project detail      | Milestones, funding table split into government vs. community positions, wallet-connect + fund-a-position flow (Solana Pay). |
| My Impact           | Capital → project → milestone → impact timeline for the connected wallet.                                                    |

## Route rules

- Keep localized content routes in their app's `[locale]` subtree; use the app's `next-intl` navigation helpers (`@/lib/i18n/navigation`).
- Validate path/search params, headers, cookies, and request bodies at the server boundary — same rule as any other app, even though this one has no accounts to protect yet.
- There is no separate backend service and no Better Auth session to gate a route on. Once the on-chain program exists, treat wallet-signature verification (not a route existing) as the actual authorization boundary for any funding action.
- Document a route here only after its source file exists. Planned screens belong in `docs/ROADMAP.md`, not this table.
