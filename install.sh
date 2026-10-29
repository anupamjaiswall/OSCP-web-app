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
  echo "tmux socket directory for new servers: ${TMUX_TMPDIR:-/tmp}"
  echo "tmux recovery directory: $HOME/.local/share/tmux/resurrect"
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
    echo "OSC52 set-clipboard: $(tmux show-options -sv set-clipboard)"
    tmux list-keys -T copy-mode-vi y || true
    tmux list-keys -T copy-mode-vi MouseDragEnd1Pane || true
    tmux show-environment -g DISPLAY || true
    tmux show-environment -g WAYLAND_DISPLAY || true
  fi
  echo '[OSCP] --check runs a real clipboard roundtrip (restores the previous clipboard).'
  echo '[OSCP] SSH/VM host clipboard also requires OSC52 terminal support or VM clipboard integration.'
  exit 0
fi

[[ -f "$ROOT/scripts/tmux.conf" && -f "$ROOT/scripts/tmux-theme.conf" && -f "$ROOT/scripts/clipboard.sh" ]] || {
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
elif (( APT )) && command -v pkg >/dev/null 2>&1; then
  echo '[OSCP] Termux detected: installing tmux and termux-api command tools...'
  pkg install -y tmux termux-api || echo '[OSCP] Warning: install Termux:API Android companion app to access the Android clipboard.' >&2
fi

mkdir -p "$HOME/bin" "$HOME/oscp/logs" "$HOME/oscp/logs-clean"
chmod 700 "$HOME/oscp/logs" "$HOME/oscp/logs-clean"
stamp="$(date +%Y%m%d-%H%M%S)"

# Keep new tmux server sockets and recovery snapshots out of /tmp.
# TMUX_TMPDIR affects only servers started after this environment is set.
persist_socket_dir="$HOME/.local/state/tmux"
persist_recovery_dir="$HOME/.local/share/tmux/resurrect"
mkdir -p "$persist_socket_dir" "$persist_recovery_dir"
chmod 700 "$persist_socket_dir" "$HOME/.local/share/tmux" "$persist_recovery_dir"
case "$(basename "${SHELL:-/bin/bash}")" in
  zsh) shell_rc="$HOME/.zshrc" ;;
  *)   shell_rc="$HOME/.bashrc" ;;
esac
touch "$shell_rc"
if ! grep -Fqx 'export TMUX_TMPDIR="$HOME/.local/state/tmux"' "$shell_rc"; then
  cp -p "$shell_rc" "$shell_rc.backup-$stamp"
  printf '\n# OSCP: persistent tmux socket directory for new servers\nexport TMUX_TMPDIR="$HOME/.local/state/tmux"\n' >> "$shell_rc"
  echo "configured persistent TMUX_TMPDIR in $shell_rc"
fi
export TMUX_TMPDIR="$persist_socket_dir"
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

# When install.sh runs *inside* tmux, the pane can have stale or missing
# display variables, while its attached GUI client still has the correct ones.
# Read only the six trusted clipboard-related keys from our own client process.
recover_attached_gui_env() {
  [[ -z "${SSH_CONNECTION:-}" ]] || return 0
  command -v tmux >/dev/null 2>&1 || return 0
  [[ -n "${TMUX:-}" ]] || return 0
  local pid entry key value
  pid="$(tmux display-message -p -F '#{client_pid}' 2>/dev/null || true)"
  [[ "$pid" =~ ^[0-9]+$ && -r "/proc/$pid/environ" ]] || return 0
  while IFS= read -r -d '' entry; do
    key="${entry%%=*}"
    value="${entry#*=}"
    case "$key" in
      DISPLAY|WAYLAND_DISPLAY|XDG_SESSION_TYPE|XDG_RUNTIME_DIR|XAUTHORITY|DBUS_SESSION_BUS_ADDRESS)
        [[ -n "$value" ]] && export "$key=$value"
        ;;
    esac
  done < "/proc/$pid/environ"
  return 0
}
recover_attached_gui_env

if command -v tmux >/dev/null 2>&1 && tmux list-sessions >/dev/null 2>&1; then
  # Refresh server-side environment used by copy-pipe subprocesses.
  # Never guess :0 or delete good variables on an SSH-only session.
  for key in DISPLAY WAYLAND_DISPLAY XDG_SESSION_TYPE XDG_RUNTIME_DIR XAUTHORITY DBUS_SESSION_BUS_ADDRESS; do
    value="${!key:-}"
    if [[ -n "$value" ]]; then tmux set-environment -g "$key" "$value"; fi
  done
  tmux source-file "$HOME/.tmux.conf"
  # Set critical bindings and OSC52 immediately even in older client sessions.
  tmux set-option -g prefix C-a
  tmux bind-key -T prefix C-a send-prefix
  tmux set-option -s set-clipboard on
  echo "[OSCP] Active tmux server refreshed; no sessions were killed."
else
  echo '[OSCP] No active tmux server. New sessions will use the theme and bindings.'
fi

echo '[OSCP] Testing desktop clipboard copy/paste (previous clipboard will be restored)...'
if ! "$HOME/bin/clipboard.sh" check; then
  echo '[OSCP] Clipboard unavailable in this shell: tmux OSC52 can reach a compatible terminal, but an SSH client or VM host may require external clipboard sharing.' >&2
fi

echo '[OSCP] Installation complete. Ctrl+A [ -> v -> y, then GUI Ctrl+V.'
echo '[OSCP] Mouse drag also copies. Ctrl+A ] pastes inside tmux; Ctrl+Shift+V pastes into graphical terminals.'
echo '[OSCP] Run bash install.sh --check to inspect clipboard and shortcuts.'
echo '[OSCP] Backups are kept next to existing configs with .backup-TIMESTAMP.'
