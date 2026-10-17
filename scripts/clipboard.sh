#!/usr/bin/env bash
# OSCP tmux desktop clipboard bridge (X11 / Wayland).
# Install to ~/bin/clipboard.sh before the exam, then chmod 700 it.
# Usage: clipboard.sh copy|paste|check
set -euo pipefail

provider() {
  if [[ -n "${WAYLAND_DISPLAY:-}" ]] && command -v wl-copy >/dev/null 2>&1 && command -v wl-paste >/dev/null 2>&1; then
    printf '%s\n' wayland
  elif [[ -n "${DISPLAY:-}" ]] && command -v xclip >/dev/null 2>&1; then
    printf '%s\n' x11
  else
    printf '%s\n' none
  fi
}

case "${1:-}" in
  check)
    case "$(provider)" in
      wayland) printf 'Wayland clipboard: wl-copy / wl-paste (display access still needs testing)\n';;
      x11) printf 'X11 clipboard: xclip (display access still needs testing)\n';;
      none) printf 'No desktop clipboard available. Use tmux copy-mode y, then prefix + ].\n' >&2; exit 1;;
    esac
    ;;
  copy)
    case "$(provider)" in
      wayland) exec wl-copy --type text/plain;;
      x11) exec xclip -selection clipboard -in >/dev/null 2>&1;;
      none)
        # Drain piped tmux selection instead of leaving the pipe blocked.
        cat >/dev/null
        printf 'No clipboard display. Check DISPLAY/WAYLAND_DISPLAY and install wl-clipboard or xclip.\n' >&2
        exit 1
        ;;
    esac
    ;;
  paste)
    case "$(provider)" in
      wayland) exec wl-paste --no-newline;;
      x11) exec xclip -selection clipboard -out;;
      none) printf 'No desktop clipboard available; use tmux prefix + ] instead.\n' >&2; exit 1;;
    esac
    ;;
  *) printf 'Usage: %s copy|paste|check\n' "${0##*/}" >&2; exit 2;;
esac
