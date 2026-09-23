#!/usr/bin/env bash
# One command for a complete local demo, with no keys of yours and no real network:
#   - a disposable Postgres (docker) with migrations applied
#   - a local Solana validator with the program and the mainnet Token-2022 build
#   - a demo replica mint, an allow-listed config, and a funded demo pool with one deposit
#   - a throwaway BROWSER WALLET (programs/keys/e2e-wallet.json, gitignored) that is funded with
#     SOL and demo tokens and registered as a test wallet in the app, so the whole flow can be
#     clicked through without a wallet extension
#   - the dapp on http://localhost:3003, wired to all of the above
#
# The test wallet's secret is exposed to the browser on purpose (a NEXT_PUBLIC variable), which
# is only acceptable because the key is a throwaway on a validator that dies with this script.
# The app refuses to register it on any network but `localnet`.
#
#   pnpm dev:stack             # Ctrl+C stops everything
#   pnpm dev:stack --webpack   # use the project's webpack dev server instead
#   DEV_STACK_TEST_WALLET=0 pnpm dev:stack   # no test wallet: see the app as a visitor
#                                            # without a wallet (the phone connect flow)
#
# The app runs on Turbopack here. The project's own `pnpm dev` uses webpack, which with the wallet
# stack loaded grows to several GB and can serve truncated multi-MB chunks (hydration then fails
# silently while the server-rendered HTML still looks fine).
set -euo pipefail

# pnpm may forward a bare `--` before the flags.
[ "${1:-}" = "--" ] && shift
MODE="${1:-}"

export PATH="$HOME/.local/share/solana/install/active_release/bin:$HOME/.cargo/bin:$PATH"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RPC="http://127.0.0.1:8899"
DB_PORT="${POSTGRES_HOST_PORT:-5434}"
export DATABASE_URL="postgresql://postgres:postgres@localhost:${DB_PORT}/aquastock"
export DIRECT_URL="$DATABASE_URL"
KEYS="$ROOT/programs/keys"
DEPLOYER="$KEYS/localnet-wallet.json"
BROWSER_WALLET="$KEYS/e2e-wallet.json"
FAUCET_WALLET="$KEYS/faucet-localnet.json"
LOG="$ROOT/programs/target"
mkdir -p "$KEYS" "$LOG"

echo "==> database (port $DB_PORT)"
POSTGRES_HOST_PORT="$DB_PORT" docker compose -f docker-compose.dev.yml up -d >/dev/null
for _ in $(seq 1 30); do
  docker exec aquastock-postgres pg_isready -U postgres >/dev/null 2>&1 && break
  sleep 1
done
pnpm --filter @aquastock/db-prisma exec prisma migrate deploy >/dev/null

echo "==> local validator"
bash scripts/localnet.sh >"$LOG/dev-validator.log" 2>&1 &
VALIDATOR=$!
trap 'kill "$VALIDATOR" 2>/dev/null || true; wait "$VALIDATOR" 2>/dev/null || true' EXIT
for _ in $(seq 1 90); do
  solana cluster-version --url "$RPC" >/dev/null 2>&1 && break
  kill -0 "$VALIDATOR" 2>/dev/null || { echo "validator exited; see $LOG/dev-validator.log"; exit 1; }
  sleep 1
done
solana airdrop 100 "$(solana-keygen pubkey "$DEPLOYER")" --url "$RPC" >/dev/null

echo "==> browser test wallet"
[ -f "$BROWSER_WALLET" ] || solana-keygen new --no-bip39-passphrase --silent --outfile "$BROWSER_WALLET"
BROWSER_PUBKEY="$(solana-keygen pubkey "$BROWSER_WALLET")"
solana airdrop 20 "$BROWSER_PUBKEY" --url "$RPC" >/dev/null

echo "==> demo pool"
PROGRAM_ID="$(grep -oP 'declare_id!\("\K[^"]+' programs/programs/match_pools/src/lib.rs)"
SEED="$(pnpm exec tsx scripts/solana/demo-pool.ts --rpc "$RPC" --wallet "$DEPLOYER" --program "$PROGRAM_ID" --with-saver 40 --vesting 180 --window 7200)"
MINT="$(printf '%s' "$SEED" | python3 -c 'import sys,json; print(json.load(sys.stdin)["mint"])')"
POOL="$(printf '%s' "$SEED" | python3 -c 'import sys,json; print(json.load(sys.stdin)["pool"])')"
pnpm exec tsx scripts/solana/mint-replica.ts --rpc "$RPC" --wallet "$DEPLOYER" --mint "$MINT" --to "$BROWSER_PUBKEY" --amount 1000 >/dev/null

echo "==> demo faucet"
pnpm exec tsx scripts/solana/faucet-setup.ts --rpc "$RPC" --wallet "$DEPLOYER" --mint "$MINT" --faucet "$FAUCET_WALLET" --sol 5 --tokens 100000 >/dev/null
# Read into the environment, never printed. Server-only: no NEXT_PUBLIC prefix.
FAUCET_SECRET_KEY="$(cat "$FAUCET_WALLET")"
export FAUCET_SECRET_KEY

export NEXT_PUBLIC_ANCHOR_PROGRAM_ID="$PROGRAM_ID"
export NEXT_PUBLIC_STOCK_MINT="$MINT"
export NEXT_PUBLIC_SOLANA_NETWORK=localnet
export NEXT_PUBLIC_SOLANA_RPC_URL="$RPC"
export SOLANA_RPC_URL="$RPC"
export NEXT_PUBLIC_BASE_URL="http://localhost:3003"
# The key is read into the environment here and never printed.
if [ "${DEV_STACK_TEST_WALLET:-1}" != "0" ]; then
  NEXT_PUBLIC_E2E_WALLET_SECRET="$(cat "$BROWSER_WALLET")"
  export NEXT_PUBLIC_E2E_WALLET_SECRET
else
  # An empty value, not unset, so a stray .env.local cannot register the wallet either.
  export NEXT_PUBLIC_E2E_WALLET_SECRET=""
fi

# The Playwright golden-path spec reads this to find the seeded pool. Public addresses only.
printf '{"pool":"%s","mint":"%s","programId":"%s","wallet":"%s"}\n' "$POOL" "$MINT" "$PROGRAM_ID" "$BROWSER_PUBKEY" >"$LOG/dev-stack.json"

echo "==> READY  pool: $POOL"
echo "    browser wallet: $BROWSER_PUBKEY (1000 demo tokens, 20 SOL)"
echo "    demo faucet: on (POST /api/faucet)"
echo "    app: http://localhost:3003/en/pools"
if [ "$MODE" = "--webpack" ]; then
  pnpm --filter dapp dev
else
  pnpm --filter dapp exec next dev --port 3003
fi
