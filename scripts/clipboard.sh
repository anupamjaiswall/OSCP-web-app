#!/usr/bin/env bash
# Clipboard bridge for tmux copy-pipe. No plugin or OSC52 required for local GUI.
set -euo pipefail
provider() {
  if [[ "${XDG_SESSION_TYPE:-}" == wayland && -n "${WAYLAND_DISPLAY:-}" ]] &&
      command -v wl-copy >/dev/null && command -v wl-paste >/dev/null; then
    echo wayland
  elif [[ -n "${DISPLAY:-}" ]] && command -v xclip >/dev/null; then
    echo x11
  elif [[ -n "${WAYLAND_DISPLAY:-}" ]] &&
      command -v wl-copy >/dev/null && command -v wl-paste >/dev/null; then
    echo wayland
  else
    echo none
  fi
}
case "${1:-}" in
  check)
    case "$(provider)" in
      x11) echo 'X11 clipboard: xclip is installed; verify a real copy/paste.';;
      wayland) echo 'Wayland clipboard: wl-copy/wl-paste installed; verify real copy/paste.';;
      none) echo 'No graphical clipboard provider. Internal tmux copy still works.' >&2; exit 1;;
    esac
    ;;
  copy)
    case "$(provider)" in
      x11) exec xclip -selection clipboard -in;;
      wayland) exec wl-copy --type text/plain;;
      none)
        # tmux already saved the selection internally. Drain it if no display.
        cat >/dev/null
        echo 'No graphical clipboard. Check DISPLAY/WAYLAND_DISPLAY.' >&2
        exit 1
        ;;
    esac
    ;;
  paste)
    case "$(provider)" in
      x11) exec xclip -selection clipboard -out;;
      wayland) exec wl-paste --no-newline;;
      none) echo 'No graphical clipboard; use Ctrl+A then ] in tmux.' >&2; exit 1;;
    esac
    ;;
  *) echo "Usage: ${0##*/} copy|paste|check" >&2; exit 2;;
esac
