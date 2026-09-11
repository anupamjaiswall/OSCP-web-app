from pathlib import Path
import re, subprocess, tempfile

root = Path('.')
index_p = root / 'index.html'
v22_readme_p = root / 'OSCP-V22-README.md'
index = index_p.read_text(encoding='utf-8')
readme = v22_readme_p.read_text(encoding='utf-8')

if 'id="v23PreRevertSnapshot"' in index:
    raise SystemExit('V23 pre-revert recovery control already present')

old_guard = '''<div class="card span12" id="v21RevertGuard" style="padding:12px 16px;border-color:#7a6030">
  <div class="row" style="justify-content:space-between;align-items:center">
    <div><b>⚠️ Before any target revert</b> <span class="muted">Bank earned proof first → save the re-entry path → record what will be lost → click Revert once → treat shells, tunnels, uploads and changes as stale until revalidated.</span></div>
    <button class="btn" type="button" onclick="switchView('workspaceView')">Open target →</button>
  </div>
</div>'''
new_guard = '''<div class="card span12" id="v21RevertGuard" style="padding:12px 16px;border-color:#7a6030">
  <div class="row" style="justify-content:space-between;align-items:center">
    <div><b>⚠️ Before any target revert</b> <span class="muted">Bank earned proof first → save the re-entry path → record what will be lost → click Revert once → treat shells, tunnels, uploads and changes as stale until revalidated.</span></div>
    <div class="row"><button class="btn good" id="v23PreRevertSnapshot" type="button">Save recovery point</button><button class="btn" type="button" onclick="switchView('workspaceView')">Open target →</button></div>
  </div>
  <div class="tiny" style="padding:6px 0 0">Recovery points are secret-free app-state snapshots; target-side state still disappears after the OffSec revert.</div>
</div>'''
if index.count(old_guard) != 1:
    raise SystemExit(f'revert guard anchor count = {index.count(old_guard)}; expected 1')
index = index.replace(old_guard, new_guard, 1)

# Reuse the existing snapshot engine instead of adding a new state model.
js_anchor = "$('#simpleSnapshotNow').onclick=()=>{snapshotNow('manual simple-mode recovery point');toast('Recovery point saved')};"
js_insert = js_anchor + "\nconst v23PreRevertSnapshot=$('#v23PreRevertSnapshot');if(v23PreRevertSnapshot)v23PreRevertSnapshot.onclick=()=>{const t=activeTarget();snapshotNow(`pre-revert ${t?targetLabel(t):'current target'}`);toast('Pre-revert recovery point saved')};"
if index.count(js_anchor) != 1:
    raise SystemExit(f'snapshot handler anchor count = {index.count(js_anchor)}; expected 1')
index = index.replace(js_anchor, js_insert, 1)

index = index.replace('<title>OSCP V22 Exam-Only Operating System</title>', '<title>OSCP V23 Exam-Only Operating System</title>', 1)
index = index.replace('Embedded V22 exam reference', 'Embedded V23 exam reference', 1)
index = index.replace('V22 exam reference', 'V23 exam reference', 1)

# Focused release note, preserving V22.
readme_v23 = readme
readme_v23 = re.sub(r'^# OSCP V22[^\n]*', '# OSCP V23 — Pre-Revert Recovery Shortcut', readme_v23, count=1, flags=re.M)
v23_delta = '''\n## V23 release — pre-revert recovery shortcut\n\n- The existing Start-page revert guard now has a **Save recovery point** action beside **Open target**.\n- The button calls the app's existing secret-free `snapshotNow()` recovery engine and labels the snapshot with the active target; no new storage model or secret field was added.\n- This removes a navigation step at the exact moment a revert can destroy target-side changes, while keeping the existing requirements to bank proof, preserve re-entry, record what will be lost, click Revert once, and revalidate stale state.\n- Current OffSec guidance was re-checked on **12 September 2026**: a revert returns the target to its original state, permanently loses target-side changes, and the exam guide says to click the revert button only once per attempt.\n- No new screen, reference material, tool list, or exam workflow was added.\n'''
insert_before = '\n## V22 release — compact proof capture\n'
if insert_before not in readme_v23:
    raise SystemExit('V22 README release anchor missing')
readme_v23 = readme_v23.replace(insert_before, v23_delta + insert_before, 1)

index_p.write_text(index, encoding='utf-8')
(root / 'OSCP-V23-README.md').write_text(readme_v23, encoding='utf-8')

# Focused structural + syntax verification.
checks = {
    'one recovery control': index.count('id="v23PreRevertSnapshot"') == 1,
    'reuses snapshot engine': "snapshotNow(`pre-revert ${t?targetLabel(t):'current target'}`)" in index,
    'guard safety wording retained': 'click Revert once → treat shells, tunnels, uploads and changes as stale until revalidated.' in index,
    'secret-free clarification': 'Recovery points are secret-free app-state snapshots' in index,
    'no new view': 'id="v23View"' not in index,
    'V23 title': '<title>OSCP V23 Exam-Only Operating System</title>' in index,
    'existing compact Linux proof capture retained': "ip addr | grep 'inet '" in index,
    'existing compact Windows proof capture retained': 'ipconfig | findstr /I "IPv4"' in index,
}
failed = [k for k,v in checks.items() if not v]
if failed:
    raise SystemExit('verification failed: ' + ', '.join(failed))

scripts = re.findall(r'<script[^>]*>(.*?)</script>', index, flags=re.S|re.I)
if not scripts:
    raise SystemExit('no inline script found for syntax verification')
with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f:
    f.write('\n'.join(scripts)); js_path = f.name
subprocess.run(['node','--check',js_path], check=True)
print('V23 pre-revert recovery shortcut verification passed')
