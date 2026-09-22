# AquaStock pivot plan — Match Pools

**Status (2026-09-20): implementation complete on branch `feat/match-pools`, nothing committed or deployed. The program is complete with its interface frozen (`docs/PROGRAM.md`) and 33 tests passing on the mainnet Token-2022 build. The server side is built (Prisma `Pool` and `PoolActivity`, 7 zod-validated route handlers reading the chain, `docs/ROUTES.md`). The product UI is built in `apps/dapp` (pool list and detail, deposit, claim, withdraw with a forfeiture preview, close, sponsor fund and reclaim, a create-pool wizard that signs the pool's name with the sponsor's wallet, My match, an operator console over real pool data), the `apps/web` marketing site is rewritten for Match Pools in en/es, and the old water-funding pages, copy, types and photos are gone. `pnpm check` is green (306 dapp tests). A Playwright golden path (`pnpm test:e2e`: sponsor creates and funds a pool; saver deposits, claims, withdraws, claims the rest and closes) passes on desktop and a 390 px viewport against a local validator, and the timed demo dry run fits every beat (about 18 s of product time in the 90 s script; see `DEMO_SCRIPT.md` section 5). Screens were swept for WCAG AA contrast and accessible names in both themes and languages. Not done, and not verifiable from here: a deploy (devnet, and the capped mainnet run), a rehearsal with a real wallet extension and real-network latency, the deck and video, a legal review, an audit, and the sponsor's reclaim of unused match by clicking (it needs a closed pool; the program tests and `pnpm program:smoke` cover it). Approval of the pivot is assumed from the implementation prompt; the section 8 decisions use the defaults in [IMPLEMENTATION_PROMPT.md](IMPLEMENTATION_PROMPT.md) until the team says otherwise.** It supersedes the earlier Meteora DBC idea (removed in `e08ac0c`) and the day-by-day plan in [ROADMAP.md](ROADMAP.md), which was written for the water-funding model.

Deadline: **Fri 2026-09-25, 4:00 PM ET.** Plan to submit Thu 2026-09-24 night.

## 1. Why pivot

The Stocklana hackathon is about tokenized stocks on Solana. The current AquaStock model (a government anchor and community investors co-funding water projects) has no tokenized stock in it, no on-chain code, and a disabled "Fund this position" button. Judges ask one question: _could this be a real app people will use?_ They look for a real user and problem, a working end-to-end demo, a reason it belongs on Solana, and execution quality. As it stands, the demo and the theme are both gaps.

## 2. What the PDF is worth

`AquaStock_TheConfluence_5Day_MVP_Guide.pdf` (8 pages, bilingual, dated Sept 13–18) is an execution checklist for the _old_ model, not a strategy.

| Keep                                                                                                         | Drop                                                                       |
| ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Escrow lifecycle (create, deposit, verify, release, withdraw-on-miss) — maps onto the new design             | "No token is minted" — the opposite of the hackathon theme                 |
| Scope-cut table and the "never cut" list                                                                     | Sept 13–18 dates (deadline is now Sept 25)                                 |
| Day-5 checklist: 3× demo runs, 2–3 min video, 5–7 slide deck, mobile QA, public repo, submit before deadline | Supabase (the repo uses Neon/Prisma) and a "marketplace" (already cut)     |
| Tests: happy path plus at least 2 failure cases                                                              | A single admin key releasing funds — judges will read it as a custody risk |
| Backup RPC endpoint; pin wallet-adapter versions on Day 1                                                    | Anything implying a tokenized-stock element — the PDF has none             |

## 3. What is already taken

Ten public Stocklana repos found on 2026-09-19 (a sample of roughly 130 submissions, not the full list):

- After-hours trading terminals: [After Hours](https://github.com/martymedia/after-hours), STOCK.sh, STOCKNINE
- Gap risk and insurance: [GapGuard](https://github.com/angelraph/gapguard), Noctis
- Recurring buys and portfolio: Stocklane
- Baskets: [stocklana-baskets](https://github.com/MallorcaBCDays/stocklana-baskets)
- Corporate actions and dividends: [Multiplier](https://github.com/GODGRACE07/multiplier), [Divvyr](https://github.com/Nebulaz7/Divvyr)
- Carry vault: Stockulus

Avoid trading terminals, DCA, baskets and gap-insurance dashboards. No sampled repo does on-chain matching, and a web search for it returned nothing. That does not prove no submission does it — re-check the hackathon's submissions list before committing.

## 4. Proposed product: Match Pools

**Pitch:** the employer match, for people who have no employer to give them one. A sponsor (a DAO paying global contractors, an NGO, a city, a relative abroad) creates a pool with a match budget and rules. Savers deposit a tokenized index stock (an xStock such as SPYx). The sponsor's match is reserved on-chain and vests over time. Withdrawing early forfeits the unvested match back to the sponsor.

**Real-world tailwind:** the 2026 [Trump Accounts](https://home.treasury.gov/news/press-releases/sb0372) allow up to $2,500 a year of employer money, and 50+ companies pledged matches. We found no equivalent for global contractors or non-US savers, but that is one round of searching, not proof.

**Fit with the judging criteria**

| Criterion                   | How Match Pools answers it                                                                                           |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Real user and problem       | Sponsors who can't offer a 401(k)-style match, and savers who never get one                                          |
| Working end-to-end demo     | Sponsor creates a pool, saver deposits real SPYx, match is reserved, vests, is claimed; early withdrawal forfeits it |
| Reason it belongs on Solana | Programmable escrow and vesting on Token-2022 assets; fees low enough for $5 savers                                  |
| Quality of execution        | Reuses the existing shell, Confluence visual, admin console, and en/es parity                                        |

### On-chain program (Anchor)

| Account          | Holds                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| `Pool` (PDA)     | Sponsor authority, allow-listed mint, `match_bps`, per-saver cap, vesting seconds, budget totals, vault |
| `Position` (PDA) | Pool, saver, deposited raw amount, reserved match, start time, claimed match                            |

Instructions: `create_pool`, `fund_match`, `deposit`, `claim_vested`, `withdraw`, `reclaim_unmatched`.

- `deposit` reserves `min(amount × match_bps, remaining cap, unreserved budget)` of match, first come first served.
- `claim_vested` releases the vested part linearly. It requires the deposit to still be in place.
- `withdraw` returns the saver's deposit at any time. Unvested match returns to the pool's unreserved budget. Vested-but-unclaimed match stays claimable.
- `reclaim_unmatched` lets the sponsor recover unreserved budget after the pool ends.
- Use `anchor_spl::token_interface` and `transfer_checked`. No on-chain price oracle: deposit and match are the same mint in raw units, so the ratio needs no price.

### What the mainnet SPYx mint tells us

Read from mainnet on 2026-09-19: mint `XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W`, Token-2022, 8 decimals.

| Extension                             | Consequence                                                                                                                                                                                                                                                                                         |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scaledUiAmountConfig` (~1.0057)      | Raw amounts never change; a multiplier represents dividends and splits. The UI must convert typed amounts to raw units (divide by the multiplier). Same-mint ratios are unaffected.                                                                                                                 |
| `pausableConfig`                      | The issuer can pause transfers. Withdrawals could stall; funds are not lost. Test the paused path.                                                                                                                                                                                                  |
| `permanentDelegate`, freeze authority | The issuer can move or freeze tokens in any account, including our vault. Disclose this in the UI ("what you actually own").                                                                                                                                                                        |
| `transferHook` (`programId: null`)    | Initialized but disabled. Re-check before mainnet; an enabled hook needs extra accounts on every transfer.                                                                                                                                                                                          |
| `defaultAccountState: initialized`    | New accounts are not frozen by default. Good.                                                                                                                                                                                                                                                       |
| `confidentialTransferMint`            | Missing from this table's first draft; found on the second read (`autoApproveNewAccounts: false`). Expected to be opt-in per account, so plain `transfer_checked` should still work. The Day-0 spike must prove it, and the vault account must be sized for the mint's required account extensions. |
| `metadataPointer` + `tokenMetadata`   | Name, symbol and URI live on the mint. Harmless to transfers; include them in the replica so account size and rent match.                                                                                                                                                                           |

Authorities on the mainnet mint (2026-09-19; read the full keys from the mint, not from here): pause and freeze share one key (`JDq14B…`); permanent delegate, transfer-hook, metadata-pointer and confidential-transfer authorities share another (`5aMNNL…`); the scaled-UI-amount authority is a third (`S7vYFF…`). One compromised issuer key each is enough to pause, freeze or move tokens, and the UI disclosure card should say so.

Devnet has no real xStocks. Build and test against a replica Token-2022 mint with this exact extension set, then deploy on mainnet with tiny, hard-capped deposits.

### What carries over from the repo

| Keep                                                                              | Change                                                          |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| App shell, Confluence ring (sponsor stream + saver stream)                        | `/projects` becomes `/pools`; `/impact` becomes `/my-match`     |
| "The split is the product" UI (public/private becomes sponsor match/your savings) | New sponsor create-pool wizard                                  |
| Better Auth admin console (becomes an operator console)                           | `Project`/`Milestone` Prisma models become `Pool`/vesting data  |
| Neon Postgres for pool metadata and cached activity                               | Rewrite `PRODUCT.md`, `ABOUT.md`, marketing copy, en/es strings |
| en/es locale parity test                                                          | Delete dead `utils/supabase/*` files in both apps               |

Constraint kept: `apps/dapp`'s `/` stays the admin login page; marketing lives only in `apps/web`.

### Deliberately not doing

- Meteora DBC and Pyth bounties (Pyth would not be central; its extended-hours equity feeds moved to [paid Pyth Pro](https://www.pyth.network/blog/extended-hours-us-equity-data-moves-to-pyth-pro)). Pyth is display-only, if time allows.
- Single stocks (index tokens only, to avoid single-name risk in a savings product).
- KYC-gated issuers (Backpack SPCX), pre-IPO tokens ([PreStocks lost 34–46% in May 2026](https://www.coindesk.com/markets/2026/05/13/anthropic-openai-tokens-plunge-nearly-40-as-ai-firms-warn-spv-transfers-are-invalid) after the issuers said the transfers were void), and any real securities structuring.
- A server-side signing key. Every transaction is signed by a user wallet.

## 5. Six-day plan

| Day    | Deliverable                                                                                                                                                             |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sat 19 | Decisions (section 8). Install toolchain. Spike Anchor with Token-2022 scaled-UI-amount and build the SPYx replica mint.                                                |
| Sun 20 | Program: `create_pool`, `fund_match`, `deposit`. Local-validator tests.                                                                                                 |
| Mon 21 | `claim_vested`, `withdraw`, `reclaim_unmatched`. Tests: double claim, forfeiture math, paused mint, multiplier change mid-vest, unauthorized reclaim. Deploy to devnet. |
| Tue 22 | Wallet-adapter (pin versions). Pool list and detail from chain. Deposit, claim, withdraw UI. Sponsor wizard. Neon metadata.                                             |
| Wed 23 | Mainnet deploy with real SPYx and hard caps. Full end-to-end run. Rewrite marketing site and en/es copy. Legal disclaimers.                                             |
| Thu 24 | Feature freeze. 3× demo runs. README, video, deck, mobile-viewport QA, `pnpm check`. **Submit Thursday night.**                                                         |
| Fri 25 | Buffer only.                                                                                                                                                            |

Cut order if behind: Pyth display, sponsor analytics, marketing rewrite, mainnet run (fall back to devnet replica). Never cut: deposit, vest, claim, forfeit-on-withdraw, working live demo.

## 6. Environment variables

Prisma migrations read the root `.env`. The apps read `apps/dapp/.env.local`, or Vercel env vars in production. Placeholders only in `.env.example`; never commit real values.

| Variable                                     | Status           | Notes                                                                                 |
| -------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------- |
| `DATABASE_URL`                               | required         | Neon **pooled** URL (host contains `-pooler`), with `?sslmode=require`                |
| `DIRECT_URL`                                 | required         | Neon **direct** URL, used by `prisma migrate`                                         |
| `BETTER_AUTH_SECRET`                         | required in prod | `openssl rand -base64 32`                                                             |
| `NEXT_PUBLIC_BASE_URL`                       | required         | Must match the deployed domain; Better Auth's `baseURL` derives from it               |
| `NEXT_PUBLIC_WEB_URL`                        | required         | Link back to `apps/web`                                                               |
| `NEXT_PUBLIC_SOLANA_NETWORK`                 | required         | `devnet` or `mainnet-beta`; declared but not yet read                                 |
| `NEXT_PUBLIC_SOLANA_RPC_URL`                 | required         | Helius or QuickNode. Browser-visible: restrict the key by domain                      |
| `NEXT_PUBLIC_ANCHOR_PROGRAM_ID`              | required         | Empty until deploy                                                                    |
| `SOLANA_RPC_URL`                             | new              | Server-only RPC key for route handlers                                                |
| `NEXT_PUBLIC_STOCK_MINT`                     | new              | Mainnet SPYx, or the replica mint on devnet                                           |
| `RESEND_API_KEY`                             | optional         | Only the forgot-password email uses it (client is built lazily)                       |
| `PYTH_HERMES_URL`, `PYTH_API_KEY`            | optional         | Display-only. Unverified whether Hermes requires the key — check the Pyth docs/MCP    |
| `JUPITER_API_KEY`                            | optional         | Only if the app swaps in-app (see section 10). Unverified whether Jupiter requires it |
| `DATABASE_POOL_MAX`                          | optional         | Defaults to 5                                                                         |
| PostHog, Arcjet, Upstash, Resend audience ID | optional         | Not on any reachable path today                                                       |
| `ANCHOR_WALLET`, `ANCHOR_PROVIDER_URL`       | local only       | Deploy and test. Never in Vercel                                                      |

- Do **not** set `NEXT_PUBLIC_SUPABASE_*`. Dead files remain in `apps/*/src/utils/supabase/`; delete them during the pivot.
- Add every new variable to `.env.example` and to `turbo.json` `globalEnv` (rule in [ENV_VARS.md](ENV_VARS.md)), and update that doc.
- Neon free tier suspends after about 5 minutes idle. Ping the database before any demo.

## 7. What else is needed

- **Toolchain:** Solana CLI and Anchor are not installed on the dev machine (Rust, Node, pnpm, Docker are).
- **RPC:** a Helius or QuickNode account (mainnet).
- **Wallets:** a deployer keypair (a few SOL on mainnet for deploy rent, an estimate, refundable; devnet airdrop otherwise) and three Phantom wallets (sponsor, saver A, saver B) holding about $20–50 of USDC plus SOL for fees.
- **Buying SPYx:** unverified whether xStocks front ends geoblock US users. Test the purchase on Day 0; prefer a non-US team member if it is blocked.
- **Public repo:** the submission needs a link. Origin is `github.com/altoken-io/aquastock`; confirm it is public.
- **Vercel** for both apps. **Hackathon:** registered; invite teammates from the submit form.

## 8. Open decisions

1. Approve the Match Pools pivot, or redirect. **Decided: approved.**
2. Hard-capped mainnet demo, or devnet-only with the replica mint (safer, weaker on "working code"). **Decided (2026-09-22): devnet-only.** No hackathon rule was found requiring this either way (checked the official hackathon page directly); the only mainnet-specific line found anywhere is bounty-specific to a Meteora track this repo isn't pursuing. Devnet avoids a real SPYx purchase and real funds in an unaudited program. `NEXT_PUBLIC_SOLANA_NETWORK=devnet`, `NEXT_PUBLIC_STOCK_MINT` is the devnet replica mint from `scripts/solana/replica-mint.ts`, and `NEXT_PUBLIC_MAINNET_DEMO_CAP` is not set.
3. Team size, and who owns the Rust program.
4. Keep the AquaStock name and water metaphor, or rename. **Decided: keep AquaStock.**

## 9. Risks

- Token-2022 extension edge cases in Anchor (scaled UI amount, pause, freeze). Prove it on Day 0 before building UI.
- Anchor toolchain install time on WSL2.
- Sourcing real SPYx for the mainnet run (geoblocking, KYC on some issuers).
- Uniqueness is unconfirmed beyond the 10 repos sampled.
- Unaudited program: cap deposits on mainnet and label everything as a demo.
- Legal: keep the "Demo — this does not constitute an offer of securities" disclaimer on every surface.

## 10. Not yet covered

Gaps in this plan as of 2026-09-19. None is resolved; each needs an owner.

### Written since the plan (2026-09-20)

- **Demo script.** [DEMO_SCRIPT.md](DEMO_SCRIPT.md) was dry-run beat by beat and timed (section 5 there). The deck and the video are not built.
- **How savers get SPYx.** Decided: a link out to Jupiter on mainnet; on other networks the deposit panel says the network has no exchange. No in-app swap.
- **Security and abuse design.** The mint allow-list is enforced on-chain (a write-once `Config`). The upgrade authority is kept by the deployer and disclosed in the app and the FAQ; moving it to a multisig or burning it is still the team's call. The route handlers are rate limited (Upstash), and the limiter fails closed in production when Upstash is not configured.
- **Repo work list.** Product and design docs, ABOUT, ROUTES, DATABASE, ARCHITECTURE, COMPONENTS, TONE, VISUAL and the repo map are rewritten. The Prisma migration is written and validated on a local Postgres; **running it on Neon is still to do** (it refuses to run if the old water-funding tables hold rows). The `impact`, `milestones` and `project` locale namespaces are deleted, with en/es parity enforced by a test. The Playwright golden path exists.
- **UI design pass.** The new screens were designed and built with the `frontend-design` skill and the motion skills, and checked at 390 px and desktop in both themes and both languages.

### Still open

- **Deploy.** Nothing is deployed. Commands and the environment list are in `docs/PROGRAM.md` and `docs/ENV_VARS.md`; a human runs them.
- **Sponsor validation.** The plan asks for 2 to 3 real conversations with prospective sponsors and one quote in the deck. None has happened.
- **Audit and legal.** Neither has been done.

### Not verified

- **Uniqueness.** Only 10 of roughly 130 submissions were sampled; the full submissions list was not visible.
- **Toolchain and access unknowns.**
  - Whether Anchor's Token-2022 crates handle the scaled-UI-amount extension cleanly.
  - Whether xStocks front ends geoblock US users.
  - Whether Pyth's Hermes endpoint or Jupiter's API needs a key.
  - The mainnet deploy-rent figure (a rough estimate).
- **Legal.** No review done. Cross-border matching contributions may carry tax or securities implications; the plan only has disclaimers.

### Verified

- The SPYx mint's extension set, read directly from mainnet RPC on 2026-09-19.
- The multiplier switched to about 1.0057 on 2026-06-18 04:00 UTC, so that value is current.
- The hackathon's rules, deadline (Sep 25, 4:00 PM ET) and bounty terms, from the hackathon page.

## Sources

- [Pine Analytics — Tokenized Equities on Solana](https://pineanalytics.substack.com/p/tokenized-equities-on-solana)
- [Solana Compass — Stocklana expands to $121K](https://solanacompass.com/news/stocklana-hackathon-expands-to-121000-with-five-ecosystem-partner-tracks)
- [Solana Compass — Tokenized stock lending](https://solanacompass.com/news/solana-tokenized-stock-lending-tvl-reaches-231m-kamino-finance-controls-826-of-venue-share)
- [Solana Compass — Backpack mint/redeem API](https://solanacompass.com/news/backpack-securities-opens-mint-and-redeem-api-to-all-solana-developers)
- [CoinDesk — PreStocks plunge](https://www.coindesk.com/markets/2026/05/13/anthropic-openai-tokens-plunge-nearly-40-as-ai-firms-warn-spv-transfers-are-invalid)
- [Treasury — Trump Accounts](https://home.treasury.gov/news/press-releases/sb0372)
- [Pyth — extended-hours feeds to Pyth Pro](https://www.pyth.network/blog/extended-hours-us-equity-data-moves-to-pyth-pro)
