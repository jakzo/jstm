#!/bin/bash
set -eux

git add -A
git commit -m "$1"
git pull
echo "---
\"@jstm/core\": patch
---

$1
" > generated-changeset.md
git push
