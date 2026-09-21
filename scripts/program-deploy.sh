#!/usr/bin/env bash
# Builds the program as SBPF v0 for one network and deploys it with YOUR wallet, which
# becomes the upgrade authority. Never run by an agent: it spends real SOL on mainnet.
#
#   pnpm program:keygen devnet      # once, fixes the program id
#   pnpm program:deploy devnet
#   SOLANA_RPC_URL=<mainnet rpc> pnpm program:deploy mainnet
#
# Wallet: $ANCHOR_WALLET, default ~/.config/solana/id.json. RPC: $SOLANA_RPC_URL (devnet
# defaults to the public endpoint; mainnet requires you to set one).
set -euo pipefail

export PATH="$HOME/.local/share/solana/install/active_release/bin:$HOME/.cargo/bin:$PATH"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NETWORK="${1:-}"
ASSUME_YES="${2:-}"

case "$NETWORK" in
  devnet) URL="${SOLANA_RPC_URL:-https://api.devnet.solana.com}" ;;
  mainnet) URL="${SOLANA_RPC_URL:?set SOLANA_RPC_URL to your mainnet RPC endpoint}" ;;
  *) echo "usage: program-deploy.sh <devnet|mainnet> [--yes]" >&2; exit 1 ;;
esac

KEYPAIR="$ROOT/programs/keys/$NETWORK.json"
WALLET="${ANCHOR_WALLET:-$HOME/.config/solana/id.json}"
LIB="$ROOT/programs/programs/match_pools/src/lib.rs"
[ -f "$KEYPAIR" ] || { echo "missing $KEYPAIR: run 'pnpm program:keygen $NETWORK' first" >&2; exit 1; }
[ -f "$WALLET" ] || { echo "missing wallet $WALLET: set ANCHOR_WALLET or create one" >&2; exit 1; }

PROGRAM_ID="$(solana-keygen pubkey "$KEYPAIR")"
DEPLOYER="$(solana-keygen pubkey "$WALLET")"
BALANCE="$(solana balance "$DEPLOYER" --url "$URL" 2>&1 || true)"

echo "network:            $NETWORK"
echo "rpc:                $URL"
echo "program id:         $PROGRAM_ID"
echo "deployer / upgrade authority: $DEPLOYER ($BALANCE)"
echo "The deployer keeps the power to replace this program. Disclose it; do not hide it."

if [ "$NETWORK" = "mainnet" ] && [ "$ASSUME_YES" != "--yes" ]; then
  printf 'Type "deploy mainnet" to spend real SOL and continue: '
  read -r answer
  [ "$answer" = "deploy mainnet" ] || { echo "aborted"; exit 1; }
fi

# The compiled program id must equal the deployed one, or every call fails with
# DeclaredProgramIdMismatch.
sed -i "s|declare_id!(\"[^\"]*\")|declare_id!(\"$PROGRAM_ID\")|" "$LIB"
mkdir -p "$ROOT/programs/target/deploy"
cp "$KEYPAIR" "$ROOT/programs/target/deploy/match_pools-keypair.json"

cd "$ROOT/programs"
anchor build --arch v0
anchor deploy -p match_pools --no-idl \
  --program-keypair "$KEYPAIR" \
  --provider.cluster "$URL" \
  --provider.wallet "$WALLET"

# The checked-in IDL carries the program address, so refresh it.
cd "$ROOT"
bash scripts/program-idl.sh >/dev/null

cat <<NEXT

Deployed $PROGRAM_ID to $NETWORK.
Next:
  1. Set NEXT_PUBLIC_ANCHOR_PROGRAM_ID=$PROGRAM_ID (Vercel and apps/dapp/.env.local).
  2. Create the mint (devnet only) and allow-list it, signed by the same wallet:
       pnpm solana:replica-mint  --rpc $URL --wallet $WALLET
       pnpm solana:init-config   --rpc $URL --wallet $WALLET --program $PROGRAM_ID --mint <mint>
     On mainnet pass the real SPYx mint (XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W) to init-config.
  3. Set NEXT_PUBLIC_STOCK_MINT to that mint.
NEXT
