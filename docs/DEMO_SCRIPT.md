# Demo script — Match Pools

**Status (2026-09-20): every beat below is built and was dry-run against a local validator with the timed spec `apps/dapp/e2e/demo-dry-run.spec.ts` (`pnpm test:e2e demo-dry-run`). Nothing was cut. See section 9 for the results and for what the dry run did not prove.** Since 2026-09-22 the app is live on devnet with a demo faucet and a standing pool (section 7), so a person can rehearse it with real wallets; that rehearsal is still to do.

Judges ask one question: _could this be a real app people will use?_ They look for a real user and problem, a working end-to-end demo, a reason it belongs on Solana, and execution quality. Every beat below serves one of those four.

## 1. The 90-second live script

The demo uses three wallets (sponsor, saver A, saver B) and a pool with a **demo timescale**: vesting is set to about 3 minutes so it can be watched live. Say so out loud. A real pool would vest over months.

| Time      | Screen                                   | Say                                                                                                                                                                               | On-chain proof                 | Depends on                                  |
| --------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------- |
| 0:00–0:10 | Title slide, then `/pools`               | "Employers match savings, but only if you have one. This July the US launched accounts where an employer can add up to $2,500 a year. Contractors and non-US savers get nothing." | none                           | Deck slide 1                                |
| 0:10–0:25 | Sponsor wizard                           | "A sponsor creates a pool: SPYx, a 1:1 match, a per-saver cap, a vesting period. They fund the match budget."                                                                     | `create_pool`, `fund_match` tx | Sponsor wizard, `create_pool`, `fund_match` |
| 0:25–0:45 | Saver A, pool detail                     | "Saver A deposits real SPYx. The match is reserved on-chain immediately. Two streams, sponsor and saver, flow into one position."                                                 | `deposit` tx; Confluence ring  | Wallet-adapter, `deposit`, pool detail      |
| 0:45–1:05 | Saver A, `/my-match`                     | "The match vests over time. Here is what has vested so far. Claim it."                                                                                                            | `claim_vested` tx              | `claim_vested`, my-match                    |
| 1:05–1:20 | Saver B, withdraw preview, then withdraw | "Saver B leaves early. The preview shows the unvested match goes back to the sponsor's budget. That is the incentive."                                                            | `withdraw` tx; budget updates  | `withdraw`, forfeiture preview              |
| 1:20–1:30 | "What you actually own" card, then close | "Be honest about the asset: the issuer can pause or move these tokens. We show that, cap deposits, and label this a demo. Sponsors bring the match. We bring the rails."          | Explorer links                 | Disclosure card                             |

Rules for the live run:

- Open every transaction's Explorer link in a tab before you start. Do not wait for pages to load on stage.
- Say "demo timescale" when you mention vesting. Say "devnet replica": the team decided on devnet only (see `PIVOT_PLAN.md` section 8).
- If a step fails, narrate what the chain says and move on. Do not debug live.

## 2. The 2–3 minute video

Record on mainnet with the hard caps if the mainnet run works. Otherwise record on the devnet replica and say so on screen.

| Time      | Content                                                                                                               |
| --------- | --------------------------------------------------------------------------------------------------------------------- |
| 0:00–0:25 | Problem: matches are tied to employers and US custodians. Cite the Trump Accounts launch and the $2,500 employer cap. |
| 0:25–0:45 | Solution: Match Pools. One sentence, then the sponsor, pool, saver flow as a diagram.                                 |
| 0:45–2:15 | The live demo from section 1, at natural speed, with captions.                                                        |
| 2:15–2:40 | Trust and honesty: the issuer's powers (pause, permanent delegate), deposit caps, unaudited, demo timescale.          |
| 2:40–3:00 | Why Solana, who uses it next, roadmap, repo link.                                                                     |

Captions in English, with Spanish subtitles if there is time. Record at 1080p. Show the Explorer link after every transaction.

## 3. The deck (6 slides)

1. **Problem.** The match is an employer perk. Contractors and non-US savers are left out. One number, sourced (Trump Accounts: up to $2,500 a year from an employer).
2. **Solution.** Match Pools in one sentence and one diagram: sponsor budget plus saver deposit, vesting, forfeiture.
3. **How it works.** The seven user-facing instructions (`create_pool`, `fund_match`, `deposit`, `claim_vested`, `withdraw`, `reclaim_unmatched`, `close_position`) and the three accounts (`Config`, `Pool`, `Position`, plus the vault), on one slide. Show the vesting timeline.
4. **Demo proof.** Screenshots and Explorer links for each step.
5. **Trust.** What the issuer can do (pause, permanent delegate, freeze), what our program cannot do, deposit caps, unaudited. This slide is the differentiator against the PreStocks-style failures.
6. **Why Solana and what next.** Token-2022 support, fees low enough for $5 savers, 24/7. Roadmap: more index tokens, sponsor allow-lists, USDC matches priced by Pyth.

## 4. Likely judge questions

| Question                                       | Honest answer                                                                                                                                                                                                                                                           |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Who is the sponsor, really?                    | Hypothesis: crypto-native orgs and DAOs paying contributors in USDC with no benefits, plus NGOs and families. **Validate this** with 2–3 real conversations before submitting and put one quote in the deck.                                                            |
| What if the issuer pauses or moves the tokens? | Withdrawals stall while paused; the program has no way to move funds itself. The issuer can move any holder's tokens, including ours. We show this in the UI.                                                                                                           |
| Why match in the same stock, not USDC?         | The ratio needs no price oracle, and it mirrors an employer stock match. The sponsor holds the price risk. USDC matches priced by Pyth are on the roadmap.                                                                                                              |
| What about dividends and the multiplier?       | Deposit and match are the same mint in raw units, so the multiplier applies to both equally. The UI converts typed amounts to raw units so it does not misstate balances.                                                                                               |
| Can someone farm the match with many wallets?  | Each wallet is capped, and unvested match is forfeited on early withdrawal, but many wallets multiply the per-saver cap. Total loss is bounded by the pool budget. Sponsor allow-lists are on the roadmap.                                                              |
| Is this a securities offering?                 | We issue nothing. Sponsors and savers use existing tokens. This is a demo with a disclaimer, not legal advice, and it has had no legal review.                                                                                                                          |
| Is it live on mainnet? Audited?                | Say exactly what is true on the day. It is unaudited, with hard deposit caps.                                                                                                                                                                                           |
| Who controls the program?                      | The upgrade authority is the team's deploy wallet, so the team could change how pools behave. It is disclosed in the app (the create-pool review, the FAQ, the operator console). It is unaudited. Say whether you have moved it to a multisig or burned it by the day. |
| Why now?                                       | Trump Accounts launched July 4, 2026 with employer contributions, and the PreStocks collapse in May 2026 shows why asset transparency matters.                                                                                                                          |

## 5. Do not say

- "Audited", "regulated", "first ever", or "nothing like this exists". We found no equivalent, and that is not proof.
- "Live for real users." It is a capped demo.
- Any figure not sourced in [PIVOT_PLAN.md](PIVOT_PLAN.md).
- That vesting takes minutes in real pools. It is a demo setting.

## 6. Pre-flight checklist

Start with `pnpm demo:preflight`: it checks the live deployment the way a judge meets it (build, faucet on, faucet balance with `--faucet <address>`, an open pool with match left through judging, the database, the market price and its source, the pages and their disclaimer, the security headers, the marketing site's link, and whether the repository is public) and exits 1 if anything a judge needs is missing. `pnpm demo:preflight --live` then runs a real faucet → deposit → claim → withdraw → close round trip on devnet with a throwaway wallet, records each transaction in the activity feed, and prints how long each step took on the real network. The manual items below are what it cannot check.

- [ ] Three wallets funded: sponsor, saver A, saver B. On devnet, connect each one and press **Get demo tokens** (100 dSPYx and 0.02 SOL; three times per wallet a day). Check the operator console's Deployment card first: it shows what the faucet has left.
- [ ] Neon database pinged (the free tier suspends after about 5 minutes idle).
- [ ] Primary RPC and a backup RPC both tested.
- [ ] Demo pool created, budget funded, demo timescale set.
- [ ] Explorer tabs and wallet popups ready; notifications off; clean browser profile.
- [ ] Mobile viewport checked (judges may open the link on a phone).
- [ ] Three full dry runs, timed under 90 seconds.
- [ ] Fallback recording of a successful run saved locally.
- [ ] Upgrade authority decision made and written on slide 5.
- [ ] Disclaimer visible on every page: "Demo — this does not constitute an offer of securities."

## 7. Letting judges try it themselves

The live app is on Solana devnet with demo tokens that have no value, so a judge can run the whole saver flow alone in about two minutes:

1. Open https://aquastock-dapp.vercel.app/en/pools (the marketing site's "Open the app" goes there too; the dApp's bare `/` is the staff sign-in, so never share that).
2. Switch the wallet to devnet (Phantom: Settings, Developer Settings, Testnet Mode, Solana Devnet; Solflare: Settings, Network, Devnet). A wallet left on mainnet will warn that the transaction may fail.
3. Connect, open the pool "Try it: 1:1 match, 10-minute vesting" (`45K6H9DxvtYnmuXQDVjwFn3V4mgLbT3wYLBGfdfTHTSf`), and press **Get demo tokens**.
4. Deposit up to 100 dSPYx, watch the match vest on **My match**, claim, and withdraw early to see the forfeiture preview.

Put the link and these four lines in the submission form and the README. The standing pool is open until 2026-11-06 with a 10,000 dSPYx budget (100 savers at the cap); create another with `pnpm solana:demo-pool` (see `SETUP.md`) if it fills up.

## 8. What must exist for this script to be true

`create_pool`, `fund_match`, `deposit`, `claim_vested`, `withdraw`, wallet connect, the sponsor wizard, pool detail with the Confluence ring, my-match, the forfeiture preview, and the "what you actually own" card. If any is missing at the Thu 2026-09-24 freeze, cut its beat and re-time the script.

## 9. Dry-run results (2026-09-20)

**Method.** The timed spec drives each beat in order and records how long the app takes, not the narration. It runs on a desktop and a 390 px mobile viewport, against a local validator with the program, the mainnet Token-2022 build and a demo replica mint. It uses one wallet where the live demo uses three, so that wallet plays sponsor for beat 2 and saver for the rest. A separate golden-path spec (`pnpm test:e2e`) checks the same flows with assertions on the numbers.

| Beat                              | Window | Desktop | Mobile | Works |
| --------------------------------- | ------ | ------- | ------ | ----- |
| 1. Open `/pools`                  | 10 s   | 0.5 s   | 0.4 s  | yes   |
| 2. Sponsor creates and funds      | 15 s   | 5.5 s   | 5.0 s  | yes   |
| 3. Saver deposits                 | 20 s   | 3.4 s   | 4.2 s  | yes   |
| 4. My match, claim                | 20 s   | 3.7 s   | 2.8 s  | yes   |
| 5. Withdraw, with preview         | 15 s   | 3.8 s   | 2.9 s  | yes   |
| 6. Issuer card, claim rest, close | 10 s   | 1.8 s   | 1.8 s  | yes   |
| **Total**                         | 90 s   | 18.5 s  | 17.1 s |       |

An Explorer link ("View transaction") appears after every transaction, so the "open every link in a tab first" rule is doable.

**What this does not prove.**

- **Real-network latency.** A local validator confirms in well under a second. On devnet or mainnet each of the five transactions takes seconds, plus the time a wallet spends asking for approval. The beats have 3 to 10 times the headroom the local run used, but time it on the day's network.
- **Two savers.** The live script has saver A and saver B. Beat 5 (leaving early) is the same code path whichever wallet runs it, but a second wallet was not used.
- **A real wallet extension.** The dry run used the throwaway test wallet, which signs without a prompt. Phantom or Solflare adds an approval step per transaction.
- **Beat 0 (the title slide) and the video.** They need the deck, which is not built.
- **Mainnet.** Nothing is deployed. The "what you actually own" card was read against the local replica mint, whose extensions match SPYx's; on mainnet it reads the real mint.

**If a step fails on stage**, narrate what the chain says and move on (the transaction status names the program's error in plain words).
