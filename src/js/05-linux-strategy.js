/* ===== Linux Exam Desk =====
   Target-aware post-shell -> root checklist.
   Reuses the Windows strategy card styles to avoid another UI system.
*/
(function(){
 'use strict';
 if(window.__OSCP_LINUX_STRATEGY_READY__)return;
 window.__OSCP_LINUX_STRATEGY_READY__=true;

 const LINUX_STRATEGY_STEPS=[
  {id:'baseline',title:'1. Baseline the shell and host',why:'Know the exact user, groups, distro/kernel, routes and local listeners before interpreting any privilege-escalation lead.',cmd:'whoami\nid\nhostname\nuname -a\ncat /etc/os-release 2>/dev/null\nip addr\nip route\nss -lntup 2>/dev/null || netstat -lntup 2>/dev/null\nps aux --forest',anchor:'ref-c4-i-have-a-linux-shell-what-now'},
  {id:'filesystem',title:'2. Quick filesystem / software / user triage',why:'Custom applications, home directories, web roots, backups and non-default writable paths often reveal the intended route faster than CVE hunting.',cmd:'pwd; umask; env\nls -la /home /opt /srv /var/www /usr/local /mnt /media 2>/dev/null\nfind /home /opt /srv /var/www /usr/local -maxdepth 3 -type f -readable 2>/dev/null | head -n 250\ncat /etc/passwd\ngetent group 2>/dev/null | grep -E "(docker|lxd|disk|shadow|adm|sudo|wheel)"',anchor:'ref-12-31-linux-practical-attack-trees-finding-validation-path'},
  {id:'tools',title:'3. Automated pass — SAVE + READ',why:'Use automation for breadth, but preserve its output and turn only concrete findings into manual hypotheses. Do not rerun it because you forgot the result.',cmd:'./linpeas.sh | tee /tmp/linpeas.txt\n# fallback / second opinion only when useful:\n./lse.sh -l1 | tee /tmp/lse.txt\n# then READ the saved output before launching another tool',anchor:'ref-12-12-automated-enumeration-run-then-manually-validate'},
  {id:'credentials',title:'4. Focused credentials / secrets pass',why:'History, SSH material, environment files, application configs, backups and service credentials frequently create either direct root access or a stronger identity.',cmd:'history 2>/dev/null\nfind /home -maxdepth 3 \\( -name .bash_history -o -name .zsh_history -o -name authorized_keys -o -name id_rsa -o -name id_ed25519 \\) -type f -readable -print 2>/dev/null\nfind /var/www /opt /srv /usr/local -maxdepth 4 -type f \\( -name "*.env" -o -name "*.conf" -o -name "*.ini" -o -name "*.yml" -o -name "*.yaml" -o -name "*.bak" -o -name "*.old" \\) -readable 2>/dev/null | head -n 250\nps eww -u root 2>/dev/null | head -n 80',anchor:'ref-c4-i-have-a-linux-shell-what-now'},
  {id:'sudo',title:'5. sudo / sudoers — validate the exact allowed primitive',why:'sudo is one of the highest-signal Linux branches. Match the exact allowed command, arguments, environment and wildcard behavior before using GTFOBins or a custom path.',cmd:'sudo -l\nsudo -V | head\ncat /etc/sudoers 2>/dev/null\nls -la /etc/sudoers.d 2>/dev/null\n# For any allowed binary: verify exact path + arguments, then check the matching GTFOBins primitive.',anchor:'ref-12-31-linux-practical-attack-trees-finding-validation-path'},
  {id:'suidcaps',title:'6. SUID / SGID / capabilities',why:'Known GTFOBins are quick wins; custom SUID/capability binaries deserve strings, file, ldd and behavior analysis before guessing.',cmd:'find / -perm -4000 -type f -exec ls -la {} \\; 2>/dev/null\nfind / -perm -2000 -type f -exec ls -la {} \\; 2>/dev/null\ngetcap -r / 2>/dev/null\n# For a custom candidate:\nfile /path/to/binary\nstrings -a /path/to/binary | head -n 120\nldd /path/to/binary 2>/dev/null',anchor:'ref-12-14-suid-sgid-binaries'},
  {id:'scheduled',title:'7. cron / systemd timers / scheduled execution',why:'The useful condition is privileged execution plus a file, directory, command, environment file or dependency you can actually control.',cmd:'cat /etc/crontab 2>/dev/null\nls -la /etc/cron.* /var/spool/cron /var/spool/cron/crontabs 2>/dev/null\nsystemctl list-timers --all 2>/dev/null\nsystemctl list-unit-files --type=service --type=timer 2>/dev/null | head -n 250\nfind /etc/systemd /usr/lib/systemd /lib/systemd -type f -writable -ls 2>/dev/null',anchor:'ref-12-16-cron-timers-scheduled-jobs'},
  {id:'processes',title:'8. Root processes / local-only services / sockets',why:'A root process or localhost-only application can expose a writable config, weak socket, reusable credential, command runner or custom service path.',cmd:'ps auxf\nss -lntup 2>/dev/null || netstat -lntup 2>/dev/null\nls -la /run /var/run 2>/dev/null | head -n 200\nfind /run /var/run -type s -ls 2>/dev/null | head -n 120\n# Map interesting PID -> executable/config:\nreadlink -f /proc/PID/exe 2>/dev/null\ntr "\\0" " " </proc/PID/cmdline 2>/dev/null; echo',anchor:'ref-12-31-linux-practical-attack-trees-finding-validation-path'},
  {id:'writable',title:'9. Writable root-called dependency / PATH / library / config',why:'Do not treat “writable” alone as privesc. Prove a privileged caller, controllable object and reliable trigger, then change the smallest possible thing.',cmd:'find /etc /opt /srv /usr/local /var/www -xdev -type f -writable -ls 2>/dev/null | head -n 250\nfind /opt /srv /usr/local /var/www -xdev -type d -writable -ls 2>/dev/null | head -n 200\necho "$PATH"\nfind / -name "*.service" -o -name "*.timer" 2>/dev/null | head -n 200\n# For a candidate: identify owner/caller -> exact file lookup -> write primitive -> trigger -> rollback.',anchor:'ref-12-15-writable-files-directories-ownership'},
  {id:'platform',title:'10. Groups / containers / mounts / NFS',why:'docker/lxd/disk-style groups, host mounts, privileged containers and misconfigured network filesystems can become root paths, but only when the exact prerequisite is present.',cmd:'id\nmount\nfindmnt 2>/dev/null\ncat /etc/fstab 2>/dev/null\nls -la /.dockerenv /var/run/docker.sock 2>/dev/null\ndocker ps 2>/dev/null\nlxc list 2>/dev/null || lxc-ls 2>/dev/null\ncat /proc/1/cgroup 2>/dev/null\nsystemd-detect-virt 2>/dev/null\ncat /etc/exports 2>/dev/null',anchor:'ref-12-20-nfs-rpc-network-filesystems'},
  {id:'reenum',title:'11. Re-enumerate after every context change',why:'A new user, group, shell, secret, route or service context changes what you can read and execute. Re-run the high-signal checks rather than assuming the old result still applies.',cmd:'id\nsudo -l\nss -lntup 2>/dev/null || netstat -lntup 2>/dev/null\nps aux --forest\n# Re-check previously blocked files/configs/services with the new identity.\n# Re-test only the credential reuse paths justified by newly recovered material.',anchor:'ref-c4-i-have-a-linux-shell-what-now'},
  {id:'kernel',title:'12. Kernel / package CVE LAST',why:'Use a local CVE only after simpler userland paths are weak and the exact distro package revision, architecture, prerequisites and recovery impact are known.',cmd:'uname -a\ncat /etc/os-release 2>/dev/null\ndpkg-query -W 2>/dev/null | tee /tmp/packages.txt || rpm -qa 2>/dev/null | tee /tmp/packages.txt\nsudo --version 2>/dev/null | head\npkexec --version 2>/dev/null\n# Validate distro package/backport status before selecting any exploit.',anchor:'ref-12-31-linux-practical-attack-trees-finding-validation-path'}
 ];

 let linuxStrategyState=safeStoredRecord(STORE+'linuxStrategy',{});
 function linuxStrategyKey(){const s=$('#linuxStrategyTarget');return s?.value||activeTargetId||'__unassigned__'}
 function saveLinuxStrategy(){safeStoreSet(STORE+'linuxStrategy',JSON.stringify(linuxStrategyState));v9Dirty=true}
 function renderLinuxStrategy(){
  const sel=$('#linuxStrategyTarget'),body=$('#linuxStrategyBody');if(!sel||!body)return;
  const old=sel.value;
  const options=[new Option('No exam target selected','__unassigned__'),...targets.map(t=>new Option(targetLabel(t),t.id))];
  sel.replaceChildren(...options);
  const wanted=(old&&[...sel.options].some(o=>o.value===old))?old:(activeTargetId&&targets.some(t=>t.id===activeTargetId)?activeTargetId:'__unassigned__');
  sel.value=wanted;
  const key=linuxStrategyKey(),state=linuxStrategyState[key]||{};
  const cards=LINUX_STRATEGY_STEPS.map(s=>{
   const card=document.createElement('div');card.className='winStrategyStep'+(state[s.id]?' done':'');
   const top=document.createElement('div');top.className='row';top.style.justifyContent='space-between';top.style.alignItems='flex-start';
   const label=document.createElement('label'),check=document.createElement('input');check.className='linuxStrategyCheck';check.dataset.step=s.id;check.type='checkbox';check.checked=!!state[s.id];
   const strong=document.createElement('b');strong.textContent=s.title;label.append(check,document.createTextNode(' '),strong);
   const actions=document.createElement('div');actions.className='row';
   const copy=document.createElement('button');copy.className='btn linuxStrategyCopy';copy.dataset.step=s.id;copy.type='button';copy.textContent='Copy';
   const ref=document.createElement('button');ref.className='btn linuxStrategyRef';ref.dataset.ref=s.anchor;ref.type='button';ref.textContent='Ref →';
   actions.append(copy,ref);top.append(label,actions);
   const why=document.createElement('div');why.className='winStrategyWhy';why.textContent=s.why;
   const pre=document.createElement('pre');pre.className='winStrategyCmd';pre.textContent=s.cmd;
   card.append(top,why,pre);return card;
  });
  body.replaceChildren(...cards);
  $$('.linuxStrategyCheck').forEach(x=>x.onchange=()=>{const k=linuxStrategyKey();linuxStrategyState[k]=linuxStrategyState[k]||{};linuxStrategyState[k][x.dataset.step]=x.checked;saveLinuxStrategy();renderLinuxStrategy()});
  $$('.linuxStrategyCopy').forEach(b=>b.onclick=async()=>{const s=LINUX_STRATEGY_STEPS.find(x=>x.id===b.dataset.step);if(s)await guardedCopyText(sanitizeUnicode(s.cmd),'Linux strategy command',null,{allowPlaceholders:true})});
  $$('.linuxStrategyRef').forEach(b=>b.onclick=()=>openRef(b.dataset.ref));
  const done=LINUX_STRATEGY_STEPS.filter(s=>state[s.id]).length;
  $('#linuxStrategyDone').textContent=`${done}/${LINUX_STRATEGY_STEPS.length}`;
  $('#linuxStrategyPct').textContent=`${Math.round(done/LINUX_STRATEGY_STEPS.length*100)}%`;
  const t=targets.find(x=>x.id===key),hint=$('#linuxStrategyTargetHint');
  if(hint){
   hint.replaceChildren();
   if(t){
    const b=document.createElement('b');b.textContent=targetLabel(t);hint.append(document.createTextNode('Selected: '),b);
    if(t.role!=='linux'){const br=document.createElement('br'),small=document.createElement('span');small.className='tiny';small.textContent='Role is not marked Linux; use only if this target actually has a Linux shell.';hint.append(br,small)}
   }else hint.textContent='No exam target selected — add or choose the current Linux target to store progress safely.';
  }
 }

 $('#linuxStrategyTarget')?.addEventListener('change',renderLinuxStrategy);
 $('#linuxStrategyOpenRef')?.addEventListener('click',()=>openRef('ref-c4-i-have-a-linux-shell-what-now'));
 $('#linuxStrategyReset')?.addEventListener('click',()=>{const k=linuxStrategyKey();if(confirm('Reset the Linux strategy checklist for this target?')){delete linuxStrategyState[k];saveLinuxStrategy();renderLinuxStrategy()}});
 $('#linuxStrategyOpenTree')?.addEventListener('click',()=>{switchView('methodTreesView');setTimeout(()=>window.OSCP_TREE_READER?.show?.('linux'),30)});
 $('#linuxStrategyBank')?.addEventListener('click',()=>document.getElementById('examBankBtn')?.click());

 const baseSwitch=switchView;
 switchView=function(id){baseSwitch(id);if(id==='linuxStrategyView')renderLinuxStrategy()};

 const baseSession=sessionPayload;
 sessionPayload=function(includeSecrets=false){const o=baseSession(includeSecrets);o.linuxStrategyState=linuxStrategyState;return o};
 const baseRestore=restoreV9Payload;
 restoreV9Payload=function(o){if(o?.linuxStrategyState&&typeof o.linuxStrategyState==='object')linuxStrategyState=o.linuxStrategyState;baseRestore(o);saveLinuxStrategy();renderLinuxStrategy()};

 try{V16_SELF_TESTS.push(
  ['Linux exam desk complete',()=>[LINUX_STRATEGY_STEPS.length===12&&LINUX_STRATEGY_STEPS.every(s=>['id','title','why','cmd','anchor'].every(k=>String(s[k]||'').trim())),'12 target-aware steps']],
  ['Linux strategy backup integration',()=>[sessionPayload(false).linuxStrategyState===linuxStrategyState,'state included']]
 )}catch(e){}

 window.OSCP_LINUX_STRATEGY={steps:LINUX_STRATEGY_STEPS,render:renderLinuxStrategy};
 renderLinuxStrategy();
})();
