# Import / Restore Safety

The exam app treats restore operations as state replacement, not a best-effort merge.

## V34.50 guarantees

- Normal session, encrypted session and target-only imports validate before mutation.
- A secret-free recovery snapshot must be created before imported state is applied.
- If apply or post-restore validation throws, the previous in-memory session is restored automatically.
- The pre-restore recovery snapshot is retained even after automatic rollback.
- Future backup schemas above the currently supported ceiling are rejected instead of guessed.
- Malformed, truncated, oversized and wrongly typed JSON are covered by regression tests.

Automatic rollback is an additional guard, not a replacement for a downloaded external backup. Browser storage failure can still prevent persistence, so keep a recent external backup outside the browser profile.
