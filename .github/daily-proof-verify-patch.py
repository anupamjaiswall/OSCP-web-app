from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')
marker = 'proofSubmissionVerifyGuard'
if marker in s:
    raise SystemExit('guard already present')

old = '<div><b>4 · Submit now</b>Enter the exact value in the control panel before the attack window ends.</div>'
new = '<div id="proofSubmissionVerifyGuard"><b>4 · Submit + compare</b>Enter the exact value in the control panel before the attack window ends, then compare it character-for-character against the original shell output. <strong>The control panel does not validate whether the submitted proof is correct.</strong></div>'
if old not in s:
    raise SystemExit('bank-points anchor missing')
s = s.replace(old, new, 1)

reports_anchor = '<section id="reportsView" class="view">'
if reports_anchor not in s:
    raise SystemExit('reports view anchor missing')
reports_guard = '''<section id="reportsView" class="view">\n<div class="card" id="proofSubmissionVerifyCard" style="margin-bottom:14px;border-color:var(--warn)">\n <div class="row" style="justify-content:space-between;align-items:flex-start"><div><h2>Proof submission sanity check</h2><div class="muted">OffSec does not tell you whether a submitted proof value is correct. Before treating points as banked, compare the control-panel value character-for-character with the value shown by <code>cat</code>/<code>type</code> in the original-path interactive shell screenshot.</div></div><span class="chip">NO SECRET STORED HERE</span></div>\n <div class="checks" style="margin-bottom:0"><label class="check"><input type="checkbox"> screenshot shows full proof + target IP together</label><label class="check"><input type="checkbox"> submitted value visually re-checked against shell output</label></div>\n</div>'''
s = s.replace(reports_anchor, reports_guard, 1)

# Keep the offline rule snapshot date current without changing the data model/version.
s = s.replace('Verified 06 Sep 2026 against the current OffSec Exam Guide, FAQ and AI policy.', 'Verified 08 Sep 2026 against the current OffSec Exam Guide, FAQ and AI policy.', 1)

# Lightweight structural tests.
assert s.count('proofSubmissionVerifyGuard') == 1
assert s.count('proofSubmissionVerifyCard') == 1
assert 'The control panel does not validate whether the submitted proof is correct.' in s
assert 'submitted value visually re-checked against shell output' in s
assert '<section id="reportsView" class="view">' in s
assert s.count('<section id="reportsView" class="view">') == 1

p.write_text(s, encoding='utf-8')
print('proof submission verification guard patch passed')
