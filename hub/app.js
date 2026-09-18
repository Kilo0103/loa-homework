import { state, summary, ensureResets } from '../v12/js/state.js';

ensureResets();

const $=id=>document.getElementById(id);
const pct=(done,total)=>total?Math.round(done/total*100):0;
const gold=n=>`${Number(n||0).toLocaleString('ko-KR')} G`;
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;");

function dailyState(c){
  const tasks=c.dailyTasks||[];
  const total=tasks.reduce((s,t)=>s+Number(t.target||1),0);
  const done=tasks.reduce((s,t)=>s+Math.min(Number(t.current||0),Number(t.target||1)),0);
  return {done,total,pct:pct(done,total)};
}
function weeklyState(c){
  const tasks=c.weeklyTasks||[];
  const total=tasks.length;
  const done=tasks.filter(t=>t.type==='raid'?(t.gates||[]).every(g=>g.done):t.done).length;
  return {done,total,pct:pct(done,total)};
}
function incomplete(c){
  const d=dailyState(c),w=weeklyState(c);
  return d.done<d.total||w.done<w.total;
}
function renderRoster(){
  const root=$('sixRoster');
  const rows=state.activeCharacters.filter(c=>c.goldCharacter).slice(0,6);
  if(!rows.length){
    root.innerHTML='<div class="empty-roster"><b>아직 The Six가 없습니다.</b><span>숙제 페이지에서 원정대를 동기화하고 캐릭터를 추가하세요.</span></div>';
    return;
  }
  root.innerHTML=rows.map(c=>{
    const d=dailyState(c),w=weeklyState(c),done=!incomplete(c);
    const img=c.profile?.characterImage;
    return `<a class="roster-row" href="homework/">
      <div class="roster-avatar">${img?`<img src="${esc(img)}" alt="">`:esc((c.characterClassName||'LA').slice(0,2))}</div>
      <div class="roster-copy"><b>${esc(c.characterName)}</b><span>${esc(c.characterClassName)} · Lv.${esc(c.itemAvgLevelText)}</span></div>
      <div class="mini-progress"><span>오늘</span><b>${d.pct}% · ${d.done}/${d.total}</b></div>
      <div class="mini-progress weekly-progress"><span>이번 주</span><b>${w.pct}% · ${w.done}/${w.total}</b></div>
      <div class="row-state ${done?'done':''}"><b>${done?'완료':'진행 중'}</b><small>${done?'오늘도 끝':'남은 숙제 있음'}</small></div>
    </a>`;
  }).join('');
}

function render(){
  const s=summary();
  const dp=pct(s.sixDailyDone,s.sixDailyTotal);
  const wp=pct(s.sixWeeklyDone,s.sixWeeklyTotal);
  const overall=pct(s.sixDailyDone+s.sixWeeklyDone,s.sixDailyTotal+s.sixWeeklyTotal);
  const extra=pct(s.extraDone,s.extraTotal);
  const remaining=state.activeCharacters.filter(c=>c.goldCharacter&&incomplete(c)).length;
  const goldPct=pct(s.goldEarned,s.goldPotential);
  const goldLeft=Math.max(0,s.goldPotential-s.goldEarned);

  $('dailyPct').textContent=`${dp}%`;
  $('dailyText').textContent=`${s.sixDailyDone} / ${s.sixDailyTotal}`;
  $('dailyBar').style.width=`${dp}%`;
  $('dailySub').textContent=s.sixDailyTotal?`남은 ${Math.max(0,s.sixDailyTotal-s.sixDailyDone)}회`:'등록된 일일 숙제 없음';

  $('weeklyPct').textContent=`${wp}%`;
  $('weeklyText').textContent=`${s.sixWeeklyDone} / ${s.sixWeeklyTotal}`;
  $('weeklyBar').style.width=`${wp}%`;
  $('weeklySub').textContent=s.sixWeeklyTotal?`남은 ${Math.max(0,s.sixWeeklyTotal-s.sixWeeklyDone)}개`:'등록된 주간 숙제 없음';

  $('overallPct').textContent=`${overall}%`;
  $('goldRate').textContent=`${goldPct}%`;
  $('goldRemaining').textContent=gold(goldLeft);
  $('goldDetail').textContent=`남음 · 획득 ${gold(s.goldEarned)} / 전체 ${gold(s.goldPotential)}`;

  $('remainingChars').textContent=String(remaining);
  $('sixCount').textContent=`${s.sixCount} / 6`;
  $('rosterDetail').textContent=`등록 캐릭터 ${state.activeCharacters.length}명`;
  $('extraCount').textContent=`${s.extraCount}명`;
  $('extraProgress').textContent=`${extra}%`;
  $('apiCount').textContent=`${state.apiRoster.characters.length}명`;
  $('lastSync').textContent=state.apiRoster.fetchedAt?new Date(state.apiRoster.fetchedAt).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):'없음';

  if(!state.activeCharacters.length)$('heroMessage').textContent='숙제 페이지에서 원정대를 등록하면 여기에 내 현황이 표시됩니다.';
  else if(remaining===0)$('heroMessage').textContent='The Six의 현재 등록 숙제를 모두 완료했습니다.';
  else $('heroMessage').textContent=`The Six ${remaining}캐릭터에 아직 할 일이 남아 있습니다. 주간 골드는 ${gold(goldLeft)} 남았습니다.`;

  renderRoster();
}
render();
