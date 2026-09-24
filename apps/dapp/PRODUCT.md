# Product

## Register

product

## Platform

web

## Users

Primary: **savers**, people holding (or about to hold) tokenized SPYx who want to see exactly what a sponsor's match is worth if they stay and if they don't, and to deposit, claim and withdraw with a wallet they already have. Second: **sponsors**, who create and fund a pool and later manage it. Third: **operators**, the team, who watch pools, the deployment and the token's issuer through a staff-only console. Savers and sponsors have no accounts and no KYC; they connect a Solana wallet.

## Product Purpose

This is the AquaStock dApp, the actual product: **Match Pools**. Browse pools, deposit into one, watch the sponsor's match vest, claim what has vested, and withdraw whenever you like (the unvested match goes back to the sponsor; the whole deposit always comes back). A sponsor creates a pool and funds it in one transaction, signs its name with their wallet, and can add budget or reclaim what nobody reserved once it closes.

**Current build state (be accurate about this: do not describe unbuilt features as live):** everything above is built, runs end to end on a local validator (`pnpm dev:stack`), and is live on Solana devnet at https://aquastock-dapp.vercel.app with a replica SPYx mint (dSPYx), a demo faucet (`POST /api/faucet`, devnet and localnet only) and a standing pool anyone can deposit into. Nothing is on mainnet. The program is unaudited. `apps/dapp`'s `/` is the operator sign-in page, with one line pointing savers and sponsors on to the pools; the dApp has no marketing content at all (that lives only in `apps/web`; see memory: dapp-home-is-login). The operator console is read-only. There is no saver or sponsor login and no in-app swap (on mainnet, buying SPYx is a link out to Jupiter). Market prices appear only as "≈ $" next to token amounts: from Pyth when the deployment's key is entitled to the SPYx feed, otherwise from Jupiter's public price, and the price card names which.

## Positioning

A match you can check: locked in a program, visible, earned in a straight line. Not a yield product, not a custodial wallet, and not investment advice: a savings rule enforced on-chain.

## Brand Personality

Direct, credible, calm under real stakes. It handles people's money, so it should feel exact and unhurried rather than flashy. Plain numbers over persuasive copy. Confident about what the chain confirms; honest about what is a demo stand-in.

## Anti-references

No token-price charts, no DeFi staking or yield framing, no neon-Web3 visual tropes. Never imply a sponsor, a partnership, a deployed program or production money movement that doesn't exist. Never show a return.

## Design Principles

- **Two currents, one position.** The sponsor's match and the saver's own savings are always distinguishable, and always carry an icon and a label, never colour alone.
- **On-chain evidence over claims.** Every action ends in a transaction link. Nothing shows as vested, claimed or paid before the chain says so.
- **Say the cost before the click.** Withdrawing shows exactly what comes back, what is kept and what is given up. A partial match is stated before signing, and the deposit carries a minimum match so the person is never silently matched less than they saw.
- **Disclose, next to the action.** The token's issuer can pause transfers, freeze accounts, move tokens and change the multiplier; the program's upgrade authority is the team's deploy wallet. Both are on the page, not in fine print.
- **Useful before technical.** Lead with "Deposit 40 dSPYx", never with account, PDA or instruction terms. Program errors are translated into what happened and what to do.
- **Build honestly for a hackathon timeline.** A smaller, real, working slice over a larger, faked one.

## Accessibility & Inclusion

WCAG 2.1 AA. Visible focus states on every interactive element, 4.5:1 minimum contrast on body and placeholder text, no color-only status communication (pair sponsor/saver and vesting status with icon + label, not color alone), reduced-motion-safe transitions throughout.
