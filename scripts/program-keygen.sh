#!/usr/bin/env bash
# Creates the program keypair for one network at programs/keys/<network>.json (gitignored).
# It fixes the program's address. The secret is never printed, and an existing file is
# never overwritten. Back the file up: it is the only way to deploy to this address again.
#
#   pnpm program:keygen devnet
#   pnpm program:keygen mainnet
set -euo pipefail

export PATH="$HOME/.local/share/solana/install/active_release/bin:$HOME/.cargo/bin:$PATH"
NETWORK="${1:-}"
case "$NETWORK" in
  devnet | mainnet) ;;
  *) echo "usage: program-keygen.sh <devnet|mainnet>" >&2; exit 1 ;;
esac

FILE="$(cd "$(dirname "$0")/.." && pwd)/programs/keys/$NETWORK.json"
if [ -e "$FILE" ]; then
  echo "$FILE already exists; leaving it alone."
else
  mkdir -p "$(dirname "$FILE")"
  solana-keygen new --no-bip39-passphrase --silent --outfile "$FILE"
  chmod 600 "$FILE"
  echo "created $FILE"
fi
echo "$NETWORK program id: $(solana-keygen pubkey "$FILE")"
