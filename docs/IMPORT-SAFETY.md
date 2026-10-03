# Import Safety

Session, encrypted-session and target-only imports use one transactional owner in `src/js/26-v35-import-safety.js`.

The restore sequence is:

1. Parse and validate the candidate.
2. Reject unsupported future schemas, duplicate/missing IDs and imports that do not fit the conservative storage headroom budget.
3. Repair recoverable metadata such as an orphaned `activeTargetId` to the first imported target.
4. Require a secret-free pre-restore recovery snapshot before mutation.
5. Capture the current in-memory session and app-owned localStorage namespace.
6. Apply the candidate.
7. Read persisted critical keys back and compare them with the restored session.
8. Validate the restored session.
9. If apply, persistence or validation fails, automatically restore the previous in-memory session and app-owned storage namespace.

## Session-only secrets

Automatic rollback can preserve session-only secrets because it holds an in-memory copy during the transaction. The durable pre-restore recovery snapshot is deliberately secret-free.

If the tab/browser crashes or the computer loses power during the restore itself, that in-memory copy disappears. Session-only passwords, hashes, tickets or keys may therefore be unrecoverable from the secret-free safety snapshot. If those secrets matter, create an **encrypted backup** before performing a restore.

## Compatibility

CI keeps representative session fixtures for schemas 1, 9, 16 and 19 and restores each through the current app. Newer-than-supported schema versions are rejected rather than guessed.
