#!/bin/sh
# Builds the app and publishes dist/ to the gh-pages branch (GitHub Pages source).
set -e
cd "$(dirname "$0")/.."
npm test
npm run build
touch dist/.nojekyll
REMOTE=$(git remote get-url origin)
cd dist
rm -rf .git
git init -q -b gh-pages
git add -A
git commit -q -m "Deploy $(date '+%Y-%m-%d %H:%M')"
git push -f "$REMOTE" gh-pages
rm -rf .git
echo "Deployed."
