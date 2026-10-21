#!/usr/bin/env bash
# OSCP clipboard bridge. For tmux copy-pipe; no secret clipboard data is logged.
# Supports Kali X11/XWayland, Wayland and Android Termux (with Termux:API).
set -euo pipefail

# A command substitution drops terminal newlines. Appending a marker first
# preserves them (text selection cannot contain a NUL byte in Bash variables).
read_stdin() {
  local value
  value="$(cat && printf '\036')" || return 1
  CLIP_TEXT="\${value%$'\036'}"
}
CLIP_TEXT=''
READ_TEXT=''

# Try Wayland first when present, then X11 (important for XWayland fallbacks).
routes() {
  if command -v termux-clipboard-set >/dev/null 2>&1 &&
     command -v termux-clipboard-get >/dev/null 2>&1 &&
     [[ "\${PREFIX:-}" == *com.termux* || -n "\${TERMUX_VERSION:-}" ]]; then
    printf '%s\n' termux
  fi
  if [[ -n "\${WAYLAND_DISPLAY:-}" ]]; then
    if command -v wl-copy >/dev/null 2>&1 && command -v wl-paste >/dev/null 2>&1; then
      printf '%s\n' wayland
    fi
  fi
  if [[ -n "\${DISPLAY:-}" ]]; then
    if command -v xclip >/dev/null 2>&1; then printf '%s\n' xclip; fi
    if command -v xsel >/dev/null 2>&1; then printf '%s\n' xsel; fi
  fi
}

write_route() {
  case "$1" in
    termux) termux-clipboard-set ;;
    wayland) wl-copy --type text/plain ;;
    xclip) xclip -selection clipboard -in >/dev/null ;;
    xsel) xsel --clipboard --input >/dev/null ;;
    *) return 1 ;;
  esac
}
read_route() {
  case "$1" in
    termux) termux-clipboard-get ;;
    wayland) wl-paste --no-newline ;;
    xclip) xclip -selection clipboard -out ;;
    xsel) xsel --clipboard --output ;;
    *) return 1 ;;
  esac
}
read_into() {
  local value
  value="$(read_route "$1" && printf '\036')" || return 1
  READ_TEXT="\${value%$'\036'}"
}
# Never echo copied content in logs. Try the next provider if the first one
# exists but its graphical socket is stale or permission-denied.
copy() {
  local r
  read_stdin
  while IFS= read -r r; do
    [[ -n "$r" ]] || continue
    if printf '%s' "$CLIP_TEXT" | write_route "$r" 2>/dev/null; then
      return 0
    fi
  done < <(routes)
  printf '%s\n' '[OSCP] Local clipboard unavailable. tmux buffer is retained; OSC52 may still work in a compatible terminal.' >&2
  return 1
}
paste() {
  local r
  while IFS= read -r r; do
    [[ -n "$r" ]] || continue
    if read_route "$r" 2>/dev/null; then return 0; fi
  done < <(routes)
  printf '%s\n' '[OSCP] Cannot read local system clipboard. Check DISPLAY/WAYLAND_DISPLAY, XAUTHORITY, Termux:API or your SSH terminal.' >&2
  return 1
}

# Perform an ACTUAL roundtrip, then immediately restore the pre-test clipboard.
# A provider that merely has an installed executable is not counted as working.
check() {
  local r old probe got restored=0 attempted=0
  printf '[OSCP] Clipboard: DISPLAY=%s WAYLAND_DISPLAY=%s XDG_SESSION_TYPE=%s SSH=%s\n' \
    "\${DISPLAY:-unset}" "\${WAYLAND_DISPLAY:-unset}" "\${XDG_SESSION_TYPE:-unset}" \
    "\${SSH_CONNECTION:+yes}"
  while IFS= read -r r; do
    [[ -n "$r" ]] || continue
    attempted=1
    if ! read_into "$r" 2>/dev/null; then
      echo "[OSCP] $r is present, but cannot read the clipboard/session." >&2
      continue
    fi
    old="$READ_TEXT"
    probe="OSCP-clipboard-test-$$-\$(date +%s)"
    if ! printf '%s' "$probe" | write_route "$r" 2>/dev/null; then
      echo "[OSCP] $r cannot write the desktop clipboard." >&2
      continue
    fi
    got=''
    if read_into "$r" 2>/dev/null; then got="$READ_TEXT"; fi
    # Restore before printing results, even on an unsuccessful verification.
    if printf '%s' "$old" | write_route "$r" 2>/dev/null; then restored=1; fi
    if [[ "$got" == "$probe" ]]; then
      echo "[OSCP] PASS: $r desktop clipboard roundtrip; original clipboard restored=$restored."
      return 0
    fi
    echo "[OSCP] FAIL: $r wrote but clipboard readback mismatched." >&2
  done < <(routes)
  if (( attempted == 0 )); then
    echo '[OSCP] No local clipboard provider in this session.' >&2
  fi
  echo '[OSCP] tmux buffer still works. For remote/VM host clipboard, use a terminal with OSC52 support or enable VM clipboard sharing.' >&2
  return 1
}
case "\${1:-}" in
  copy) copy ;;
  paste) paste ;;
  check|test) check ;;
  *) echo "Usage: \${0##*/} copy|paste|check" >&2; exit 2 ;;
esac
