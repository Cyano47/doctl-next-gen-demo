#!/usr/bin/env bash
# Deploy the doctl next-gen demo to DigitalOcean App Platform as a static site.
# Requires: this prototype pushed to GitHub, and either doctl authenticated
# (doctl auth init) OR the DigitalOcean MCP configured in your agent.
#
# Usage:
#   REPO=youruser/your-repo BRANCH=main ./scripts/deploy-do.sh
#
# The same spec (.do/app-deploy.yaml) can be handed to the DO MCP tool
# apps__apps-create-app-from-spec instead of doctl.

set -e
REPO="${REPO:-}"
BRANCH="${BRANCH:-main}"
SPEC_IN="$(cd "$(dirname "$0")/.." && pwd)/.do/app-static.yaml"
SPEC_OUT="$(cd "$(dirname "$0")/.." && pwd)/.do/app-deploy.yaml"

if [ -z "$REPO" ]; then
  echo "Usage: REPO=owner/repo [BRANCH=main] ./scripts/deploy-do.sh"
  exit 1
fi

sed "s|GITHUB_OWNER/GITHUB_REPO|$REPO|g; s|branch: main|branch: $BRANCH|g" "$SPEC_IN" > "$SPEC_OUT"
echo "Wrote $SPEC_OUT (repo: $REPO, branch: $BRANCH)"

if command -v doctl >/dev/null 2>&1 && doctl apps list >/dev/null 2>&1; then
  echo "Deploying via doctl…"
  doctl apps create --spec "$SPEC_OUT"
  echo "Done. Find the URL with: doctl apps list"
else
  echo "doctl not available/authenticated."
  echo "Deploy via the DO MCP instead: pass the contents of $SPEC_OUT to"
  echo "  apps__apps-create-app-from-spec"
  echo "then poll apps__apps-get-deployment-status for the live URL."
fi
