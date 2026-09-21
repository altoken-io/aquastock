# AquaStock tone and UI-writing guide

## Voice

AquaStock sounds clear, concrete and accountable: the confidence of a tool that shows its work, not a token launch or a pitch. It should read like a good bank statement written by someone who wants you to understand it: plain words, exact numbers, and the bad news stated as plainly as the good.

The desired feeling is **a commitment you can check**: the sponsor's match and your own savings, both visible, one rule for how it vests. Write as a transparency tool, not a crypto protocol and not an investment platform.

| Use                                                   | Avoid                                   |
| ----------------------------------------------------- | --------------------------------------- |
| "The sponsor adds 100% of what you deposit."          | "Earn free yield on your stocks"        |
| "10 of 40 dSPYx has vested."                          | "Your rewards are growing"              |
| "Match you give up goes back to the sponsor."         | "A small penalty may apply"             |
| "The issuer can pause transfers and freeze accounts." | "Fully trustless"                       |
| "This is a hackathon demo."                           | anything implying a real, live offering |
| "See the transaction"                                 | "Immutable proof of settlement"         |

## Tone by moment

- **Deposits and claims:** short, direct, exact. "Deposit 40 dSPYx." "Claim 21.9 dSPYx." "View transaction."
- **Leaving early:** state the cost before the person acts, as numbers: what you get back, what you keep, what you give up. Never soften it and never dramatise it.
- **Sponsor vs. saver framing:** precise, never editorialising. Say who funded what; let the numbers speak.
- **Errors:** say what happened and what to do, in the interface's voice. Errors don't apologise and are never vague ("The match available dropped while you were confirming. Review the new amount and try again.").
- **Disclosures:** the token's issuer powers and the program's upgrade authority are stated as facts, next to the action they affect, never in fine print.
- **Legal:** every legal-facing surface carries the demo disclaimer, never diluted with marketing language.

## Point of view and language

Use second person for actions: "Connect your wallet", "Deposit dSPYx". Use third person for product definition: "The sponsor adds...", "AquaStock reads the chain."

Write in plain English or clear Peruvian Spanish per the active locale, and translate meaning, not word order. Use the Spanish terms consistently: pool = **fondo**, sponsor = **patrocinador**, saver = **ahorrador**, match = **aporte**, vests = **se libera**, wallet = **billetera**. Numbers in `es` use a dot for decimals (`es-PE`). Keep product names and technical terms unchanged: **AquaStock**, **Solana**, **SPYx**. The token's symbol keeps its exact case (`dSPYx`, `SPYx`): never upper-case it. Never expose implementation details (raw units, PDAs, program error names, database IDs) in user-facing copy.

## Honesty rules

- Nothing shows as vested, claimed or paid before the chain says so.
- Illustrative numbers are labelled "illustrative" on the surface that shows them.
- A vesting period under a week is labelled as a demo timescale.
- Never state or imply a return, a yield or safety. The match is a sponsor's promise made enforceable by a program that is unaudited.
