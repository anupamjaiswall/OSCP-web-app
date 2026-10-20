#!/usr/bin/env bash
# Timestamped output from a tmux pipe-pane; private OSCP evidence.
set -euo pipefail
name="${1:?log name required}"
[[ "$name" =~ ^[A-Za-z0-9_-]+$ ]] || { echo 'Unsafe log filename' >&2; exit 1; }
d="$HOME/oscp/logs/$(date +%F)"
mkdir -p "$d"
chmod 700 "$HOME/oscp/logs" "$d" 2>/dev/null || true
umask 077
if command -v ts >/dev/null 2>&1; then
  exec ts '[%F %T]' >> "$d/$name.log"
else
  exec cat >> "$d/$name.log"
fi
