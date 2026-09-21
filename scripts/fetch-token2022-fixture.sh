#!/usr/bin/env bash
# Dumps the Token-2022 program currently deployed on mainnet into the test fixtures
# directory, so program tests run against the same code the real SPYx mint uses.
# LiteSVM's bundled Token-2022 is older and would hide extension differences.
#
# Read-only: uses the public RPC and needs no keypair. Override with SOLANA_RPC_URL.
set -euo pipefail

export PATH="$HOME/.local/share/solana/install/active_release/bin:$HOME/.cargo/bin:$PATH"
RPC="${SOLANA_RPC_URL:-https://api.mainnet-beta.solana.com}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/programs/programs/match_pools/tests/fixtures/token2022_mainnet.so"

mkdir -p "$(dirname "$OUT")"
solana program dump TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb "$OUT" --url "$RPC"
echo "sha256: $(sha256sum "$OUT" | cut -d' ' -f1)"
echo "wrote:  $OUT"
