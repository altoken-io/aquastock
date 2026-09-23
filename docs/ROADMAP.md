# AquaStock roadmap

This file is history. The original 5-day plan (Stocklana hackathon, NYC) was written for a water-infrastructure co-funding model (`Project`, `Position`, `Milestone`, `Impact`, with a government "anchor" investor). That model was superseded by **Match Pools** and nothing of it is built.

**The current plan, scope, cut order and status are in [PIVOT_PLAN.md](PIVOT_PLAN.md).** The runbook the work followed is [IMPLEMENTATION_PROMPT.md](IMPLEMENTATION_PROMPT.md), the demo is scripted in [DEMO_SCRIPT.md](DEMO_SCRIPT.md), and the program's frozen interface is in [PROGRAM.md](PROGRAM.md).

## What was reused from the first plan

- The shell: `apps/web` (marketing) + `apps/dapp` (product), trimmed `packages/*`, no KYC or fintech leftovers.
- The Better Auth admin login, now the operator console's sign-in.
- The Confluence visual language (two currents becoming one), now the sponsor's match and the saver's savings.
- en/es parity through `packages/locales`, enforced by a test.

## Explicitly cut

Hedera; KYC/AML; real securities structuring; a multi-project marketplace; Solana Pay; an in-app swap; program upgrade/governance tooling. (A devnet demo-token faucet was cut at first, then added on 2026-09-22 once the demo went devnet-only: without it, nobody outside the team could try the product.) See [PIVOT_PLAN.md](PIVOT_PLAN.md) section 5 for the cut order if time runs short.
