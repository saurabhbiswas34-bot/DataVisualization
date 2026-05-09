#!/usr/bin/env bash
set -euo pipefail
UPSTREAM="${1:?Usage: $0 <git-url>}"
DEST="$(cd "$(dirname "$0")" && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
git clone --depth 1 "$UPSTREAM" "$TMP"
shopt -s dotglob nullglob
for p in "$TMP"/*; do
  base="$(basename "$p")"
  [[ "$base" == ".git" ]] && continue
  rm -rf "$DEST/$base"
  mv "$p" "$DEST/"
done
echo "Synced from $UPSTREAM into $DEST"
