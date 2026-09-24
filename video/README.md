# AquaStock demo video

The Stocklana submission video (1920×1080, 30 fps, about 2:21), made with [Remotion](https://www.remotion.dev). It follows `docs/DEMO_SCRIPT.md` section 2: the problem, the idea, the working product on devnet, the honest caveats, why Solana, and where to try it.

This folder is its own pnpm root, kept out of the repo's workspace like `programs/`, so Remotion, MapLibre and Playwright never reach the lockfile Vercel installs for `apps/web` and `apps/dapp`.

## Commands

Run from this folder (or `pnpm video:<command>` from the repo root):

| Command                         | What it does                                                                                   |
| ------------------------------- | ---------------------------------------------------------------------------------------------- |
| `pnpm install`                  | Installs this folder's dependencies.                                                           |
| `pnpm studio`                   | Opens Remotion Studio: the full video (`AquaStockDemo`) and each scene on its own timeline.    |
| `pnpm render`                   | Renders `out/aquastock-match-pools-demo.mp4`. Needs network (Google Fonts, MapLibre's worker). |
| `pnpm capture`                  | Records the live devnet app again (see below). Spends 3 faucet requests.                       |
| `pnpm lint`, `pnpm check-types` | ESLint (Remotion's rules) and TypeScript, for `src/` and `capture/`.                           |

## How the product footage is made

Every screen in the demo chapter is a screenshot of the live app, `aquastock-dapp.vercel.app`, on Solana devnet, and every signature on the Proof Rail (the two strands under the demo) is a real devnet transaction from that run.

`capture/capture.ts` drives the app with Playwright. The app finds wallets through the Wallet Standard, so `capture/wallet.ts` registers a small scripted wallet in the page; each signature is made in Node with `node:crypto`'s Ed25519, so no private key enters the page, and no new dependency is needed. The wallets are throwaway keys funded by the app's own "Get demo tokens" faucet, the way a judge's wallet would be. The run:

1. A sponsor creates and funds a pool, "Video demo: 1:1 match, 3-minute vesting" (100 dSPYx budget, 50 per saver, open 60 minutes).
2. Saver A and saver B each get demo tokens and deposit 40 dSPYx.
3. The pool page is shot as the match vests; saver B withdraws about halfway; saver A claims about two minutes in.
4. The pool's activity feed, the "What you actually own" card and the deposit on Solana Explorer are shot last.

Output goes to `public/capture/` (JPEG screenshots at 2× and `manifest.json`: shot positions of the buttons pressed, addresses and signatures). The video reads the manifest through a type guard (`src/lib/capture-manifest.ts`) and fails loudly if a shot is missing. Run state, including the throwaway keys, stays in `capture/.state` (gitignored), so a failed step resumes without spending the faucet again.

**What was retaken.** The first run's wizard screenshots left the pressed buttons below the fold. The wizard screens were re-shot with the same inputs, stopping before "Create" (`pnpm capture --retake-wizard`), so no second pool exists; for the fund step the sponsor wallet got saver B's 100 demo dSPYx (both are the capture's own throwaway wallets) instead of a fourth faucet request. The pool, deposits, withdrawal and claim shown are from the original run.

## The recorded run (24 September 2026)

- Pool: [`BkvtfcMJGVvCXbjVPbKMLM1e6FAXGQNqHmP1PmbziqNZ`](https://aquastock-dapp.vercel.app/en/pools/BkvtfcMJGVvCXbjVPbKMLM1e6FAXGQNqHmP1PmbziqNZ)
- Sponsor `59kL…oKDU`, saver A `8XSJ…UMxD`, saver B `8B53…5cPv`
- Signatures: `public/capture/manifest.json` → `transactions`.

## Design

Built with `.claude/skills/frontend-design` and the brand references (`apps/web/PRODUCT.md`, `apps/dapp/PRODUCT.md`, `apps/dapp/DESIGN.md`, `docs/VISUAL.md`):

- **Ground and colour.** The web site's "abyss" navy, Reservoir teal as the one action colour, and the two streams, Anchor (the sponsor's match) and Terra (the saver's savings), always next to a label. Hex values are converted from the OKLCH tokens in `apps/web/src/app/globals.css`.
- **Type.** Funnel Display for statements, Funnel Sans for supporting lines, Geist Mono for figures, signatures and instruction names: the web's pairing, with the dApp's mono.
- **Signature: the Proof Rail.** Two strands under the demo collect each transaction as it lands: a deposit ties the sponsor's strand to the saver's, a withdrawal sends the unvested match back up. By the end it is a ledger of real devnet signatures.
- **The Confluence ring** is the dApp's own instrument (`match-ring.tsx`), redrawn frame by frame: two arcs close into one ring and the 60-tick bezel fills as the match vests.
- **The map** is MapLibre on a globe, from Natural Earth 1:110m outlines (public domain) bundled in `public/geo`, so it needs no tile server or API key. Its routes are the web home's illustrative ones and the frame says they are not real pools.

## Sources for on-screen facts

- $2,500 a year of employer money in Trump Accounts: [US Treasury](https://home.treasury.gov/news/press-releases/sb0372) (also in `docs/PIVOT_PLAN.md`).
- 8 instructions, 33 tests: `docs/PROGRAM.md`, `programs/`.
- 0.000005 SOL fee: the recorded deposit on Solana Explorer (shot `explorer-deposit`).

## Adding a voiceover

The video carries its story in on-screen text and has no audio. To add narration, record it over the rendered file, or generate it with a TTS provider (Remotion's voiceover guide uses ElevenLabs with an `ELEVENLABS_API_KEY` you set yourself) and add it as an `<Audio>` track. A script timed to the current cut:

| Time      | Scene        | Narration                                                                                                                                                                                                                                                                     |
| --------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00–0:05 | Title        | AquaStock Match Pools: the employer match, for people without an employer.                                                                                                                                                                                                    |
| 0:05–0:31 | The problem  | In the US, new Trump Accounts let an employer add up to $2,500 a year. Contractors, gig workers and savers everywhere else get nothing like it. Match Pools lets anyone be the employer: a DAO, an NGO, a city, or a relative abroad.                                         |
| 0:31–0:50 | How it works | A sponsor locks a match budget and sets the rules. When a saver deposits, their match is reserved in the same transaction and vests in a straight line. Leave early, and you keep your deposit and what has vested; the rest goes back.                                       |
| 0:50–1:45 | Live demo    | This is the real app on devnet. A sponsor creates a pool with a three-minute demo vesting. Two savers deposit forty each; the match is reserved at once. Saver B leaves halfway and sees the cost first. Saver A stays and claims. Every step is a transaction you can check. |
| 1:45–2:01 | Trust        | We are honest about the asset: the issuer can pause, freeze and move tokens, and the app shows it. The program is unaudited, and this is a devnet demo.                                                                                                                       |
| 2:01–2:21 | Why Solana   | xStocks are Token-2022 mints on Solana, fees are small enough for a five-dollar saver, and the match is enforced by a program. Try it on devnet today.                                                                                                                        |
