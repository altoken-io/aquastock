# Match Pools program

The on-chain program behind AquaStock's Match Pools. **Status: interface frozen on 2026-09-20 for the UI and server work; unaudited; a demo, not an offer of securities.** The IDL is checked in as a typed constant at `packages/types/src/program/match_pools.ts` (import `@aquastock/types/program`). Regenerate it with `pnpm program:idl` and review the diff; never edit it by hand.

## What it does

A sponsor creates a pool with a match budget and rules. Savers deposit the pool's Token-2022 index stock (SPYx on mainnet, a replica on devnet). Each deposit reserves a match from the budget, first come first served, and that match vests linearly. Leaving early forfeits the unvested match back to the sponsor's unreserved budget.

Deposit and match are the same mint in raw units, so the ratio needs no price oracle.

## Trust model

- **The program cannot move a saver's principal anywhere except back to that saver.** Vault transfers are signed by the pool PDA and only in `claim_vested`, `withdraw` and `reclaim_unmatched`, each to a token account owned by the caller.
- **The upgrade authority can replace the program.** It is the deployer's key unless burned or moved to a multisig. This deployment keeps the deployer as upgrade authority and discloses it in the UI.
- **The token issuer can override everything.** SPYx has a permanent delegate (can move tokens out of any account, including a vault), a freeze authority, and a pause authority. The program cannot prevent this; tests prove it fails cleanly (see Issuer powers).
- No admin key can touch a pool. `Config` is written once and has no update instruction.

## Deployment model

- One deployment per network. `init_config` is callable **once, only by the program's upgrade authority**, and records the single mint pools may hold. It refuses a mint the pools could not safely hold (see Mint rules).
- Build target is **SBPF v0** (`--arch v0`). Anchor 1.2 defaults to v3, which LiteSVM rejects and mainnet may not accept yet.
- The declared program id must match the deployed id. `pnpm program:deploy` syncs it before building.

## Accounts

All amounts are raw token units. Seeds use the program id.

| Account               | PDA seeds                           | Fields                                                                                                                                                                                         |
| --------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Config`              | `["config"]`                        | `admin`, `allowed_mint`, `bump`                                                                                                                                                                |
| `Pool`                | `["pool", sponsor, pool_id_le_u64]` | `sponsor`, `mint`, `vault`, `pool_id`, `match_bps`, `per_saver_cap`, `vesting_seconds`, `created_at`, `ends_at`, `budget_total`, `reserved`, `claimed`, `deposits_total`, `bump`, `vault_bump` |
| vault (token account) | `["vault", pool]`                   | Token-2022 account owned by the pool PDA, sized for the mint's required account extensions                                                                                                     |
| `Position`            | `["position", pool, saver]`         | `pool`, `saver`, `deposited`, `match_reserved`, `match_claimed`, `started_at`, `settled`, `bump`                                                                                               |

## Instructions

| Instruction         | Signer            | Arguments                                                                                                                                 | Effect                                                                                                                                                                                                                                                  |
| ------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `init_config`       | upgrade authority | none                                                                                                                                      | Creates `Config` for one allow-listed mint. Once only.                                                                                                                                                                                                  |
| `create_pool`       | sponsor           | `params` (`pool_id`, `match_bps` 1..=10000, `per_saver_cap` > 0, `vesting_seconds` 30..=5 years, `ends_at` in the future, within 5 years) | Creates the pool and its vault. The mint must equal `Config.allowed_mint`.                                                                                                                                                                              |
| `fund_match`        | sponsor           | `amount` > 0                                                                                                                              | Adds to the match budget. Only before `ends_at`.                                                                                                                                                                                                        |
| `deposit`           | saver             | `amount` > 0, `min_match`                                                                                                                 | Moves `amount` into the vault, reserves `min(floor(amount * match_bps / 10000), unreserved)` of match, and creates the saver's `Position`. Reverts if the match would be below `min_match`, so a saver is never silently matched less than the preview. |
| `claim_vested`      | saver             | none                                                                                                                                      | Pays `vested - claimed`. Vesting is linear from `started_at` over `vesting_seconds`, rounded down.                                                                                                                                                      |
| `withdraw`          | saver             | none                                                                                                                                      | Returns the whole principal. Forfeits the unvested match to the unreserved budget. What had vested stays claimable. Allowed at any time, including after the pool ends.                                                                                 |
| `reclaim_unmatched` | sponsor           | none                                                                                                                                      | After `ends_at`, returns `budget_total - reserved` to the sponsor. Match forfeited later by a withdrawal becomes reclaimable the moment it is forfeited.                                                                                                |
| `close_position`    | saver             | none                                                                                                                                      | Closes a settled position whose reserved match is fully claimed, returning its rent. Frees the saver's slot for a new deposit in that pool.                                                                                                             |

### Decisions worth knowing

- **Per-saver cap is a cap on the deposit**, rejected if exceeded; it does not clamp the match.
- **One live position per saver per pool.** A second `deposit` fails until the position is closed.
- **Claim after withdraw is allowed** for the vested part. `settled` marks that the unvested part is gone, so vesting is not recomputed on what remains.
- **Time comes only from the `Clock` sysvar.**

## Mint rules

Checked when a mint is allow-listed (`init_config`) and again in `create_pool`. Per-transfer checks (paused, hook enabled) run in every instruction that moves tokens, because the issuer can change them after the fact.

| Extension                                       | Accepted                  | Why                                                                                                        |
| ----------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `ScaledUiAmount`                                | yes                       | Display only. Raw amounts never change, and no arithmetic here reads it.                                   |
| `Pausable`                                      | yes                       | Issuer can stall transfers. Checked up front so the caller gets `MintPaused`. Funds are stalled, not lost. |
| `PermanentDelegate`                             | yes                       | Issuer can move tokens out of the vault. Not preventable; disclosed.                                       |
| `DefaultAccountState`                           | only `Initialized`        | A frozen default would create a vault nobody can spend from.                                               |
| `TransferHook`                                  | only with no hook program | An enabled hook needs extra accounts on every transfer.                                                    |
| `MetadataPointer`, `TokenMetadata`              | yes                       | Cosmetic.                                                                                                  |
| `ConfidentialTransferMint`                      | yes                       | Opt-in per account; only plain `transfer_checked` is used.                                                 |
| anything else (for example `TransferFeeConfig`) | no                        | Would make the vault receive less than the books record.                                                   |

Decimals must be 8. The mint must be owned by the Token-2022 program.

## Accounting identities

Asserted after every operation in the randomized tests:

- `reserved <= budget_total` and `claimed <= reserved`.
- `vault balance == budget_total - claimed + deposits_total` (exact, because only the program moves vault funds; logic never reads the vault balance).
- `sum(position.deposited) == deposits_total`.
- `sum(position.match_reserved - position.match_claimed) == reserved - claimed`.
- A failed call changes neither the books nor any balance.
- Total tokens held by sponsor, savers and vault are conserved.
- Run to completion, every pool ends with an empty vault and no position left open.

## Issuer powers

Tested against a replica of the mainnet SPYx mint on the mainnet Token-2022 build:

- **Pause:** all four token-moving instructions refuse with `MintPaused`; nothing changes; after resume the saver receives everything owed.
- **Multiplier change mid-vest:** raw balances and vesting are unaffected.
- **Permanent-delegate drain or vault freeze:** withdrawals fail with the token program's own error and the books stay as they were. There is no on-chain remedy.
- **Hook enabled after allow-listing:** new pools and transfers are refused with `TransferHookEnabled`.

## Events

`Claimed`, `ConfigInitialized`, `Deposited`, `MatchFunded`, `PoolCreated`, `PositionClosed`, `UnmatchedReclaimed`, `Withdrawn`. Every state change emits one.

## Errors

| Code | Name                       | Message                                                            |
| ---- | -------------------------- | ------------------------------------------------------------------ |
| 6000 | `MathOverflow`             | Arithmetic overflow                                                |
| 6001 | `Unauthorized`             | Only the pool sponsor can do this                                  |
| 6002 | `WrongMint`                | The mint does not match this pool                                  |
| 6003 | `WrongVault`               | The vault does not match this pool                                 |
| 6004 | `InvalidMatchBps`          | Match ratio must be between 1 and 10000 basis points               |
| 6005 | `InvalidPerSaverCap`       | Per-saver cap must be greater than zero                            |
| 6006 | `InvalidVestingDuration`   | Vesting period is outside the allowed range                        |
| 6007 | `InvalidPoolWindow`        | Deposit window must end in the future and within the allowed range |
| 6008 | `InvalidMintDecimals`      | Mint decimals are not supported                                    |
| 6009 | `UnsupportedMintExtension` | Mint has an extension this program does not accept                 |
| 6010 | `TransferHookEnabled`      | Mint has an enabled transfer hook                                  |
| 6011 | `FrozenByDefault`          | Mint creates token accounts frozen by default                      |
| 6012 | `MintPaused`               | Mint transfers are paused by the issuer                            |
| 6013 | `ZeroAmount`               | Amount must be greater than zero                                   |
| 6014 | `PoolEnded`                | The deposit window has closed                                      |
| 6015 | `PoolNotEnded`             | The pool has not ended yet                                         |
| 6016 | `DepositExceedsCap`        | Deposit exceeds the per-saver cap                                  |
| 6017 | `BudgetExhausted`          | The match budget is exhausted                                      |
| 6018 | `MatchBelowMinimum`        | Match available is below the minimum requested                     |
| 6019 | `NothingToClaim`           | There is no vested match to claim                                  |
| 6020 | `AlreadyWithdrawn`         | This position has already been withdrawn                           |
| 6021 | `MintNotAllowed`           | This mint is not the one this deployment allows                    |
| 6022 | `NothingToReclaim`         | There is no unreserved budget to reclaim                           |
| 6023 | `PositionStillActive`      | The position still has a deposit or unclaimed match                |

## Testing

`pnpm program:test` builds the program as SBPF v0 and runs:

- unit and property tests of the vesting math (`cargo test --lib`),
- `tests/token2022_gate.rs`: the Token-2022 behavior against the replica mint,
- `tests/pool_lifecycle.rs`: every instruction's success and failure paths, plus 25 randomized operation sequences.

Tests run on LiteSVM against the mainnet Token-2022 build fetched by `pnpm program:fixtures`. LiteSVM is not a validator; the local-validator smoke run (`pnpm program:smoke`) covers that gap.

## Not built

`close_pool` (the pool and vault rent stay locked), top-up deposits, USDC-denominated matches, saver allow-lists, and any on-chain price. Many wallets multiply the per-saver cap; total loss is bounded by the pool budget.
