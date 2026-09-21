#!/usr/bin/env bash
# Runs the Anchor CLI from ./programs with the Agave and cargo bins on PATH, so
# `pnpm program:*` works from any shell (non-interactive shells skip ~/.bashrc).
set -euo pipefail

export PATH="$HOME/.local/share/solana/install/active_release/bin:$HOME/.cargo/bin:$PATH"
cd "$(dirname "$0")/../programs"
exec anchor "$@"
