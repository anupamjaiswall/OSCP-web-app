from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

marker = 'id="v21RevertGuard"'
if marker in s:
    raise SystemExit('V21 revert guard already present')

anchor = '<div class="card span6"><h2>Before exploit or target change</h2>'
if anchor not in s:
    raise SystemExit('insertion anchor missing')

strip = '''<div class="card span12" id="v21RevertGuard" style="padding:12px 16px;border-color:#7a6030">
  <div class="row" style="justify-content:space-between;align-items:center">
    <div><b>⚠️ Before any target revert</b> <span class="muted">Bank earned proof first → save the re-entry path → record what will be lost → click Revert once → treat shells, tunnels, uploads and changes as stale until revalidated.</span></div>
    <button class="btn" type="button" onclick="switchView('workspaceView')">Open target →</button>
  </div>
</div>
'''
s = s.replace(anchor, strip + anchor, 1)

# Version-forward visible release identity without changing persisted state keys.
s = s.replace('<title>OSCP V20 Exam-Only Operating System</title>', '<title>OSCP V21 Exam-Only Operating System</title>', 1)
s = s.replace('Embedded V20 exam reference', 'Embedded V21 exam reference', 1)
s = s.replace('V20 exam rules lock', 'V21 exam rules lock', 1)

# Smoke tests: exactly one guard, existing critical safety features preserved.
assert s.count(marker) == 1
assert 'click Revert once' in s
assert 'Bank earned proof first' in s
assert 'proofSubmissionSanity' in s, 'proof sanity guard missing'
assert 'preExamAutoUpdateWarning' in s, 'pre-exam update warning missing'
assert 'simpleRiskStrip' in s, 'risk strip missing'
assert s.count('id="simpleExamView"') == 1
assert s.count('id="workspaceView"') == 1
assert s.count('id="reportsView"') == 1

p.write_text(s, encoding='utf-8')

# Small release note, not embedded reference material.
r = Path('OSCP-V20-README.md').read_text(encoding='utf-8')
header = '''# OSCP V21 — Revert Guard\n\nV21 is a focused exam-time safety release built on V20. It adds one compact revert guard to the Start flow so a revert is not triggered before earned proof and recovery state are protected.\n\n## V21 delta\n\n- Before any target revert, the Start flow now says: **bank earned proof → save re-entry → record what will be lost → click Revert once → treat old state as stale until revalidated**.\n- This mirrors the current OffSec guidance that a revert destroys target-side changes and the control-panel revert button should be clicked only once per attempt.\n- No new reference/tool material, persistent state, secret fields, or extra navigation destination was added.\n- Existing proof-submission sanity check, risk strip, recovery packet, stale-state handling, and offline behavior remain intact.\n\n---\n\n'''
Path('OSCP-V21-README.md').write_text(header + r, encoding='utf-8')
print('V21 revert guard patch + smoke tests passed')
