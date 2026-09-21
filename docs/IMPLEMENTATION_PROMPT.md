# Implementation prompt — Match Pools

Paste everything below the horizontal rule into a new Claude Code session, with the decisions in section 2 filled in.

---

You are implementing the AquaStock pivot to "Match Pools" end to end for the Stocklana hackathon (deadline Fri 2026-09-25, 4:00 PM ET; feature freeze Thu 2026-09-24). Work as a senior full-stack and Solana engineer to enterprise standard. This code is money-adjacent and security-sensitive: correctness and honesty beat speed.

## 1. Read first, in order, before writing any code

1. `CLAUDE.md` / `AGENTS.md` (these override your defaults) and `docs/RULE.md`
2. `.context/repo/map.md` (a navigation aid; verify it against the actual files)
3. `docs/PIVOT_PLAN.md` (the spec: product, program design, SPYx findings, plan, env vars, and the gaps in section 10)
4. `docs/DEMO_SCRIPT.md` (what the finished demo must be able to do)
5. `docs/ARCHITECTURE.md`, `ROUTES.md`, `DATABASE.md`, `ENV_VARS.md`, `COMPONENTS.md`, `VISUAL.md`, `TONE.md`, `ASSETS.md`
6. `apps/dapp/PRODUCT.md`, `apps/dapp/DESIGN.md`, `apps/web/PRODUCT.md`
7. Your memory index, especially dapp-home-is-login and better-auth-scope.

Where the docs disagree with the code, trust the code and tell me. Where the water-funding docs conflict with `docs/PIVOT_PLAN.md`, the plan wins.

## 2. Decisions (fill in before sending)

- Pivot approved: [YES / NO]
- Demo network: [hard-capped mainnet plus a devnet replica mint (recommended) / devnet only]
- Team and ownership: [FILL IN]
- Name: [keep AquaStock and the water/confluence metaphor / rename to ___]
- Program upgrade authority: [keep the deployer and disclose it / multisig / burn]
- How savers get SPYx: [link out to Jupiter / in-app swap]

If any field is blank, use the recommended default, state it, and move on. Do not block on it.

## 3. Hard constraints

- Never read, open, print or grep `.env` or `.env.*` (only `.env.example` is allowed). Never ask for, handle or print private keys or seed phrases. Keypairs stay in my `~/.config/solana`.
- I run any mainnet deploy and any transaction that moves real funds. Give me the exact commands and the expected output, then wait.
- `pnpm install` is fine. For anything that adds, removes or upgrades a package, do not run it. At the start of each phase, give me ONE consolidated list of exact `pnpm add` commands with pinned versions (wallet-adapter, `@coral-xyz/anchor`, `@solana/spl-token`, Playwright, and so on) and wait for me.
- Installing the Solana CLI and Anchor changes my machine. Ask first, then give me the commands to run with the `!` prefix.
- Do not commit or push unless I ask. Work on the branch `feat/match-pools`.
- `apps/dapp`'s `/` stays the admin login page. Marketing content lives only in `apps/web`. Better Auth stays admin and operator only. Savers and sponsors use wallet-connect only: no accounts, no KYC.
- Honesty: this is a demo. Do not build, label or market anything as live that is not. Every legal-facing surface carries "Demo — this does not constitute an offer of securities" / "Demo — no constituye una oferta de valores." Label the demo vesting timescale in the UI. Disclose the issuer's powers over the asset (pause, permanent delegate, freeze) in the UI. Never show a match as vested or claimed before the chain says so.
- Do not invent facts (mint addresses, program IDs, API behavior). Re-read the SPYx mint's extensions over RPC before relying on them. Check the Pyth and Jupiter docs before assuming key requirements.

## 4. Order of work, with gates

- **Phase 0, orientation.** Read the docs. Verify the map against the code. Write a brief plan (files, risks). Check the toolchain state.
- **Phase 1, Day-0 spike. GATE.** Build a replica Token-2022 mint with SPYx's exact extension set (scaled UI amount, pausable, permanent delegate, default account state, transfer hook set to null, metadata). Prove deposit and withdraw round-trip in an Anchor test, including a paused mint and a multiplier change mid-vest. Report the results before doing anything else. If it does not work, stop and tell me.
- **Phase 2, Anchor program.** Put it in `programs/` with an `Anchor.toml`, and keep the Rust out of the pnpm workspace. Add root scripts for build and test. Freeze the interface (accounts, instructions, errors, events, IDL) before any UI work starts.
- **Phase 3, data and server.**
  - Migrate the Prisma schema from `Project`/`Milestone` to `Pool` and vesting data. Validate it on the local docker Postgres, not on Neon. Use the `supabase-postgres-best-practices` skill for schema and migration hygiene (it applies to any Postgres).
  - Update `packages/types`. Write route handlers with explicit zod validation at the boundary. Read on-chain state with `getProgramAccounts`.
  - Neon: `DATABASE_URL` is the pooled URL and `DIRECT_URL` is the direct URL.
- **Phase 4, wallet and product UI.** See section 6.
- **Phase 5, content and docs.**
  - Keep en/es parity in `packages/locales`. Rewrite the marketing site in `apps/web`. Delete the dead `utils/supabase/*` files.
  - Update the docs listed in `docs/PIVOT_PLAN.md` section 10, and `.context/repo/map.md`, as each feature lands, not before.
  - Register every new env var in `.env.example`, in `turbo.json` `globalEnv`, and in `docs/ENV_VARS.md`.
- **Phase 6, validation and demo readiness.** See section 7.

If you fall behind, use the cut order in `docs/PIVOT_PLAN.md` section 5. Never cut deposit, vest, claim, forfeit-on-withdraw, or a working demo. Once the program interface is frozen, you may use subagents or worktrees for independent tracks (program and UI).

## 5. Engineering standards

**Anchor and Rust**

- Use `anchor_spl::token_interface` and `transfer_checked`. On `create_pool`, validate the mint: allow-list constant, Token-2022 program, decimals, and required and forbidden extensions. Reject an enabled transfer hook. Document each accepted extension.
- Use checked arithmetic (u128 intermediates, `checked_*`). No `unwrap`, `expect` or panics in instruction paths. Use an explicit error enum and emit an event for every state change.
- Validate accounts strictly: seeds and bump, `has_one`, `token::mint` and `token::authority`, no unchecked `remaining_accounts`. Update state before CPIs, close accounts safely, and take time only from `Clock`.
- Test these invariants: vested never exceeds reserved; reserved plus claimed conserves the budget; forfeiture returns exactly the unvested amount; no double claim; no over-cap deposit.
- Cover the failure paths: unauthorized caller, wrong mint, over cap, budget exhausted, double claim, withdraw after claim, paused mint, and sponsor reclaim before the pool ends. Add property-style tests for the vesting math. Do not add a fuzzing framework.
- Comment only non-obvious logic and tradeoffs, especially the issuer-risk assumptions.

**Next.js and TypeScript**

- Render on the server by default. Use client components only for wallet, interaction and motion. Follow the `vercel-react-best-practices` skill. There is no `next-best-practices` skill here, so use the CLAUDE.md fallback.
- No casual `as` casts. Use type guards, and `unknown` for untrusted data. Validate wallet addresses and amounts on the server. Read env through `lib/env`. Put nothing secret in `NEXT_PUBLIC_*`.
- Put the UI-to-raw amount conversion (the scaled multiplier) in one tested pure utility. Use BigInt or decimal-safe math, never floats for token amounts.
- Follow existing patterns and packages. Apply YAGNI.
- Cover loading, empty, error, disabled and paused states on every reachable screen.
- Rate-limit routes that accept input using the existing Arcjet and Upstash code, but check that it is actually wired before assuming.

## 6. UX/UI and motion

- Before any UI work, read `.claude/skills/frontend-design/SKILL.md` (it symlinks to `.agents/skills/frontend-design`). Use the CLAUDE.md framing: "Using `.claude/skills/frontend-design/SKILL.md` as a strong reference, deliver beautiful, creative/unique design (UX/UI) that aligns well with the brand — `apps/dapp/PRODUCT.md` and `apps/dapp/DESIGN.md` for the dApp, `apps/web/PRODUCT.md` for the site. Check `docs/ASSETS.md` and `docs/COMPONENTS.md`."
- Deliver a robust, modern, clean UI. Keep the Confluence ring as the signature: sponsor stream plus saver stream forming one position. "The split is the product": the sponsor's match and the saver's own savings are visible at all times.
- Design mobile first, because judges may open the link on a phone. Check 390px first. Meet WCAG 2.1 AA, keep visible focus states, and never use color alone for status (pair it with an icon and label). Put tokens in `:root` exposed through `@theme inline`. Avoid arbitrary Tailwind values and inline styles. Reuse `packages/ui` and the local kits (`docs/COMPONENTS.md`) before adding anything new.
- Motion workflow. The skills live in `.agents/skills` and are symlinked into `.claude/skills`.
  1. `animation-vocabulary`: name each effect precisely.
  2. `animate`: decide, then build each animation (purpose, properties, curve, interruption, exit).
  3. `emil-design-eng` and `apple-design`: polish, springs, gesture details.
  4. `vercel-react-view-transitions`: route and shared-element transitions, for example pool card to pool detail.
  5. `review-animations`: review your own motion before calling it done. Optionally run `find-animation-opportunities` or `improve-animations` once at the end.
- Motion must earn its place: deposit, claim and forfeit feedback, vesting progress, the ring merging. Nothing gratuitous. Always honor `prefers-reduced-motion`.
- Use `@aquastock/animation` (`packages/animation`) properly. Read its README first.
  - Use subpath imports only (no root barrel), for example `@aquastock/animation/motion/react-m` inside `LazyMotionProvider` (`@aquastock/animation/motion/provider`).
  - Reuse `@aquastock/animation/motion/components` (`count-up`, `blur`, `text-reveal`, `marquee`, `dot-pattern-bg`) before writing anything new.
  - `apps/dapp` does not depend on it today. It imports `motion` directly (`^12.42.2`, while the package pins `12.38.0`). To use the package, give me the exact command (likely `pnpm --filter dapp add @aquastock/animation@workspace:*`; confirm the filter name), add it to `transpilePackages` in `apps/dapp/next.config.ts`, and reconcile the `motion` versions.
  - Promote a new component into `packages/animation` only if it has a real second consumer. Use heavy canvas effects (OGL, GSAP) only where there is a static reduced-motion fallback.
- Verify with the `agent-browser` skill against `pnpm --filter dapp dev`, at mobile and desktop widths, in both themes and both locales. Screenshot each key screen and describe what you actually see.

## 7. Validation and reporting

- After each phase, run the narrowest checks first (`pnpm --filter dapp lint`, `check-types`, `test`, and `anchor test`), then `pnpm check` as the final gate. Use `pnpm format` for docs.
- Never bypass a failing check. If a failure looks unrelated, report the exact command and error.
- Add a Playwright golden-path spec (sponsor creates a pool, saver deposits, claims, withdraws) against a local validator. It needs a dependency, so put it in your consolidated `pnpm add` list.
- Dry-run `docs/DEMO_SCRIPT.md` beat by beat. List which beats work, cut the ones that do not, and time the result under 90 seconds.
- After every phase, report: what changed, the files touched, the commands run and their results (verbatim errors), assumptions made, risks, and what is next. Flag anything unverified. Keep the status line in `docs/PIVOT_PLAN.md` current.
- When I ask for a PR, use only these sections: Summary, Reason, Test Cases, Will This Break Prod?

## 8. Definition of done

- The program is deployed (devnet replica, plus capped mainnet if approved) with its tests passing.
- The sponsor, saver and withdraw flows run end to end from the UI on mobile and desktop.
- `pnpm check` is green.
- Docs, env files and `.context/repo/map.md` match reality.
- Nothing in the UI or copy overclaims.
- The demo script has been dry-run and the results reported to me.
