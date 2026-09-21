#!/usr/bin/env bash
# Starts a local validator with the program and the mainnet Token-2022 build loaded,
# for the smoke test, the dApp in development, and the Playwright golden path.
#
# The wallet is a throwaway LOCAL-ONLY key at programs/keys/localnet-wallet.json (gitignored).
# It holds fake SOL on a validator that dies with this process, and is the program's
# upgrade authority here. It is not your real wallet and is never printed.
set -euo pipefail

export PATH="$HOME/.local/share/solana/install/active_release/bin:$HOME/.cargo/bin:$PATH"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEYS="$ROOT/programs/keys"
WALLET="$KEYS/localnet-wallet.json"
SO="$ROOT/programs/target/deploy/match_pools.so"
TOKEN_2022="$ROOT/programs/programs/match_pools/tests/fixtures/token2022_mainnet.so"

mkdir -p "$KEYS"
[ -f "$WALLET" ] || solana-keygen new --no-bip39-passphrase --silent --outfile "$WALLET"
[ -f "$TOKEN_2022" ] || bash "$ROOT/scripts/fetch-token2022-fixture.sh"
[ -f "$SO" ] || bash "$ROOT/scripts/anchor.sh" build --arch v0 --ignore-keys

PROGRAM_ID="$(grep -oP 'declare_id!\("\K[^"]+' "$ROOT/programs/programs/match_pools/src/lib.rs")"
echo "program id:   $PROGRAM_ID"
echo "local wallet: $(solana-keygen pubkey "$WALLET")"

exec solana-test-validator --reset --quiet \
  --ledger "$ROOT/programs/target/localnet-ledger" \
  --bpf-program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb "$TOKEN_2022" \
  --upgradeable-program "$PROGRAM_ID" "$SO" "$(solana-keygen pubkey "$WALLET")"
