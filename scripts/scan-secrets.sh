#!/usr/bin/env bash
#
# Secret scan over the full git history with gitleaks (.gitleaks.toml).
#
# One code path for both CI (.github/workflows/check.yml "secrets" job) and
# local use (`pnpm secrets:scan`), pinned to a specific gitleaks release. Uses
# the official image rather than gitleaks-action, which needs a license key
# for organisation repos. Findings are printed redacted — never the value.
#
# The GIT_CONFIG_* variables mark the mounted checkout as safe for git inside
# the container, whose uid differs from the checkout's owner on CI runners.

set -euo pipefail

GITLEAKS_VERSION="${GITLEAKS_VERSION:-v8.24.3}"
REPO_ROOT="$(git rev-parse --show-toplevel)"

exec docker run --rm \
  -v "${REPO_ROOT}:/repo:ro" \
  -e GIT_CONFIG_COUNT=1 \
  -e GIT_CONFIG_KEY_0=safe.directory \
  -e GIT_CONFIG_VALUE_0='*' \
  "ghcr.io/gitleaks/gitleaks:${GITLEAKS_VERSION}" \
  git --no-banner --redact --exit-code 1 --config /repo/.gitleaks.toml /repo
