#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$ROOT/dist"
rm -f "$ROOT/dist/bookxnote-zotero-opener.xpi"
(
  cd "$ROOT/plugin"
  zip -r "$ROOT/dist/bookxnote-zotero-opener.xpi" . \
    -x '*.DS_Store' '__MACOSX/*'
)
echo "Built: $ROOT/dist/bookxnote-zotero-opener.xpi"
