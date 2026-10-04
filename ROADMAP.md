# Roadmap

The app is now in **exam freeze**. Its job is to help during OSCP practice and the real exam, not to become a general software project.

## Exam freeze — V34.55+

- **No new features, architecture migrations or proactive hardening before the exam.** Make a runtime change only for a reproducible problem encountered during real OSCP-style practice, or for a material current OffSec rule/content change.
- **Keep the legacy core ratchet downward-only.** `03-core-app.js` remains capped at 332,081 bytes; do not extract code merely to create room for hypothetical features.
- **Keep the current single-file/offline-first build until after the exam.** Do not redesign packaging while the frozen build is being validated in real practice.
- **Use this exact build during every practice machine.** Fix concrete exam friction: state loss, broken navigation, incorrect methodology, or information that cannot be found quickly enough under pressure.
- **Prefer behavioral evidence over coverage work.** Add a regression only when it protects a real failure mode; do not expand tests simply to increase test count.

## After OSCP

- Re-evaluate the single-file packaging decision based on actual exam/practice experience.
- Continue legacy-core and DOM-sink reduction only if the application will remain an actively maintained project.
- Rename historical versioned modules by responsibility if ongoing maintenance justifies the churn.
- Keep schema fixtures for prior supported session versions if backup compatibility remains useful.

## Non-goal

- **Mock/rehearsal mode is intentionally not part of the product.** The UI remains exam-only. End-to-end create/export/wipe/restore behavior belongs in CI lifecycle dry-runs instead.
