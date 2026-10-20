#!/usr/bin/env bash
set -euo pipefail
# Usage: target.sh IP [--domain DOMAIN --dc DC_IP --lport PORT]
#        target.sh LABEL --ip IP [--domain DOMAIN --dc DC_IP]
#        ~/bin/target.sh AD_set --domain DOMAIN --dc DC_IP  # coordination only
if [[ $# -lt 1 ]]; then
  echo "Usage: target.sh <IP-or-label> [--ip IPv4] [--domain DNS] [--dc DC] [--lport PORT]" >&2
  exit 2
fi
target="$1"; shift
[[ "$target" =~ ^[A-Za-z0-9][A-Za-z0-9._-]{0,62}$ ]] || { echo 'Invalid target label' >&2; exit 2; }
ip='' domain='' dc='' lport=''
is_ipv4() {
  local a b c d
  [[ "$1" =~ ^[0-9]{1,3}(\.[0-9]{1,3}){3}$ ]] || return 1
  IFS=. read -r a b c d <<< "$1"
  (( 10#$a <= 255 && 10#$b <= 255 && 10#$c <= 255 && 10#$d <= 255 ))
}
if is_ipv4 "$target"; then ip="$target"; fi
while [[ $# -gt 0 ]]; do
  [[ $# -ge 2 ]] || { echo "Missing value for $1" >&2; exit 2; }
  case "$1" in
    --ip) ip="$2"; is_ipv4 "$ip" || { echo 'Invalid --ip (expected IPv4)' >&2; exit 2; };;
    --domain) domain="$2"; [[ "$domain" =~ ^[A-Za-z0-9._-]{1,190}$ ]] || exit 2;;
    --dc) dc="$2"; [[ "$dc" =~ ^[A-Za-z0-9._-]{1,190}$ ]] || exit 2;;
    --lport) lport="$2"; [[ "$lport" =~ ^[0-9]{1,5}$ ]] || exit 2
      (( 10#$lport >= 1 && 10#$lport <= 65535 )) || exit 2;;
    *) echo "Unknown option: $1" >&2; exit 2;;
  esac
  shift 2
done
# Never derive IP from unrelated terminals. A label without --ip has an empty IP.
dir="$HOME/oscp/$target"
session="oscp_$(printf '%s' "$target" | tr '.' '_')"
go() {
  if [[ -n ${TMUX:-} ]]; then
    tmux switch-client -t "=$session"
  else
    tmux attach-session -t "=$session"
  fi
}
if tmux has-session -t "=$session" 2>/dev/null; then
  saved="$(tmux show-environment -t "=$session" TARGET 2>/dev/null || true)"
  [[ "$saved" == "TARGET=$target" ]] || { echo 'Session-name collision: choose a unique label' >&2; exit 1; }
  echo "Reattaching $session (existing target variables are unchanged)."
  go; exit 0
fi
# The session is created with its own environment BEFORE the first shell starts.
# Empty strings deliberately mask any IP/DOMAIN/DC/LPORT in the tmux global env.
lhost="$(ip -4 -o addr show dev tun0 2>/dev/null | awk 'NR==1{split($4,a,"/");print a[1]}' || true)"
mkdir -p "$dir"/{loot,exploits}
tmux new-session -d -s "$session" -n recon -c "$dir" \
  -e "TARGET=$target" -e "IP=$ip" -e "DOMAIN=$domain" -e "DC=$dc" \
  -e "LHOST=$lhost" -e "LPORT=$lport"
for w in shell listener http notes; do tmux new-window -t "$session:" -n "$w" -c "$dir"; done
tmux send-keys -t "$session:notes" 'vim notes.md' Enter
tmux split-window -h -t "$session:recon" -c "$dir"
tmux split-window -v -t "$session:recon.0" -c "$dir"
tmux split-window -v -t "$session:recon.1" -c "$dir"
tmux select-window -t "$session:recon"
printf 'Created %-22s TARGET=%s IP=%s DOMAIN=%s DC=%s LHOST=%s LPORT=%s\n' \
  "$session" "$target" "$ip" "$domain" "$dc" "$lhost" "$lport"
[[ -n "$lhost" ]] || echo 'Warning: tun0 has no IPv4. Verify VPN and refresh LHOST inside panes.'
go
# All new panes/windows inherit session-specific environment variables.
# tmux set-environment changes FUTURE processes, NOT existing shell variables.
