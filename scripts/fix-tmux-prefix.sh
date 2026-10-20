#!/usr/bin/env bash
# Restore Ctrl+A as tmux prefix even if the loaded config was missing or
# another plugin/config overrode it. Run INSIDE a tmux pane to apply now.
set -euo pipefail
conf="${TMUX_CONFIG:-$HOME/.tmux.conf}"
mkdir -p -- "$(dirname -- "$conf")"
touch -- "$conf"

start='# >>> OSCP Ctrl+A prefix override >>>'
stop='# <<< OSCP Ctrl+A prefix override <<<'
# Managed block is intentionally the LAST config block. No duplicate edits.
if grep -Fq "$start" "$conf"; then
  # Remove only the existing managed block (leave the user's other config alone).
  tmp="$(mktemp)"
  trap 'rm -f -- "$tmp"' EXIT
  awk -v start="$start" -v stop="$stop" '
    $0==start {managed=1;next}
    $0==stop {managed=0;next}
    !managed {print}
  ' "$conf" > "$tmp"
  cat "$tmp" > "$conf"
fi
printf '\n' >> "$conf"
cat >> "$conf" <<'TMUX_PREFIX'
# >>> OSCP Ctrl+A prefix override >>>
# Keep at the END, after TPM and any other config/source lines.
set-option -g prefix C-a
bind-key -T prefix C-a send-prefix
# <<< OSCP Ctrl+A prefix override <<<
TMUX_PREFIX

if ! command -v tmux >/dev/null 2>&1; then
  printf 'tmux is not installed. Config saved: %s\n' "$conf"
  exit 0
fi

if [[ -n "${TMUX:-}" ]]; then
  # Apply directly: this works without needing the (possibly broken) prefix.
  tmux set-option -g prefix C-a
  tmux bind-key -T prefix C-a send-prefix
  printf 'Running server prefix: %s\n' "$(tmux show-options -gv prefix)"
  printf 'Active Ctrl+A binding:\n'
  tmux list-keys -T prefix C-a
else
  printf 'Config saved: %s\n' "$conf"
  printf 'No active tmux pane detected. New tmux sessions will load the override.\n'
  printf 'If a tmux server is already running, run inside one pane or source %s.\n' "$conf"
fi
printf 'Use Ctrl+A, release, then | for side-by-side or - for stacked panes.\n'
