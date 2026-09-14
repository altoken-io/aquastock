# AquaStock roadmap

5-day build for the Stocklana hackathon (NYC). Team: an on-chain/Anchor + wallet-connect engineer, a narrative/partnerships lead, two engineers on off-chain product/dashboard UI, and a financial-model/strategy lead — converging by day 4 for the funding flow and pitch rehearsal.

## Day 1 — Scaffold (done)

- Strip the copied codebase down to a lean AquaStock shell: `apps/web` + `apps/dapp`, trimmed `packages/*`, no leftover fintech/KYC/admin domain code.
- Off-chain schema in `packages/db-prisma`: `Project`, `Position` (`investorType: PUBLIC | PRIVATE`), `Milestone`, `Impact`.
- Placeholder pages that build and pass `pnpm check` cleanly, ready for the team to fill in.

**Status:** complete. What's _not_ done yet, explicitly: the Anchor program, wallet-connect, and Solana Pay — all below. The project/admin-dashboard UI itself has since been built ahead of schedule (project list/detail, My Impact, and the admin console — `apps/dapp`'s `/` route is the login page, not a marketing home; see memory: dapp-home-is-login), but entirely against a static demo dataset (`apps/dapp/src/lib/demo/*`) rather than live on-chain/off-chain data — see `docs/ROUTES.md` and `apps/dapp/PRODUCT.md`'s current-build-state note.

## Day 2 — Anchor program

- Structure the Solana Anchor program: `create_project`, `create_position`, `fund_position`, `verify_milestone`, `record_impact`, `close_project` — 4 account types max (`Project`, `Position`, `Milestone`, `Impact`).
- Deploy to Devnet; a few tests covering a government position and a community position funding the same project.

## Day 3 — Connect on-chain to off-chain

- Wallet-connect (`@solana/wallet-adapter-react` + Phantom/Solflare) wired into `apps/dapp`, `create_position`/`fund_position` callable from the project page, each position labeled public or private.
- The "My Impact" screen and the capital → project → milestone → impact timeline, with a visible "government contribution" bar next to "community funding" on the same project page — this is the differentiating UI, not a generic template.

## Day 4 — Payments and demo polish

- Solana Pay transfer request for funding a position; show the Explorer link and transaction signature after a contribution.
- Represent the government anchor commitment and the settlement-partner step as clearly labeled demo steps (e.g. "Government contribution confirmed," "Settlement via [partner]") — no real government or provider integration in this window.
- Add the legal disclaimer: "Demo — no constituye una oferta de valores." / "Demo — this does not constitute an offer of securities."

## Day 5 — Freeze, polish, record

- Feature freeze at midday; anything not working comes out of the demo path rather than getting debugged live.
- README + 90-second demo script, opening with the anchor-investor framing.
- QA in mobile viewport only — that's what judges will see if they open the link on a phone.

## Explicitly cut

Any Hedera integration; a real government MOU/procurement process or legal PPP agreement; real settlement-partner API calls; KYC/AML; real securities structuring; a multi-project marketplace. See `docs/ARCHITECTURE.md`.
