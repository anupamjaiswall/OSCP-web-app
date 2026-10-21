#!/usr/bin/env bash
# Headless runtime check: tmux must parse the actual installed config + colors.
# Also tests clipboard helper dispatch with a fake X11 clipboard, not the user's GUI.
set -euo pipefail
root="$(cd -- "$(dirname -- "$0")/.." && pwd)"
command -v tmux >/dev/null || { echo 'tmux not installed; cannot run runtime test' >&2; exit 1; }
tmp="$(mktemp -d)"
sock="oscp-ci-$$"
cleanup() { HOME="$tmp" tmux -L "$sock" kill-server >/dev/null 2>&1 || true; rm -rf -- "$tmp"; }
trap cleanup EXIT
mkdir -p "$tmp/bin" "$tmp/oscp/logs" "$tmp/fakebin"
for name in clipboard.sh tmux-mouse.conf tmux-start-log.sh tmux-log.sh; do
  cp "$root/scripts/$name" "$tmp/bin/$name"
done
chmod +x "$tmp/bin/"*.sh
cp "$root/scripts/tmux.conf" "$tmp/.tmux.conf"
cp "$root/scripts/tmux-theme.conf" "$tmp/.tmux-theme.conf"
export HOME="$tmp"
export TERM=xterm-256color
tmux -L "$sock" -f "$tmp/.tmux.conf" new-session -d -s oscp_test
[[ "$(tmux -L "$sock" show-options -gv prefix)" == "C-a" ]]
[[ "$(tmux -L "$sock" show-options -sv set-clipboard)" == "on" ]]  # terminal OSC52 fallback enabled
tmux -L "$sock" show-options -gv status-left | grep -q 'OSCP'
tmux -L "$sock" show-options -gv pane-active-border-style | grep -q 'colour37'
tmux -L "$sock" list-keys -T copy-mode-vi y | grep -q 'copy-pipe-and-cancel'
tmux -L "$sock" list-keys -T copy-mode-vi Y | grep -q 'copy-pipe-and-cancel'
tmux -L "$sock" list-keys -T copy-mode-vi MouseDragEnd1Pane | grep -q 'copy-pipe-and-cancel'
tmux -L "$sock" list-keys -T prefix '|' | grep -q 'split-window -h'
tmux -L "$sock" list-keys -T prefix '-' | grep -q 'split-window -v'
tmux -L "$sock" source-file "$tmp/.tmux.conf"

# Fake clipboard executable: prove the selection reaches CLIPBOARD and can be read.
cat > "$tmp/fakebin/xclip" <<'XCLIP'
#!/usr/bin/env bash
set -euo pipefail
if [[ " $* " == *" -out "* ]]; then
  cat "$OSCP_TEST_CLIP"
else
  cat > "$OSCP_TEST_CLIP"
fi
XCLIP
chmod +x "$tmp/fakebin/xclip"
export PATH="$tmp/fakebin:$PATH"
export OSCP_TEST_CLIP="$tmp/clipboard.txt"
export DISPLAY=:88
export XDG_SESSION_TYPE=x11
unset WAYLAND_DISPLAY
printf 'OSCP-CLIPBOARD-ROUNDTRIP' | "$tmp/bin/clipboard.sh" copy
[[ "$("$tmp/bin/clipboard.sh" paste)" == 'OSCP-CLIPBOARD-ROUNDTRIP' ]]
echo 'PASS: tmux config/theme/keys parse, and desktop clipboard helper X11 dispatch works.'
