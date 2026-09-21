# AquaStock product brief

## Purpose

AquaStock is a Solana dApp built for the Stocklana hackathon (NYC). It is **Match Pools**: the employer match, for people without an employer. A sponsor (an employer, a DAO, a community, a protocol) funds a match on savers' deposits of a tokenized index stock. The match is reserved for the saver on-chain the moment they deposit and vests in a straight line, so staying is rewarded and leaving early is honest about what it costs.

The product thesis: an employer match works because it is tied to time. Anyone can promise to reward saving; a match that is locked in a program, visible, and earned in a straight line is a commitment a saver can check. AquaStock makes that commitment available to people with no employer, on a token they can already buy.

AquaStock is a hackathon demo, not a real offering. **Demo — this does not constitute an offer of securities.** / **Demo — no constituye una oferta de valores.**

## The model

- A sponsor creates a **pool**: a match rate, the most one saver may deposit, a vesting period, and a closing time. They lock a match budget in the pool's vault. The rules cannot change afterwards.
- A saver **deposits** tokenized SPYx. In the same transaction the pool reserves the matching amount (`floor(deposit * rate)`, limited to what is left of the budget) for that saver. A saver can set a minimum match so they are never silently matched less than they were shown.
- The match **vests** linearly from the deposit, and the saver can **claim** what has vested at any time.
- A saver can **withdraw** at any moment. The whole deposit comes back; the unvested part of the match returns to the pool's unreserved budget; what had vested stays claimable.
- After a pool closes, the sponsor can **reclaim** the match nobody reserved, including what savers gave up.
- The chain is Solana and the program (`programs/`, interface in `docs/PROGRAM.md`) is the source of truth. The Postgres layer (`packages/db-prisma`) holds pool names and a verified activity feed; it is a display layer, not a second ledger.

## Who it serves

- **Sponsors**: anyone who wants to reward people for saving and staying rather than trading.
- **Savers**: anyone holding SPYx who wants to see exactly what a match is worth if they stay, and if they don't. No account, no KYC: they connect a wallet.
- **Operators**: the team, who watch pools, the deployment and the token's issuer through a read-only console.
- **Anyone evaluating the model**: hackathon judges and partners.

## Product principles

1. **The chain is the record.** Nothing shows as vested, claimed or paid before the chain says so. Vested figures are the program's own schedule maths; claimed and paid come only from accounts.
2. **No false certainty.** Disclose what is real: the token's issuer can pause transfers, freeze accounts, move tokens out of any account and change the display multiplier, and the program's upgrade authority is the team's deploy wallet. Label every stand-in: illustrative numbers, demo timescales, the demo disclaimer on every legal-facing surface.
3. **No custody, no server keys.** Every write is a transaction the person's wallet signs; the server only reads and re-verifies. A sponsor proves who they are by signing a message, not by logging in.
4. **Legible to a judge in 90 seconds.** The two currents (the sponsor's match and your own savings) and the vesting line must read without narration. The script is `DEMO_SCRIPT.md`.
5. **Small and closed.** One allowed mint per deployment, rules fixed at creation, sizes capped on mainnet. What the program does not do is not a feature.

## Source of truth

- Status, scope and open risks: [PIVOT_PLAN.md](PIVOT_PLAN.md). Build plan history: [ROADMAP.md](ROADMAP.md).
- The on-chain program and its frozen interface: [PROGRAM.md](PROGRAM.md).
- Architecture (on-chain program + off-chain layer): [ARCHITECTURE.md](ARCHITECTURE.md).
- Current routes: [ROUTES.md](ROUTES.md). Database schema: [DATABASE.md](DATABASE.md). Environment: [ENV_VARS.md](ENV_VARS.md).
- Copy and visual guidance: [TONE.md](TONE.md) and [VISUAL.md](VISUAL.md).
