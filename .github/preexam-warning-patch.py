from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

marker = 'id="preExamAutoUpdateWarning"'
if marker in s:
    raise SystemExit('pre-exam auto-update warning already installed')

anchor = '<section id="simpleExamView" class="view active">'
if anchor not in s:
    raise SystemExit('simple exam view anchor missing')

warning = '''<div id="preExamAutoUpdateWarning" role="alert" style="margin:0 0 16px;padding:18px 20px;border:3px solid var(--bad);border-radius:14px;background:#35181d;box-shadow:0 0 0 1px rgba(255,123,134,.22),0 14px 36px rgba(0,0,0,.35);text-align:center">
  <div style="font-size:25px;font-weight:900;line-height:1.2;color:#ffdce0;letter-spacing:.2px">🚨 BEFORE THE OSCP EXAM: STOP THE AUTOMATIC CHECKLIST UPDATE CRON / DAILY AUTOMATION 🚨</div>
  <div style="margin-top:9px;font-size:16px;font-weight:700;color:#ffb6bd">Freeze this checklist before the exam. Do not let the automatic updater change the app while you are testing.</div>
  <div class="tiny" style="padding:8px 0 0;color:#e9b5ba">Use the verified local/offline copy during the exam, then re-enable automatic updates after the exam is finished.</div>
</div>'''

s = s.replace(anchor, anchor + '\n' + warning, 1)

assert marker in s
assert s.count(marker) == 1
assert 'STOP THE AUTOMATIC CHECKLIST UPDATE CRON / DAILY AUTOMATION' in s
assert 'Freeze this checklist before the exam' in s
assert s.count('<html') == 1 and s.count('</html>') == 1

p.write_text(s, encoding='utf-8')
print('pre-exam automatic-update warning patch + smoke test passed')
