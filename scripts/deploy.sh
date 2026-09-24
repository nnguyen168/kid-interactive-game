#!/usr/bin/env bash
# Deploys this app to Vercel.
#
# First time only: the Vercel CLI will prompt you to log in and link this
# folder to a Vercel project. After that it remembers the link (in a local,
# git-ignored .vercel folder) and future runs deploy straight to production.
#
# Usage: ./scripts/deploy.sh

set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Installing dependencies"
npm install

echo "==> Building locally to catch errors before deploying"
npm run build

echo "==> Deploying to Vercel (production)"
npx vercel --prod
