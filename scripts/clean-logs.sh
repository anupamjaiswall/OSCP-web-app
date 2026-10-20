#!/usr/bin/env bash
# Generate plain text evidence copies; never modify original logs.
set -euo pipefail
src="$HOME/oscp/logs"
dst="$HOME/oscp/logs-clean"
mkdir -p "$src" "$dst"
umask 077
while IFS= read -r -d '' file; do
  rel="${file#"$src"/}"
  mkdir -p "$dst/$(dirname "$rel")"
  if command -v ansi2txt >/dev/null 2>&1; then
    ansi2txt < "$file" > "$dst/$rel"
  else
    sed -E 's/\x1B\[[0-9;]*[[:alpha:]]//g' < "$file" > "$dst/$rel"
  fi
done < <(find "$src" -type f -name '*.log' -print0)
echo "Clean logs: $dst"
