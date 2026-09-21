# Product

## Register

brand

## Platform

web

## Users

AquaStock's public site speaks to two audiences at once: the sponsor (an employer, a DAO, a community, a protocol) who might fund a match, and the saver who holds, or could hold, tokenized stock and would deposit into one. Visitors should immediately understand the core idea, in plain words and without knowing anything about Solana: someone funds a match on your savings, and you earn it by staying.

## Product Purpose

AquaStock is a Solana dApp built for the Stocklana hackathon (NYC): **Match Pools**, the employer match for people without an employer. A sponsor locks tokens in a pool and sets the rules; a saver deposits tokenized SPYx; the matching amount is reserved for them on-chain in the same transaction and vests in a straight line. Leave early and you keep your deposit and what has vested; the rest returns to the sponsor. The public site introduces the idea, shows the mechanism, answers the hard questions honestly, and hands off to `apps/dapp` for wallet-connect. It has no accounts and no wallet-connect of its own.

## Positioning

An employer match works because it is tied to time. AquaStock gives people with no employer a match they can check: locked in a program, visible, and earned in a straight line. It is a savings rule, not a yield product.

## Conversion & proof

- Primary CTA: open the app (connect a wallet).
- Secondary CTA: see how it works, then read the FAQ.
- The line a visitor should remember after 10 seconds: a sponsor funds a match, you deposit, and the match is yours as it vests; leave early and it goes back.
- Belief ladder: I can see exactly what a match is worth if I stay and if I don't; the numbers are on-chain, not promised; the risks (the token's issuer, the unaudited program, the upgrade authority) are stated plainly; I can try it right now on devnet.
- Proof on hand: none beyond the working demo itself. This is a hackathon build. Do not claim sponsors, partnerships, deposits, returns or production availability that don't exist. Every number on the site is labelled illustrative.

## Brand Personality

Direct, credible and unshowy. AquaStock should read like a clear statement of a rule, not a token launch: plain numbers, exact terms, no hype.

## Anti-references

Do not make AquaStock feel like a speculative crypto/DeFi project. Avoid token-price framing, yield or APY promises, neon-Web3 visual tropes, and vague "revolutionizing savings" language. This is a transparency tool for a savings rule, not an investment pitch.

## Design Principles

1. Lead with the mechanism (a deposit, a match, a vesting line, what leaving early costs), not the blockchain.
2. Make the two currents visible at a glance: the sponsor's match and your own savings, one position.
3. Never imply more certainty, scale or adoption than a hackathon build has. Label illustrative numbers.
4. Keep the legal reality visible: this is a demo and does not constitute an offer of securities.
5. State the risks as facts next to the claim they qualify: the issuer's powers, the unaudited program, the upgrade authority.
6. Draw the mechanism in code (HTML/SVG) rather than stock photography, so it follows the theme and cannot overclaim.

## Accessibility & Inclusion

Target WCAG 2.2 AA for the public web experience, including strong text contrast, keyboard-accessible interactions, visible focus, semantic structure, and readable English and Spanish (the hackathon spec and likely audience are Peru/Latam-facing). Use transitions and animations purposefully, with a reduced-motion alternative that preserves comprehension without unnecessary movement.
