#!/bin/bash
set -eux

echo "Commit and changelog: $1"
yarn test:all
git add -A
git commit -m "$1"
git pull
RAND=$(cat /dev/urandom | tr -dc 'a-z' | fold -w 8 | head -n 1)
echo "---
\"@jstm/core\": patch
---

$1
" > ".changeset/generated-changeset-$RAND.md"
git add -A
git commit -n -m "added changelog: $1"
git push
