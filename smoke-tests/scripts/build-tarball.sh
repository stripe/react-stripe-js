#!/usr/bin/env bash
set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TARBALL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/tarball"
echo "=== Building tarball from $REPO_ROOT ==="
cd "$REPO_ROOT"
npm pack --pack-destination "$TARBALL_DIR"
echo "=== Tarball ready: $(ls "$TARBALL_DIR"/*.tgz) ==="
