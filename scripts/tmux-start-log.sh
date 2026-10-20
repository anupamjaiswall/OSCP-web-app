#!/usr/bin/env bash
# Activate exactly one logging pipe on a valid pane.
set -euo pipefail
pane="${1:?pane required}"
[[ "$pane" =~ ^%[0-9]+$ ]] || exit 1
session="$(tmux display-message -p -t "$pane" -F '#{session_name}')"
window="$(tmux display-message -p -t "$pane" -F '#{window_index}')"
number="$(tmux display-message -p -t "$pane" -F '#{pane_index}')"
session="${session//[^a-zA-Z0-9_-]/_}"
name="${session}_w${window}_p${number}_id${pane#%}_$(date +%H%M%S)"
tmux pipe-pane -o -t "$pane" "\"$HOME/bin/tmux-log.sh\" '$name'"
