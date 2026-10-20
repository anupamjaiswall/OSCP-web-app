#!/usr/bin/env bash
# Install the complete OSCP tmux desktop setup from a checked-out repository.
# Usage: bash install.sh [--no-apt] [--no-plugins] [--check]
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
APT=1
PLUGINS=1
CHECK=0
for arg in "$@"; do
  case "$arg" in
    --no-apt) APT=0;;
    --no-plugins) PLUGINS=0;;
    --check) CHECK=1;;
    -h|--help) echo 'Usage: bash install.sh [--no-apt] [--no-plugins] [--check]'; exit 0;;
    *) echo "Unknown argument: $arg" >&2; exit 2;;
  esac
done

if (( CHECK )); then
  echo "Clipboard environment: DISPLAY=${DISPLAY:-unset} WAYLAND_DISPLAY=${WAYLAND_DISPLAY:-unset} XDG_SESSION_TYPE=${XDG_SESSION_TYPE:-unset}"
  for cmd in tmux xclip wl-copy wl-paste ts; do
    if command -v "$cmd" >/dev/null 2>&1; then echo "OK: $cmd"; else echo "Missing (or optional): $cmd"; fi
  done
  if [[ -x "$HOME/bin/clipboard.sh" ]]; then
    "$HOME/bin/clipboard.sh" check || true
  else
    echo 'Clipboard helper not yet installed.'
  fi
  if command -v tmux >/dev/null 2>&1 && tmux list-sessions >/dev/null 2>&1; then
    echo "tmux prefix: $(tmux show-options -gv prefix)"
    echo "theme status: $(tmux show-options -gv status)"
    tmux list-keys -T copy-mode-vi y || true
    tmux list-keys -T copy-mode-vi MouseDragEnd1Pane || true
    tmux show-environment -g DISPLAY || true
    tmux show-environment -g WAYLAND_DISPLAY || true
  fi
  echo 'Real GUI verification: printf "OSCP-TEST" | ~/bin/clipboard.sh copy; ~/bin/clipboard.sh paste'
  exit 0
fi

[[ -f "$ROOT/scripts/tmux.conf" && -f "$ROOT/scripts/tmux-theme.conf" ]] || {
  echo 'Run install.sh from the full repository (not a standalone raw download).' >&2; exit 1;
}
if [[ "$EUID" == 0 && -n "${SUDO_USER:-}" ]]; then
  echo 'Do not run sudo bash install.sh; it would install into root home. Run bash install.sh.' >&2
  exit 1
fi

if (( APT )) && command -v apt-get >/dev/null 2>&1; then
  echo '[OSCP] Installing tmux + clipboard + logging dependencies...'
  if (( EUID == 0 )); then runner=(); else runner=(sudo); fi
  if ! "${runner[@]}" apt-get install -y tmux xclip wl-clipboard xsel moreutils colorized-logs; then
    echo '[OSCP] Warning: apt dependencies incomplete; finish installation manually before exam.' >&2
  fi
fi

mkdir -p "$HOME/bin" "$HOME/oscp/logs" "$HOME/oscp/logs-clean"
chmod 700 "$HOME/oscp/logs" "$HOME/oscp/logs-clean"
stamp="$(date +%Y%m%d-%H%M%S)"
install_one() {
  local src="$1" dest="$2" mode="$3"
  [[ -f "$src" ]] || { echo "Missing install source $src" >&2; exit 1; }
  if [[ -e "$dest" ]] && cmp -s "$src" "$dest"; then
    chmod "$mode" "$dest"
    echo "unchanged: $dest"
    return
  fi
  if [[ -e "$dest" ]]; then
    cp -p -- "$dest" "$dest.backup-$stamp"
    echo "backup: $dest.backup-$stamp"
  fi
  install -m "$mode" "$src" "$dest"
  echo "installed: $dest"
}

# Put helpers in place before sourcing tmux. Install config LAST.
for name in clipboard.sh tmux-log.sh tmux-start-log.sh clean-logs.sh; do
  install_one "$ROOT/scripts/$name" "$HOME/bin/$name" 700
done
for name in tmux-mouse.conf tmux-splits.conf fix-tmux-prefix.sh; do
  if [[ "$name" == *.sh ]]; then mode=700; else mode=600; fi
  install_one "$ROOT/scripts/$name" "$HOME/bin/$name" "$mode"
done
if [[ -f "$ROOT/scripts/target.sh" ]]; then
  install_one "$ROOT/scripts/target.sh" "$HOME/bin/target.sh" 700
fi
install_one "$ROOT/scripts/tmux-theme.conf" "$HOME/.tmux-theme.conf" 600
install_one "$ROOT/scripts/tmux.conf" "$HOME/.tmux.conf" 600

# Optional tmux-resurrect, installed via TPM, is independent of clipboard copy.
if (( PLUGINS )) && command -v git >/dev/null 2>&1; then
  if [[ ! -f "$HOME/.tmux/plugins/tpm/tpm" ]]; then
    mkdir -p "$HOME/.tmux/plugins"
    git clone --depth 1 https://github.com/tmux-plugins/tpm "$HOME/.tmux/plugins/tpm" ||
      echo '[OSCP] Optional TPM clone failed; clipboard/theme work without TPM.' >&2
  fi
fi

if command -v tmux >/dev/null 2>&1 && tmux list-sessions >/dev/null 2>&1; then
  # Refresh server-side environment used by copy-pipe subprocesses.
  # Never guess :0 or delete good variables on an SSH-only session.
  for key in DISPLAY WAYLAND_DISPLAY XDG_SESSION_TYPE XDG_RUNTIME_DIR XAUTHORITY DBUS_SESSION_BUS_ADDRESS; do
    value="${!key:-}"
    if [[ -n "$value" ]]; then tmux set-environment -g "$key" "$value"; fi
  done
  tmux source-file "$HOME/.tmux.conf"
  echo "[OSCP] Active tmux server refreshed; no sessions were killed."
else
  echo '[OSCP] No active tmux server. New sessions will use the theme and bindings.'
fi

echo '[OSCP] Installation complete. Ctrl+A [ -> v -> y, then GUI Ctrl+V.'
echo '[OSCP] Mouse drag also copies. Ctrl+A ] pastes inside tmux.'
echo '[OSCP] Run bash install.sh --check to inspect clipboard and shortcuts.'
echo '[OSCP] Backups are kept next to existing configs with .backup-TIMESTAMP.'
