# Stocklana submission

Copy for the submit form at https://hackathons.solana.com/hackathons/stocklana, and the checklist to clear before pressing submit. Submissions close **Fri 2026-09-25, 4:00 PM ET**; edits are allowed until then, so submit early and update.

## Before you submit

Run `pnpm demo:preflight` (read-only) and then `pnpm demo:preflight --live` (a real devnet round trip with a throwaway wallet). Both must end in `READY`.

- [ ] **Faucet on in production.** `FAUCET_SECRET_KEY` set in Vercel (Production scope) for the dApp, then redeploy. Without it a judge's new wallet has no tokens and the demo stops at the deposit.
- [ ] **Repository public**, or leave the GitHub field empty and rely on the demo and video links. A private repo answers 404 to judges.
- [ ] **Latest `main` deployed** on both Vercel projects (the preflight's "App build" line compares the live build with your checkout).
- [ ] **Pyth key working**, or accept that "≈ $" values stay hidden. The preflight says which.
- [ ] **Video recorded** (2–3 minutes, script in `DEMO_SCRIPT.md` section 2) and uploaded as unlisted.
- [ ] **Teammates invited** from the submit form.

## Form fields

**Project name**

AquaStock: Match Pools

**One-liner**

The employer match, for people without an employer: a sponsor's match on your tokenized-stock savings, reserved on-chain and vesting while you stay.

**Track**

Main track (Investing). Bounties: none recommended. Pyth is used for display-only "≈ $" values, which is not central enough for the Pyth bounty's judging; opt in only if you want the exposure.

**Links**

- Live demo: https://aquastock-dapp.vercel.app/en/pools (never the bare app URL: it is the staff sign-in, though it now links on to the pools)
- GitHub: https://github.com/altoken-io/aquastock (once public)
- Video: _add the unlisted link_
- Site: https://aquastock-tawny.vercel.app

**Description**

> An employer match is the best return most savers ever get, and it only exists if you have an employer. Contractors, gig workers and savers outside the US get nothing like the US's new Trump Accounts, where an employer can add up to $2,500 a year.
>
> AquaStock Match Pools gives anyone the rails to be that employer. A sponsor (a DAO paying global contributors, an NGO, a city, a relative abroad) creates a pool on Solana: a match ratio, a cap per saver, a vesting period and a budget. A saver deposits tokenized SPYx and the match is reserved for them in the same transaction, then vests in a straight line. Withdraw any time: the whole deposit comes back with whatever has vested, and the unvested match returns to the sponsor. The app shows those numbers before you sign.
>
> It is an Anchor program (8 instructions, 33 tests including randomized accounting-invariant runs against the mainnet Token-2022 build) that handles the real SPYx mint's extensions: the dividend multiplier, pause, freeze and permanent delegate. The pool page shows what the token's issuer can do, read live from the chain, and says the program cannot prevent it. The chain is the source of truth for every number; the server only stores sponsor-signed names and an activity feed it re-reads from the chain.
>
> Live on devnet with a replica SPYx mint, an in-app faucet and a standing pool, so you can try the whole saver flow in two minutes. Demo; not an offer of securities; unaudited.

**How to test**

> 1. Switch your wallet to devnet (Phantom: Settings → Developer Settings → Testnet Mode; Solflare: Settings → Network → Devnet).
> 2. Open https://aquastock-dapp.vercel.app/en/pools/45K6H9DxvtYnmuXQDVjwFn3V4mgLbT3wYLBGfdfTHTSf and connect.
> 3. Press "Get demo tokens" (100 dSPYx and 0.02 SOL).
> 4. Deposit up to 100 dSPYx: the 1:1 match is reserved in the same transaction.
> 5. On "My match", watch it vest over 10 minutes, claim, or withdraw early to see the forfeiture preview.

**Why Solana**

> xStocks are Token-2022 mints on Solana, with the multiplier, pause and permanent-delegate extensions the program has to respect. Fees are small enough for a $5 saver, markets never close, and the match is enforced by a program instead of promised by a custodian.

**Tech**

> Anchor 1.2 (Rust, Token-2022), Next.js, `@solana/web3.js` with Wallet Standard, Prisma + Postgres, Pyth Hermes, Vercel. Open-source components and prior work are listed in the README.

## Open-source and prior-work disclosure

The rules allow open-source components "if you say so". The README's last section says it: AquaStock is built by the team behind DDPay, the scaffold was adapted from the team's earlier DDPay codebase on 2026-09-13, commits before 2026-09-19 belong to an earlier concept, and everything Match Pools was written from 2026-09-19. Contact: admin@ddpay.io.
