import { state, summary, weeklyTaskGold, weeklyTaskEarned, weeklyTaskGoldBreakdown, weeklyTaskEarnedBreakdown, character } from './state.js';
import { RAID_CATALOG, raidById, difficultyOf } from '../data/raids.js';
import { EXTRA_GOALS, extraSuggestions, extraPriority } from './recommend.js';

function esc(v){return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');}
function gold(n){return `${Number(n||0).toLocaleString('ko-KR')} G`;}
export function setText(id,value){const e=document.getElementById(id);if(e)e.textContent=value;}
export function toast(msg){const e=document.getElementById('toast');e.textContent=msg;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('show'),1800);}
export function modal(id,open=true){document.getElementById(id)?.classList.toggle('open',open);}

export function renderSummary(){
  const s=summary();
  const dp=s.sixDailyTotal?Math.round(s.sixDailyDone/s.sixDailyTotal*100):0;
  const wp=s.sixWeeklyTotal?Math.round(s.sixWeeklyDone/s.sixWeeklyTotal*100):0;
  const ep=s.extraTotal?Math.round(s.extraDone/s.extraTotal*100):0;
  setText('dailyPct',`${dp}%`);
  setText('dailyText',`${s.sixDailyDone} / ${s.sixDailyTotal}`);
  document.getElementById('dailyBar').style.width=`${dp}%`;
  setText('weeklyPct',`${wp}%`);
  setText('weeklyText',`${s.sixWeeklyDone} / ${s.sixWeeklyTotal}`);
  document.getElementById('weeklyBar').style.width=`${wp}%`;
  setText('goldPotential',gold(s.goldPotential));
  setText('goldEarned',`획득 ${gold(s.goldEarned)} · 남음 ${gold(s.goldPotential-s.goldEarned)}`);
  setText('goldSplit',`유통 ${gold(s.goldPotentialTradeable)} · 귀속 ${gold(s.goldPotentialBound)}`);
  setText('extraActive',`${s.extraDone} / ${s.extraTotal}`);
  setText('extraText',`Extra ${s.extraCount}명 · 활성 숙제 ${ep}%`);
  setText('rosterRoleCount',`The Six ${s.sixCount}/6`);
  setText('rosterCount',`API 원정대 ${state.apiRoster.characters.length}명`);
  setText('lastSync',state.apiRoster.fetchedAt?`마지막 동기화 ${new Date(state.apiRoster.fetchedAt).toLocaleString('ko-KR')}`:'API 동기화 기록 없음');
}

function dailyHtml(c,t,extra=false){
  const done=t.current>=t.target;
  return `<div class="daily-item ${done?'done':''}">
    <button class="daily-check" data-action="daily-step" data-char="${esc(c.key)}" data-task="${esc(t.id)}" data-delta="1"><span>${done?'✓':`${t.current}/${t.target}`}</span></button>
    <div class="task-copy"><strong>${esc(t.name)}</strong>${t.restEnabled?`<small>휴게 ${t.rest}/200</small>`:''}</div>
    <button class="mini" data-action="daily-step" data-char="${esc(c.key)}" data-task="${esc(t.id)}" data-delta="-1">−</button>
    ${extra?`<button class="task-off" title="Extra 활성 숙제에서 끄기" data-action="deactivate-extra" data-char="${esc(c.key)}" data-task="${esc(t.id)}" data-kind="daily">×</button>`:''}
  </div>`;
}
function weeklyHtml(c,t,extra=false){
  const off=extra?`<button class="task-off" title="Extra 활성 숙제에서 끄기" data-action="deactivate-extra" data-char="${esc(c.key)}" data-task="${esc(t.id)}" data-kind="weekly">×</button>`:'';
  if(t.type==='custom')return `<div class="weekly-item ${t.done?'done':''}">
    <button class="gate" data-action="weekly-custom-toggle" data-char="${esc(c.key)}" data-task="${esc(t.id)}">${t.done?'✓':''}</button>
    <div class="raid-copy"><strong>${esc(t.name)}</strong><small>${t.goldEnabled?gold(weeklyTaskGold(t)):'논골드'}</small></div>${off}
  </div>`;
  const r=raidById(t.raidId),d=difficultyOf(t.raidId,t.difficultyId);
  if(!r||!d)return `<div class="weekly-item broken">알 수 없는 레이드${off}</div>`;
  const total=weeklyTaskGoldBreakdown(t),earned=weeklyTaskEarnedBreakdown(t);
  const split=total.bound>0
    ? `<span class="gold-split"><b>유통 ${gold(total.tradeable)}</b><b class="bound">귀속 ${gold(total.bound)}</b></span>`
    : `<span class="gold-split"><b>유통 ${gold(total.tradeable)}</b></span>`;
  return `<div class="weekly-item">
    <div class="raid-copy"><strong>${esc(r.name)} <em>${esc(d.name)}</em></strong><small>Lv.${d.ilvl.toLocaleString('ko-KR')} · ${t.goldEnabled?`${gold(earned.total)} / ${gold(total.total)}`:'논골드'}</small>${t.goldEnabled?split:''}</div>
    <div class="gates">${t.gates.map((g,i)=>`<button class="gate ${g.done?'on':''}" data-action="gate-toggle" data-char="${esc(c.key)}" data-task="${esc(t.id)}" data-gate="${i}">${i+1}관</button>`).join('')}</div>${off}
  </div>`;
}
function characterGold(c){
  if(!c.goldCharacter)return {total:0,tradeable:0,bound:0};
  return c.weeklyTasks.reduce((s,t)=>{
    const g=weeklyTaskGoldBreakdown(t);
    s.total+=g.total;s.tradeable+=g.tradeable;s.bound+=g.bound;
    return s;
  },{total:0,tradeable:0,bound:0});
}
function head(c){
  const img=c.profile?.characterImage;
  const cg=characterGold(c);
  return `<header class="char-head">
    <div class="identity">
      <div class="avatar">${img?`<img src="${esc(img)}" alt="">`:`<span>${esc((c.characterClassName||'LA').slice(0,2))}</span>`}</div>
      <div>
        <div class="name-line"><button class="star ${c.favorite?'on':''}" data-action="favorite" data-char="${esc(c.key)}">★</button><h3>${esc(c.characterName)}</h3><span class="role-badge ${c.goldCharacter?'six':'extra'}">${c.goldCharacter?'THE SIX':'EXTRA'}</span></div>
        <p>${esc(c.characterClassName)} · <b>Lv.${esc(c.itemAvgLevelText)}</b> · ${esc(c.serverName)}</p>
      </div>
    </div>
    <div class="char-actions">
      <label class="gold-toggle six-toggle"><input type="checkbox" data-action="gold-character" data-char="${esc(c.key)}" ${c.goldCharacter?'checked':''}><span>The Six</span></label>
      ${c.goldCharacter?`<div class="char-gold"><strong>${gold(cg.total)}</strong><small>유통 ${gold(cg.tradeable)}${cg.bound?` · 귀속 ${gold(cg.bound)}`:''}</small></div><button class="btn small ghost" data-action="recommend" data-char="${esc(c.key)}">추천 재구성</button>`:''}
      <button class="icon-btn" data-action="edit-character" data-char="${esc(c.key)}">⋯</button>
    </div>
  </header>`;
}
function sixBody(c){
  return `<div class="char-body">
    <section>
      <div class="section-head"><span>오늘</span><button data-action="edit-character" data-char="${esc(c.key)}" data-tab="daily">편집</button></div>
      <div class="task-list">${c.dailyTasks.length?c.dailyTasks.map(t=>dailyHtml(c,t)).join(''):`<button class="empty-task" data-action="recommend" data-char="${esc(c.key)}">+ 레벨 추천 적용</button>`}</div>
    </section>
    <section>
      <div class="section-head"><span>이번 주</span><button data-action="edit-character" data-char="${esc(c.key)}" data-tab="weekly">편집</button></div>
      <div class="task-list weekly-list">${c.weeklyTasks.length?c.weeklyTasks.map(t=>weeklyHtml(c,t)).join(''):`<button class="empty-task" data-action="recommend" data-char="${esc(c.key)}">+ 레이드 추천 적용</button>`}</div>
    </section>
  </div>`;
}
function goalChips(c){
  const selected=new Set(c.extraGoals||[]);
  return EXTRA_GOALS.map(g=>`<button class="goal-chip ${selected.has(g.id)?'on':''}" data-action="toggle-extra-goal" data-char="${esc(c.key)}" data-goal="${esc(g.id)}">${esc(g.label)}</button>`).join('');
}
function extraRecommendationsHtml(c){
  const recs=extraSuggestions(c);
  if(!(c.extraGoals||[]).length)return `<div class="extra-empty">먼저 이 캐릭터에서 얻고 싶은 것을 선택하세요.</div>`;
  const activeSources=new Set([
    ...c.dailyTasks.filter(t=>t.active!==false).map(t=>t.source),
    ...c.weeklyTasks.filter(t=>t.active!==false).map(t=>t.source)
  ]);
  const visible=recs.filter(r=>!activeSources.has(`extra:${r.id}`));
  if(!visible.length)return `<div class="extra-empty">현재 선택한 목표의 추천 숙제를 모두 활성화했습니다.</div>`;
  return visible.map(r=>`<div class="extra-rec">
    <div><strong>${esc(r.name)}</strong><small><b>${extraPriority(r.score)}</b> · ${esc(r.reason)}</small></div>
    <button class="btn small" data-action="activate-extra" data-char="${esc(c.key)}" data-rec="${esc(r.id)}">+ 활성화</button>
  </div>`).join('');
}
function extraBody(c){
  const daily=c.dailyTasks.filter(t=>t.active!==false);
  const weekly=c.weeklyTasks.filter(t=>t.active!==false);
  return `<div class="char-body extra-body">
    <section>
      <div class="section-head"><span>활성 숙제</span><button data-action="edit-character" data-char="${esc(c.key)}">직접 편집</button></div>
      <div class="extra-active-group">
        <small class="extra-subtitle">오늘</small>
        <div class="task-list">${daily.length?daily.map(t=>dailyHtml(c,t,true)).join(''):'<span class="muted">활성화한 일일 숙제가 없습니다.</span>'}</div>
      </div>
      <div class="extra-active-group">
        <small class="extra-subtitle">주간 / 필요할 때</small>
        <div class="task-list weekly-list">${weekly.length?weekly.map(t=>weeklyHtml(c,t,true)).join(''):'<span class="muted">활성화한 주간 숙제가 없습니다.</span>'}</div>
      </div>
    </section>
    <section>
      <div class="section-head"><span>이 캐릭터에서 뭘 얻을까?</span><span class="optional-label">추천 ≠ 미완료</span></div>
      <div class="goal-chips">${goalChips(c)}</div>
      <div class="extra-recommendations">${extraRecommendationsHtml(c)}</div>
    </section>
  </div>`;
}
function card(c){
  return `<article class="char-card ${c.favorite?'favorite-card':''} ${c.goldCharacter?'six-card':'extra-card'}">${head(c)}${c.goldCharacter?sixBody(c):extraBody(c)}</article>`;
}

function dailyIncomplete(c){
  const tasks=c.goldCharacter?c.dailyTasks:c.dailyTasks.filter(t=>t.active!==false);
  return tasks.some(t=>t.current<t.target);
}
function weeklyIncomplete(c){
  const tasks=c.goldCharacter?c.weeklyTasks:c.weeklyTasks.filter(t=>t.active!==false);
  return tasks.some(t=>t.type==='raid'?!t.gates.every(g=>g.done):!t.done);
}

export function renderCharacters(filter='all',query=''){
  const q=query.trim().toLowerCase();
  let rows=[...state.activeCharacters].sort((a,b)=>a.goldCharacter!==b.goldCharacter?(a.goldCharacter?-1:1):a.favorite!==b.favorite?(a.favorite?-1:1):b.itemAvgLevel-a.itemAvgLevel);
  rows=rows.filter(c=>{
    if(q&&![c.characterName,c.characterClassName,c.serverName,c.itemAvgLevelText].join(' ').toLowerCase().includes(q))return false;
    if(filter==='six'&&!c.goldCharacter)return false;
    if(filter==='extra'&&c.goldCharacter)return false;
    if(filter==='favorite'&&!c.favorite)return false;
    if(filter==='daily'&&!dailyIncomplete(c))return false;
    if(filter==='weekly'&&!weeklyIncomplete(c))return false;
    return true;
  });
  const root=document.getElementById('cards');
  root.innerHTML=rows.length?rows.map(card).join(''):`<div class="empty-board"><strong>${state.activeCharacters.length?'조건에 맞는 캐릭터가 없습니다.':'숙제 캐릭터가 없습니다.'}</strong><span>${state.activeCharacters.length?'필터를 바꿔 주세요.':'원정대를 동기화하고 캐릭터를 추가해 주세요.'}</span><button class="btn primary" data-action="open-add">+ 캐릭터 추가</button></div>`;
}
export function renderAll(filter='all',query=''){renderSummary();renderCharacters(filter,query);}

export function renderRosterCandidates(query=''){
  const active=new Set(state.activeCharacters.map(c=>c.key));
  const q=query.trim().toLowerCase();
  const rows=state.apiRoster.characters.filter(c=>!q||[c.characterName,c.characterClassName,c.serverName,c.itemAvgLevelText].join(' ').toLowerCase().includes(q));
  document.getElementById('candidateList').innerHTML=rows.map(c=>{
    const key=`${c.serverName}::${c.characterName}`,used=active.has(key),img=c.profile?.characterImage;
    return `<label class="candidate ${used?'disabled':''}"><input type="checkbox" class="candidate-check" value="${esc(key)}" ${used?'disabled':''}><div class="candidate-avatar">${img?`<img src="${esc(img)}">`:''}</div><div><strong>${esc(c.characterName)}</strong><small>${esc(c.characterClassName)} · Lv.${esc(c.itemAvgLevelText)} · ${esc(c.serverName)}</small></div><span>${used?'등록됨':'추가'}</span></label>`;
  }).join('')||'<div class="empty-mini">검색 결과가 없습니다.</div>';
  updateCandidateCount();
}
export function updateCandidateCount(){setText('selectedCount',`${document.querySelectorAll('.candidate-check:checked').length}명 선택`);}
export function raidOptions(selected=''){return RAID_CATALOG.map(r=>`<option value="${r.id}" ${r.id===selected?'selected':''}>${esc(r.group)} · ${esc(r.name)}${r.legacy?' (레거시)':''}</option>`).join('');}
export function difficultyOptions(raidId,selected=''){
  const r=raidById(raidId);
  return (r?.difficulties||[]).map(d=>`<option value="${d.id}" ${d.id===selected?'selected':''}>${esc(d.name)} · Lv.${d.ilvl.toLocaleString('ko-KR')} · ${gold(d.gold)}</option>`).join('');
}
function dailyEditor(t){
  return `<div class="edit-row daily-edit" data-id="${esc(t.id)}" data-current="${t.current}" data-active="${t.active!==false?'1':'0'}" data-source="${esc(t.source||'manual')}"><input class="input task-name" value="${esc(t.name)}" placeholder="숙제 이름"><input class="input target" type="number" min="1" max="99" value="${t.target}"><label class="tiny-check"><input type="checkbox" class="rest-enabled" ${t.restEnabled?'checked':''}>휴게</label><input class="input rest-value" type="number" min="0" max="200" value="${t.rest}" ${t.restEnabled?'':'disabled'}><button class="remove" data-action="remove-editor-row">✕</button></div>`;
}
function weeklyEditor(t){
  if(t.type==='custom')return `<div class="edit-row custom-weekly" data-id="${esc(t.id)}" data-done="${t.done?'1':'0'}" data-active="${t.active!==false?'1':'0'}" data-source="${esc(t.source||'manual')}"><input class="input task-name" value="${esc(t.name)}"><input class="input custom-gold" type="number" min="0" value="${t.gold}"><label class="tiny-check"><input class="gold-enabled" type="checkbox" ${t.goldEnabled?'checked':''}>골드</label><button class="remove" data-action="remove-editor-row">✕</button></div>`;
  const d=difficultyOf(t.raidId,t.difficultyId);
  return `<div class="edit-row raid-edit" data-id="${esc(t.id)}" data-gates='${JSON.stringify(t.gates)}' data-active="${t.active!==false?'1':'0'}" data-source="${esc(t.source||'manual')}"><select class="select raid-select">${raidOptions(t.raidId)}</select><select class="select difficulty-select">${difficultyOptions(t.raidId,t.difficultyId)}</select><input class="input gold-override" type="number" min="0" placeholder="자동 ${Number(d?.gold||0).toLocaleString('ko-KR')}" value="${t.goldOverride??''}"><label class="tiny-check"><input class="gold-enabled" type="checkbox" ${t.goldEnabled?'checked':''}>골드</label><button class="remove" data-action="remove-editor-row">✕</button></div>`;
}
export function openCharacterEditor(key,tab='daily'){
  const c=character(key);
  if(!c)return;
  document.getElementById('editCharKey').value=key;
  setText('editCharTitle',`${c.characterName} · ${c.goldCharacter?'The Six':'Extra'} 숙제 설정`);
  document.getElementById('dailyEditor').innerHTML=c.dailyTasks.map(dailyEditor).join('');
  document.getElementById('weeklyEditor').innerHTML=c.weeklyTasks.map(weeklyEditor).join('');
  switchEditorTab(tab);
  modal('characterModal');
}
export function switchEditorTab(tab){
  document.querySelectorAll('[data-edit-tab]').forEach(b=>b.classList.toggle('active',b.dataset.editTab===tab));
  document.getElementById('dailyEditorWrap').hidden=tab!=='daily';
  document.getElementById('weeklyEditorWrap').hidden=tab!=='weekly';
}
export function appendDailyEditor(t={id:'new',name:'',target:1,current:0,restEnabled:false,rest:0,active:true,source:'manual'}){
  document.getElementById('dailyEditor').insertAdjacentHTML('beforeend',dailyEditor({...t,id:t.id==='new'?`new-${Date.now()}`:t.id}));
}
export function appendCustomWeeklyEditor(t={id:'new',name:'',gold:0,goldEnabled:true,done:false,active:true,source:'manual'}){
  document.getElementById('weeklyEditor').insertAdjacentHTML('beforeend',weeklyEditor({...t,id:t.id==='new'?`new-${Date.now()}`:t.id,type:'custom'}));
}
export function appendRaidEditor(raidId='act4',difficultyId=null){
  const r=raidById(raidId)||RAID_CATALOG[0],d=r.difficulties.find(x=>x.id===difficultyId)||r.difficulties[0];
  document.getElementById('weeklyEditor').insertAdjacentHTML('beforeend',weeklyEditor({id:`new-${Date.now()}`,type:'raid',raidId:r.id,difficultyId:d.id,gates:Array.from({length:d.gates},()=>({done:false})),goldEnabled:true,goldOverride:null,active:true,source:'manual'}));
}
export function refreshDifficulty(select){
  const row=select.closest('.raid-edit'),r=select.value;
  row.querySelector('.difficulty-select').innerHTML=difficultyOptions(r);
  const d=difficultyOf(r,row.querySelector('.difficulty-select').value);
  row.dataset.gates=JSON.stringify(Array.from({length:d?.gates||1},()=>({done:false})));
  row.querySelector('.gold-override').value='';
  row.querySelector('.gold-override').placeholder=`자동 ${Number(d?.gold||0).toLocaleString('ko-KR')}`;
}
export function refreshDifficultyMeta(select){
  const row=select.closest('.raid-edit'),raidId=row.querySelector('.raid-select').value,d=difficultyOf(raidId,select.value);
  row.dataset.gates=JSON.stringify(Array.from({length:d?.gates||1},()=>({done:false})));
  row.querySelector('.gold-override').value='';
  row.querySelector('.gold-override').placeholder=`자동 ${Number(d?.gold||0).toLocaleString('ko-KR')}`;
}
export function renderSettings(){
  document.getElementById('apiCharacter').value=state.settings.characterName||'';
  document.getElementById('rememberKey').checked=!!state.settings.rememberApiKey;
  document.getElementById('autoAssign').checked=!!state.settings.autoAssign;
  document.getElementById('autoDaily').checked=!!state.settings.autoDaily;
  document.getElementById('autoWeekly').checked=!!state.settings.autoWeekly;
  document.getElementById('recommendCount').value=state.settings.recommendCount||3;
}
export function setSettingsTab(tab){
  document.querySelectorAll('[data-settings-tab]').forEach(b=>b.classList.toggle('active',b.dataset.settingsTab===tab));
  document.querySelectorAll('.settings-panel').forEach(p=>p.hidden=p.dataset.panel!==tab);
}
