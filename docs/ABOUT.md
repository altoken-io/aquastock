# AquaStock product brief

## Purpose

AquaStock is a Solana dApp built for the Stocklana hackathon (NYC), themed "Agua Solana para Todos" (Water on Solana for Everyone). It lets a government "anchor" investor and community/private investors co-fund water-infrastructure projects on the same funding table, tracked on-chain, instead of running public and private capital through two financing tracks that never reconcile.

The product thesis: when a government position is visible alongside community positions on one project, it signals the project is validated and de-risks it for private capital to follow — the same logic behind a government taking an equity stake in a strategic resource, applied to water access.

AquaStock is a hackathon demo, not a real offering. **Demo — this does not constitute an offer of securities.** / **Demo — no constituye una oferta de valores.**

## The model

- Every project has a single funding table. Each position on it carries `investor_type: public` (a government/municipal anchor) or `private` (community residents, diaspora, or outside investors).
- Progress is tracked against on-chain milestones; funded amounts and milestone status are visible per project, with public and private contributions shown side by side rather than as separate totals.
- The chain is Solana. The on-chain program (not yet built — see `docs/ROADMAP.md`) is the source of truth for projects, positions, milestones, and impact records; the off-chain Postgres layer (`packages/db-prisma`) is a display cache, not a second ledger.

## Who it serves

- **A government anchor** — a municipal or national authority seeding a project with a public position.
- **Community investors** — local residents, diaspora, or outside investors funding the remainder of a project as private positions.
- **Anyone evaluating the model** — hackathon judges, partners, or future adopters of the public/private co-funding pattern for infrastructure beyond water.

## Product principles

1. **One table, not two.** Public and private capital live in the same schema and the same page — never a separate government dashboard reconciled by hand later.
2. **On-chain is the record.** Funding status and milestone verification are claims the chain can back up, not just UI state.
3. **No false certainty.** Don't imply a milestone is verified, a project is fully funded, or a government commitment is final until the on-chain state says so. Label anything that's a demo stand-in (e.g. a "government contribution confirmed" step) as exactly that.
4. **Legible to a judge in 90 seconds.** The public/private split and the milestone → impact story need to read clearly without narration.
5. **Generalizable.** The pattern isn't water-specific — treat water infrastructure as the concrete example, not a hard constraint baked into the data model.

## Source of truth

- Build plan and current status: [ROADMAP.md](ROADMAP.md).
- Architecture (on-chain program + off-chain cache): [ARCHITECTURE.md](ARCHITECTURE.md).
- Current routes: [ROUTES.md](ROUTES.md).
- Database schema: [DATABASE.md](DATABASE.md).
- Copy and visual guidance: [TONE.md](TONE.md) and [VISUAL.md](VISUAL.md).
