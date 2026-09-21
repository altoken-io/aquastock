#!/usr/bin/env bash
# Builds the program as SBPF v0, then runs its unit, property and LiteSVM tests.
#
# `anchor test` is deliberately not used: Anchor 1.2 builds SBPF v3 by default, which
# LiteSVM rejects and which mainnet may not accept yet. v0 loads everywhere today.
set -euo pipefail

export PATH="$HOME/.local/share/solana/install/active_release/bin:$HOME/.cargo/bin:$PATH"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FIXTURE="$ROOT/programs/programs/match_pools/tests/fixtures/token2022_mainnet.so"

[ -f "$FIXTURE" ] || bash "$ROOT/scripts/fetch-token2022-fixture.sh"
cd "$ROOT/programs"
anchor build --arch v0 --ignore-keys
cargo test "$@"
