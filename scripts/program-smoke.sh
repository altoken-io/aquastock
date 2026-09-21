#!/usr/bin/env bash
# Builds the program, boots a local validator, runs the end-to-end smoke test against it,
# and shuts the validator down. Needs no keys of yours.
set -euo pipefail

export PATH="$HOME/.local/share/solana/install/active_release/bin:$HOME/.cargo/bin:$PATH"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WALLET="$ROOT/programs/keys/localnet-wallet.json"
LOG="$ROOT/programs/target/localnet.log"
RPC="http://127.0.0.1:8899"

bash "$ROOT/scripts/anchor.sh" build --arch v0 --ignore-keys >/dev/null
mkdir -p "$(dirname "$LOG")"
bash "$ROOT/scripts/localnet.sh" >"$LOG" 2>&1 &
VALIDATOR=$!
trap 'kill "$VALIDATOR" 2>/dev/null || true; wait "$VALIDATOR" 2>/dev/null || true' EXIT

for _ in $(seq 1 90); do
  solana cluster-version --url "$RPC" >/dev/null 2>&1 && break
  kill -0 "$VALIDATOR" 2>/dev/null || { echo "validator exited; see $LOG"; tail -20 "$LOG"; exit 1; }
  sleep 1
done
solana airdrop 100 "$(solana-keygen pubkey "$WALLET")" --url "$RPC" >/dev/null

PROGRAM_ID="$(grep -oP 'declare_id!\("\K[^"]+' "$ROOT/programs/programs/match_pools/src/lib.rs")"
cd "$ROOT"
pnpm exec tsx scripts/solana/smoke.ts --rpc "$RPC" --wallet "$WALLET" --program "$PROGRAM_ID"
