from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')
if 'id="examBankBtn"' in s:
    raise SystemExit('proof bank already installed')

anchor = '  <button class="btn" id="themeBtn" title="Toggle reference theme">◐</button>'
if anchor not in s:
    raise SystemExit('top-bar anchor missing')

button = '  <button class="btn good" id="examBankBtn" type="button" title="Score-safe proof banking (Alt+B)" aria-haspopup="dialog">✓ BANK</button>\n'
css = '''<style id="examBankStyles">
.examBankBackdrop{position:fixed;inset:0;z-index:1001;background:rgba(2,5,10,.84);display:none;place-items:center;padding:18px;backdrop-filter:blur(5px)}.examBankBackdrop.open{display:grid}.examBankDialog{width:min(760px,100%);max-height:92vh;overflow:auto;background:var(--panel);border:1px solid #2f7a55;border-radius:14px;padding:18px;box-shadow:0 24px 80px rgba(0,0,0,.6)}.examBankHead{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.examBankHead h2{margin:0}.examBankSteps{display:grid;gap:8px;margin:14px 0}.examBankStep{background:#0d1119;border:1px solid var(--line);border-radius:9px;padding:10px}.examBankStep b{color:var(--good)}.examBankDanger{border-left:3px solid var(--bad);background:#28171a;padding:9px 11px;border-radius:7px}.examBankActions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;margin-top:12px}
</style>'''
modal = '''<div id="examBankModal" class="examBankBackdrop" role="dialog" aria-modal="true" aria-labelledby="examBankTitle" aria-hidden="true">
 <div class="examBankDialog">
  <div class="examBankHead"><div><h2 id="examBankTitle">✓ Bank the Points</h2><div class="muted">Do this immediately when you obtain local.txt or proof.txt.</div></div><button class="btn" id="examBankClose" type="button">Close</button></div>
  <div class="examBankSteps">
   <div class="examBankStep"><b>1 · ORIGINAL LOCATION</b><br>Use an interactive shell on the target. Display the proof with <code>cat</code> (Linux) or <code>type</code> (Windows) from the file's original location.</div>
   <div class="examBankStep"><b>2 · SCREENSHOT</b><br>Show the target IP with <code>ip addr</code>/<code>ifconfig</code> or <code>ipconfig</code>, plus the proof-file contents. Do not use a text editor to display the proof.</div>
   <div class="examBankStep"><b>3 · CONTROL PANEL</b><br>Submit the exact local.txt/proof.txt value in the Exam Control Panel before the exam ends. The panel does not confirm whether the value is correct.</div>
   <div class="examBankStep"><b>4 · JOURNAL</b><br>Record target, privilege level, exact proof path, commands, screenshot filename, and the path that produced the shell.</div>
  </div>
  <div class="examBankDanger"><b>Zero-point guard:</b> Do not treat a shell as banked points until both the Control Panel submission and valid screenshot evidence are complete.</div>
  <div class="examBankActions"><button class="btn" id="examBankTarget" type="button">Open Target</button><button class="btn primary" id="examBankEvidence" type="button">Open [EVIDENCE:PACKET]</button><button class="btn good" id="examBankDone" type="button">Banked ✓</button></div>
  <div class="tiny">Shortcut: Alt+B · Esc closes</div>
 </div>
</div>'''
js = '''<script id="examBankScript">
(()=>{const m=document.getElementById('examBankModal'),b=document.getElementById('examBankBtn'),c=document.getElementById('examBankClose');if(!m||!b||!c)return;const open=()=>{m.classList.add('open');m.setAttribute('aria-hidden','false');c.focus()},close=()=>{m.classList.remove('open');m.setAttribute('aria-hidden','true');b.focus()};b.onclick=open;c.onclick=close;m.onclick=e=>{if(e.target===m)close()};document.addEventListener('keydown',e=>{if(e.key==='Escape'&&m.classList.contains('open')){e.preventDefault();close()}else if(e.altKey&&!e.ctrlKey&&!e.metaKey&&String(e.key).toLowerCase()==='b'){e.preventDefault();open()}});document.getElementById('examBankTarget')?.addEventListener('click',()=>{close();try{switchView('workspaceView')}catch(e){}});document.getElementById('examBankEvidence')?.addEventListener('click',()=>{close();const q=document.getElementById('globalSearch');if(!q)return;q.value='[EVIDENCE:PACKET]';try{switchView('searchView');renderSearch(q.value)}catch(e){q.dispatchEvent(new Event('input',{bubbles:true}))}});document.getElementById('examBankDone')?.addEventListener('click',()=>{close();try{toast('Proof banked — continue only after screenshot + control-panel submission')}catch(e){}});window.OSCP_PROOF_BANK={open,close}})();
</script>'''

s = s.replace(anchor, button + anchor, 1)
s = s.replace('</head>', css + '\n</head>', 1)
s = s.replace('</body>', modal + '\n' + js + '\n</body>', 1)

for marker in ['id="examBankBtn"', 'id="examBankModal"', 'window.OSCP_PROOF_BANK', '[EVIDENCE:PACKET]', 'Exam Control Panel']:
    assert marker in s, marker
assert s.count('id="examBankBtn"') == 1
assert s.count('id="examBankModal"') == 1
assert s.count('<html') == 1 and s.count('</html>') == 1
p.write_text(s, encoding='utf-8')
print('proof-bank patch + smoke test passed')
