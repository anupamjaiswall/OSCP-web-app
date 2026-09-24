# Known Limitations

This app is designed as a fast offline exam companion, not an authoritative exam system.

- **OffSec is authoritative.** Current exam instructions, the Exam Control Panel, and the proctor override anything cached in this repository.
- **Use a modern Chromium-class browser you tested beforehand.** Deep reference hydration uses the browser's native `DecompressionStream` API to unpack the embedded gzip payload after load.
- **Browser storage is origin/profile-specific.** State saved under GitHub Pages, localhost, and a directly opened local file are separate stores. Moving to another browser profile or VM does not carry state automatically.
- **Autosnapshots are not disaster backups.** They protect against many in-app mistakes but live in browser storage. Keep a downloaded secret-free or encrypted full-session backup outside the browser profile.
- **Clipboard recovery is temporary.** “Copy recovery JSON” uses a secret-free payload but does not count as a durable external backup until you paste/save it somewhere reliable.
- **Secret-free exports cannot identify arbitrary secrets typed into free-form notes.** Dedicated secret fields are excluded/redacted, but review free-text before sharing it.
- **Encrypted backups depend on Web Crypto and your passphrase.** Losing the passphrase makes that backup unrecoverable.
- **Tool syntax can drift.** Installed `-h/--help` and `--version` output on your Kali environment remain the final syntax authority.
- **The app does not validate submitted proof values.** The Exam Control Panel remains authoritative for submission; independently compare proof values character-for-character before moving on.
- **The embedded methodology is intentionally broad, not magical.** It cannot know the unique path for a target; use observations, prerequisites, and evidence to choose the next test.
- **No network dependency is required for the exam artifact.** The single `index.html` contains its CSS, JavaScript, and compressed reference content, but you should still keep a second local copy.
