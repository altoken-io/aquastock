# apps/dapp

Wallet-native dApp frontend for AquaStock user flows.

## Responsibilities

- Account/dashboard UX
- Wallet connection and chain-aware clients
- Staking/governance/vault surfaces (as enabled)

## Run Locally

```bash
pnpm --filter dapp dev
pnpm --filter dapp check-types
pnpm --filter dapp lint
pnpm --filter dapp build
```

Default local URL: `http://localhost:3002`

## Required Environment

Create `apps/dapp/.env.local` and set:

- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

## Shared Dependencies

- Uses `@aquastock/sdk` for chain descriptors and clients
- Uses `viem`/`wagmi`/`rainbowkit` for wallet infra

## Notes

- Keep chain constants centralized in `packages/sdk`
- Avoid duplicating protocol addresses or chain metadata in app code
