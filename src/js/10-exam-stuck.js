
(()=>{
  const modal=document.getElementById('examResetModal'),openBtn=document.getElementById('examStuckBtn'),closeBtn=document.getElementById('examResetClose'); if(!modal||!openBtn||!closeBtn)return;
  const timerEl=document.getElementById('examResetTimer'),startBtn=document.getElementById('examResetStart'),resetBtn=document.getElementById('examResetTimerReset'); let deadline=0,tick=0;
  const fmt=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
  function paint(){const left=deadline?Math.max(0,Math.ceil((deadline-Date.now())/1000)):900;timerEl.textContent=fmt(left);if(deadline&&left===0){clearInterval(tick);tick=0;deadline=0;startBtn.textContent='Start 15m';timerEl.textContent='00:00';try{toast('15-minute rabbit-hole limit reached — rotate or justify one exact next test')}catch(e){}}}
  function start(){if(deadline){deadline=0;clearInterval(tick);tick=0;startBtn.textContent='Start 15m';paint();return}deadline=Date.now()+900000;startBtn.textContent='Pause';tick=setInterval(paint,1000);paint()}
  function reset(){deadline=0;clearInterval(tick);tick=0;startBtn.textContent='Start 15m';timerEl.textContent='15:00'}
  function open(){modal.classList.add('open');modal.setAttribute('aria-hidden','false');closeBtn.focus()} function close(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');openBtn.focus()}
  openBtn.addEventListener('click',open);closeBtn.addEventListener('click',close);startBtn.addEventListener('click',start);resetBtn.addEventListener('click',reset);modal.addEventListener('click',e=>{if(e.target===modal)close()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open')){e.preventDefault();close();return}if(e.altKey&&!e.ctrlKey&&!e.metaKey&&String(e.key)==='0'){e.preventDefault();open()}});
  document.getElementById('examResetTarget')?.addEventListener('click',()=>{close();try{switchView('workspaceView')}catch(e){}});
  document.getElementById('examResetReference')?.addEventListener('click',()=>{close();const q=document.getElementById('globalSearch');if(!q)return;q.value='[STUCK:RESET]';try{switchView('searchView');renderSearch(q.value)}catch(e){q.dispatchEvent(new Event('input',{bubbles:true}))}});
  window.OSCP_STUCK_RESET={open,start,reset};
})();
