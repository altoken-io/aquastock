# Product

## Register

product

## Platform

web

## Users

Primary: community investors and diaspora — people who want to co-fund a water-infrastructure project alongside their government, connect a Solana wallet, fund a position, and track what their money is doing against real milestones. Secondary: the government "anchor" side — whoever holds the public position posts alongside the same community investors on the same project, in the same dashboard. Both read this as "where do I see the project, and where do I see my position in it."

## Product Purpose

This is the AquaStock dApp — the actual product: browse water-infrastructure projects, connect a Solana wallet, fund a position tagged `investor_type: public` (government) or `private` (community/outside investor), watch milestones move from pending to verified, and see a personal "My Impact" timeline (capital → project → milestone → impact). The defining feature is that a government position and a community position live in the _same_ schema and the _same_ project page — visibly split ("government contribution" vs. "community funding") rather than tracked on separate systems that never reconcile.

**Current build state (be accurate about this — do not describe unbuilt features as live):** the full investor-facing UI now exists — home, project list, project detail (funding split, milestone timeline, impact records), and My Impact — but it is built entirely against a **static demo dataset** (`apps/dapp/src/lib/demo/projects.ts`, `impact.ts`), not a live database or the Solana program. Off-chain project/position/milestone/impact data has a Prisma schema (`packages/db-prisma/prisma/schema.prisma`) but still no route handlers serving it. `@solana/web3.js` is installed; wallet-adapter connect and Solana Pay funding are not built — the project detail page's "Fund this position" control renders disabled with a "coming soon" label rather than faking a working flow. There is no Solana Anchor program in this repo yet — the on-chain Project/Position/Milestone/Impact accounts and their instructions (`create_project`, `create_position`, `fund_position`, `verify_milestone`, `record_impact`, `close_project`) are Day 2+ work per the team's 5-day build plan. A staff/government admin console (`/sign-in`, `/dashboard` + sub-pages) also exists, reading the same demo dataset; its "Mark verified" control is likewise disabled pending the Anchor program.

## Positioning

One project, one funding table, two kinds of investor — government and community — both tracked on-chain, both visible on the same screen. Not a DeFi yield product, not a KYC-gated custodial wallet: a transparency layer over public-private infrastructure funding.

## Brand Personality

Direct, credible, calm under real stakes — this handles public money and public trust, so it should feel exact and unhurried rather than flashy. Plain numbers over persuasive copy. Confident about what's verified on-chain; honest about what's still a placeholder in a 5-day build.

## Anti-references

No token-price charts, no DeFi-protocol staking/yield framing, no neon-Web3 visual tropes, no literal national-flag imagery to imply locality. No implying a government partnership, a real deployed program, or production money movement that doesn't exist yet — this is a devnet hackathon demo and must say so.

## Design Principles

- **The split is the product.** Government (public) and community (private) positions must be visually distinguishable on the same project page at all times — that's the entire pitch.
- **On-chain evidence over claims.** Every funded position and verified milestone should link to its transaction/Explorer proof, not just display a number.
- **Useful before technical.** Lead with "fund this project" / "see this milestone," never with account/PDA/instruction terminology.
- **No false certainty.** Never show a milestone as verified or a position as funded before the chain confirms it.
- **Build honestly for a 5-day timeline.** Prefer a smaller, real, working slice over a larger, faked one.

## Accessibility & Inclusion

WCAG 2.1 AA. Visible focus states on every interactive element, 4.5:1 minimum contrast on body and placeholder text, no color-only status communication (pair public/private and milestone status with icon + label, not color alone), reduced-motion-safe transitions throughout.
