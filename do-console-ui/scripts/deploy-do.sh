#!/usr/bin/env bash
# Deploy do-console-ui to DigitalOcean App Platform.
# Requires: repo pushed to GitHub, doctl installed and authenticated (doctl auth init).
#
# Usage:
#   REPO=yourusername/do-console-ui BRANCH=main ./scripts/deploy-do.sh
# Or set REPO and BRANCH in the environment and run:
#   ./scripts/deploy-do.sh

set -e
REPO="${REPO:-}"
BRANCH="${BRANCH:-main}"
SPEC_FILE="${SPEC_FILE:-.do/app-deploy.yaml}"

if [ -z "$REPO" ]; then
  echo "Usage: REPO=owner/repo [BRANCH=main] ./scripts/deploy-do.sh"
  echo "Example: REPO=myuser/do-console-ui BRANCH=main ./scripts/deploy-do.sh"
  exit 1
fi

if ! command -v doctl >/dev/null 2>&1; then
  echo "doctl is not installed. Install: https://docs.digitalocean.com/reference/doctl/how-to/install/"
  exit 1
fi

if ! doctl apps list >/dev/null 2>&1; then
  echo "doctl is not authenticated. Run: doctl auth init"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Build spec with repo and branch
mkdir -p .do
cat .do/app-full.yaml | sed "s|GITHUB_OWNER/GITHUB_REPO|$REPO|g" | sed "s|branch: main|branch: $BRANCH|g" > "$SPEC_FILE"
echo "Deploying from https://github.com/$REPO (branch: $BRANCH)"
doctl apps create --spec "$SPEC_FILE"
echo "App created. Open the DigitalOcean Control Panel > Apps to see the app and add env vars (e.g. OPENAI_API_KEY)."
echo "After the first deploy, use: doctl apps list  and  doctl apps get <app-id>  to get the live URL."
