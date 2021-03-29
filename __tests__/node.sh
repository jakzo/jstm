#!/bin/bash
set -eux

SD=$(dirname "$0")

yarn generate-packages
rm -rf "$SD/../__fixtures__/test-node"
mkdir -p "$SD/../__fixtures__/test-node"
cd "$SD/../__fixtures__/test-node"
git init
../../packages/node/bin/project.js
