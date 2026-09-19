import { state, save, ensureResets, getApiKey, setApiKey, resetState, character, makeDaily, makeCustomWeekly, makeRaidWeekly } from './state.js?v=18';
import { fetchRoster } from './api.js';
import { recommendedDaily, recommendedRaids, extraSuggestions } from './recommend.js?v=18';
import * as UI from './ui.js?v=18';

let filter='all',query='';

function render(){ensureResets();UI.renderAll(filter,query);}
function activeCountGold(){return state.activeCharacters.filter(c=>c.goldCharacter).length;}

function setGoldCharacter(c,on){
  if(on&&!c.goldCharacter&&activeCountGold()>=6){
    UI.toast('The Six는 최대 6명까지 지정할 수 있습니다.');
    render();
    return;
  }
  c.goldCharacter=on;
  if(on){
    c.dailyTasks.forEach(t=>t.active=true);
    c.weeklyTasks.forEach(t=>t.active=true);
    if(state.settings.autoAssign){
      if(state.settings.autoDaily&&!c.dailyTasks.length)c.dailyTasks=recommendedDaily(c);
      if(state.settings.autoWeekly&&!c.weeklyTasks.length)c.weeklyTasks=recommendedRaids(c,state.settings.recommendCount||3);
    }
  }else{
    c.dailyTasks.forEach(t=>t.active=false);
    c.weeklyTasks.forEach(t=>t.active=false);
  }
  save();
  render();
  UI.toast(on?`${c.characterName}을 The Six로 지정했습니다.`:`${c.characterName}을 Extra로 전환했습니다. 필요한 숙제만 활성화하세요.`);
}

function applyRecommendation(c){
  if(!c.goldCharacter){
    UI.toast('Extra는 목표를 고른 뒤 필요한 숙제만 활성화해 주세요.');
    return;
  }
  c.dailyTasks=recommendedDaily(c);
  c.weeklyTasks=recommendedRaids(c,state.settings.recommendCount||3);
  save();
  render();
  UI.toast(`${c.characterName} The Six 추천 숙제를 적용했습니다.`);
}

async function syncRoster(){
  const name=document.getElementById('apiCharacter').value.trim();
  const key=document.getElementById('apiKey').value.trim().replace(/^bearer\s+/i,'');
  const msg=document.getElementById('syncMessage'),btn=document.getElementById('syncNow');
  if(!name||!key){UI.toast('캐릭터명과 API Key를 입력해 주세요.');return;}
  btn.disabled=true;
  msg.className='sync-message';
  msg.textContent='원정대 조회 중...';
  try{
    const rows=await fetchRoster(name,key,(n,total)=>msg.textContent=`프로필 ${n}/${total} 조회 중...`);
    state.settings.characterName=name;
    state.settings.rememberApiKey=document.getElementById('rememberKey').checked;
    setApiKey(key,state.settings.rememberApiKey);
    state.apiRoster={fetchedAt:new Date().toISOString(),characters:rows};
    const map=new Map(rows.map(x=>[`${x.serverName}::${x.characterName}`,x]));
    state.activeCharacters.forEach(c=>{
      const x=map.get(c.key);
      if(x)Object.assign(c,x,{
        key:c.key,
        dailyTasks:c.dailyTasks,
        weeklyTasks:c.weeklyTasks,
        favorite:c.favorite,
        goldCharacter:c.goldCharacter,
        extraGoals:c.extraGoals||[]
      });
    });
    save();
    render();
    msg.textContent=`${rows.length}개 캐릭터 동기화 완료`;
    UI.toast('원정대를 갱신했습니다.');
  }catch(e){
    msg.className='sync-message error';
    msg.textContent=e.status===401||e.status===403?'API Key를 확인해 주세요.':e.status===429?'API 요청 제한에 도달했습니다.':`동기화 실패: ${e.message}`;
  }finally{
    btn.disabled=false;
  }
}

function openSettings(tab='api'){
  UI.renderSettings();
  document.getElementById('apiKey').value=getApiKey();
  document.getElementById('syncMessage').textContent='';
  UI.setSettingsTab(tab);
  UI.modal('settingsModal');
}
function saveSettings(){
  state.settings.characterName=document.getElementById('apiCharacter').value.trim();
  state.settings.rememberApiKey=document.getElementById('rememberKey').checked;
  state.settings.autoAssign=document.getElementById('autoAssign').checked;
  state.settings.autoDaily=document.getElementById('autoDaily').checked;
  state.settings.autoWeekly=document.getElementById('autoWeekly').checked;
  state.settings.recommendCount=Math.max(1,Math.min(5,Number(document.getElementById('recommendCount').value||3)));
  setApiKey(document.getElementById('apiKey').value.trim().replace(/^bearer\s+/i,''),state.settings.rememberApiKey);
  save();
  UI.modal('settingsModal',false);
  UI.toast('설정을 저장했습니다.');
}
function openAdd(){
  if(!state.apiRoster.characters.length){
    openSettings('api');
    UI.toast('먼저 API 원정대를 동기화해 주세요.');
    return;
  }
  document.getElementById('candidateSearch').value='';
  UI.renderRosterCandidates();
  UI.modal('addModal');
}
function addSelected(){
  const keys=[...document.querySelectorAll('.candidate-check:checked')].map(x=>x.value);
  const existing=new Set(state.activeCharacters.map(c=>c.key));
  let added=0;
  for(const key of keys){
    const x=state.apiRoster.characters.find(r=>`${r.serverName}::${r.characterName}`===key);
    if(!x||existing.has(key))continue;
    const isSix=activeCountGold()<6;
    const c={...x,key,favorite:false,goldCharacter:isSix,extraGoals:[],dailyTasks:[],weeklyTasks:[]};
    if(isSix&&state.settings.autoAssign){
      if(state.settings.autoDaily)c.dailyTasks=recommendedDaily(c);
      if(state.settings.autoWeekly)c.weeklyTasks=recommendedRaids(c,state.settings.recommendCount||3);
    }
    state.activeCharacters.push(c);
    existing.add(key);
    added++;
  }
  save();
  UI.modal('addModal',false);
  render();
  UI.toast(`${added}명 추가했습니다. 앞의 6명은 The Six, 이후는 Extra로 등록됩니다.`);
}

function saveCharacterEditor(){
  const key=document.getElementById('editCharKey').value,c=character(key);
  if(!c)return;
  const dailyRows=[...document.querySelectorAll('#dailyEditor .daily-edit')];
  c.dailyTasks=dailyRows.map(row=>{
    const t=makeDaily(row.querySelector('.task-name').value.trim(),Number(row.querySelector('.target').value||1),row.querySelector('.rest-enabled').checked);
    t.id=rowId(row);
    t.current=Math.min(Number(row.dataset.current||0),t.target);
    t.rest=Number(row.querySelector('.rest-value').value||0);
    t.active=c.goldCharacter?true:row.dataset.active!=='0';
    t.source=row.dataset.source||'manual';
    return t;
  }).filter(t=>t.name);
  const weekly=[];
  for(const row of document.querySelectorAll('#weeklyEditor .edit-row')){
    if(row.classList.contains('custom-weekly')){
      const t=makeCustomWeekly(row.querySelector('.task-name').value.trim(),Number(row.querySelector('.custom-gold').value||0));
      if(!t.name)continue;
      t.id=rowId(row);
      t.done=row.dataset.done==='1';
      t.goldEnabled=row.querySelector('.gold-enabled').checked;
      t.active=c.goldCharacter?true:row.dataset.active!=='0';
      t.source=row.dataset.source||'manual';
      weekly.push(t);
    }else{
      const raidId=row.querySelector('.raid-select').value,difficultyId=row.querySelector('.difficulty-select').value,t=makeRaidWeekly(raidId,difficultyId);
      t.id=rowId(row);
      try{
        const old=JSON.parse(row.dataset.gates||'[]');
        if(old.length===t.gates.length)t.gates=old;
      }catch{}
      t.goldEnabled=row.querySelector('.gold-enabled').checked;
      const over=row.querySelector('.gold-override').value.trim();
      t.goldOverride=over===''?null:Math.max(0,Number(over||0));
      t.active=c.goldCharacter?true:row.dataset.active!=='0';
      t.source=row.dataset.source||'manual';
      weekly.push(t);
    }
  }
  c.weeklyTasks=weekly;
  save();
  UI.modal('characterModal',false);
  render();
  UI.toast('숙제 구성을 저장했습니다.');
}
function rowId(row){
  const id=row.dataset.id||'';
  return id.startsWith('new-')?`${row.classList.contains('daily-edit')?'d':'w'}-${Date.now()}-${Math.random().toString(16).slice(2)}`:id;
}

function toggleExtraGoal(c,goal){
  if(c.goldCharacter)return;
  const goals=new Set(c.extraGoals||[]);
  if(goals.has(goal))goals.delete(goal);
  else goals.add(goal);
  c.extraGoals=[...goals];
  save();
  render();
}
function activateExtra(c,recId){
  if(c.goldCharacter)return;
  const rec=extraSuggestions(c).find(x=>x.id===recId);
  if(!rec){UI.toast('먼저 Extra 목표를 선택해 주세요.');return;}
  const source=`extra:${rec.id}`;
  const existingDaily=c.dailyTasks.find(t=>t.source===source);
  const existingWeekly=c.weeklyTasks.find(t=>t.source===source);
  if(existingDaily){
    existingDaily.active=true;
  }else if(existingWeekly){
    existingWeekly.active=true;
  }else if(rec.kind==='daily'){
    const t=makeDaily(rec.name,rec.target||1,!!rec.restEnabled);
    t.source=source;
    t.active=true;
    c.dailyTasks.push(t);
  }else{
    const t=makeCustomWeekly(rec.name,0);
    t.goldEnabled=false;
    t.source=source;
    t.active=true;
    c.weeklyTasks.push(t);
  }
  save();
  render();
  UI.toast(`${rec.name}을 Extra 활성 숙제로 추가했습니다.`);
}
function deactivateExtra(c,taskId,kind){
  if(c.goldCharacter)return;
  const list=kind==='daily'?c.dailyTasks:c.weeklyTasks;
  const t=list.find(x=>x.id===taskId);
  if(!t)return;
  t.active=false;
  save();
  render();
  UI.toast(`${t.name||'숙제'}을(를) Extra 활성 목록에서 껐습니다.`);
}

function exportData(){
  const blob=new Blob([JSON.stringify({app:'LOA Homework V13',exportedAt:new Date().toISOString(),data:state},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;
  a.download=`loa-homework-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
function importData(file){
  const r=new FileReader();
  r.onload=()=>{
    try{
      const p=JSON.parse(r.result),data=p.data||p;
      if(!data.activeCharacters)throw new Error('형식 오류');
      localStorage.setItem('loa-homework-v12',JSON.stringify(data));
      location.reload();
    }catch{UI.toast('백업 파일을 읽을 수 없습니다.');}
  };
  r.readAsText(file);
}
function resetDaily(){
  state.activeCharacters.forEach(c=>c.dailyTasks.forEach(t=>t.current=0));
  state.meta.dailyCycle='';
  save();
  render();
  UI.toast('일일 체크를 초기화했습니다.');
}
function resetWeekly(){
  state.activeCharacters.forEach(c=>c.weeklyTasks.forEach(t=>t.type==='raid'?t.gates.forEach(g=>g.done=false):t.done=false));
  state.meta.weeklyCycle='';
  save();
  render();
  UI.toast('주간 체크를 초기화했습니다.');
}

document.addEventListener('click',e=>{
  const el=e.target.closest('[data-action]');
  if(!el)return;
  const action=el.dataset.action,key=el.dataset.char,taskId=el.dataset.task,c=key?character(key):null;
  if(action==='open-settings')openSettings(el.dataset.tab||'api');
  else if(action==='open-add')openAdd();
  else if(action==='sync')syncRoster();
  else if(action==='save-settings')saveSettings();
  else if(action==='close-modal')UI.modal(el.dataset.modal,false);
  else if(action==='favorite'&&c){c.favorite=!c.favorite;save();render();}
  else if(action==='recommend'&&c)applyRecommendation(c);
  else if(action==='toggle-extra-goal'&&c)toggleExtraGoal(c,el.dataset.goal);
  else if(action==='activate-extra'&&c)activateExtra(c,el.dataset.rec);
  else if(action==='deactivate-extra'&&c)deactivateExtra(c,taskId,el.dataset.kind);
  else if(action==='edit-character'&&c)UI.openCharacterEditor(key,el.dataset.tab||'daily');
  else if(action==='daily-step'&&c){
    const t=c.dailyTasks.find(x=>x.id===taskId);
    if(t){
      const delta=Number(el.dataset.delta||0);
      t.current=delta>0?(t.current>=t.target?0:t.current+1):Math.max(0,t.current-1);
      save();render();
    }
  }
  else if(action==='gate-toggle'&&c){
    const t=c.weeklyTasks.find(x=>x.id===taskId),g=t?.gates?.[Number(el.dataset.gate)];
    if(g){g.done=!g.done;save();render();}
  }
  else if(action==='weekly-custom-toggle'&&c){
    const t=c.weeklyTasks.find(x=>x.id===taskId);
    if(t){t.done=!t.done;save();render();}
  }
  else if(action==='remove-editor-row')el.closest('.edit-row')?.remove();
  else if(action==='add-daily')UI.appendDailyEditor();
  else if(action==='add-custom-weekly')UI.appendCustomWeeklyEditor();
  else if(action==='add-raid')UI.appendRaidEditor();
  else if(action==='save-character')saveCharacterEditor();
  else if(action==='remove-character'){
    const target=character(document.getElementById('editCharKey').value);
    if(target&&confirm(`${target.characterName}을 숙제판에서 제거할까요?`)){
      state.activeCharacters=state.activeCharacters.filter(x=>x.key!==target.key);
      save();UI.modal('characterModal',false);render();
    }
  }
  else if(action==='confirm-add')addSelected();
  else if(action==='select-all'){document.querySelectorAll('.candidate-check:not(:disabled)').forEach(x=>x.checked=true);UI.updateCandidateCount();}
  else if(action==='reset-daily')resetDaily();
  else if(action==='reset-weekly')resetWeekly();
  else if(action==='export')exportData();
  else if(action==='import')document.getElementById('importFile').click();
  else if(action==='reset-all'){
    if(confirm('모든 로컬 데이터를 초기화할까요?')){resetState();location.reload();}
  }
});

document.addEventListener('change',e=>{
  const t=e.target;
  if(t.matches('[data-action="gold-character"]')){
    const c=character(t.dataset.char);
    if(c)setGoldCharacter(c,t.checked);
  }else if(t.classList.contains('candidate-check'))UI.updateCandidateCount();
  else if(t.classList.contains('raid-select'))UI.refreshDifficulty(t);
  else if(t.classList.contains('difficulty-select'))UI.refreshDifficultyMeta(t);
  else if(t.classList.contains('rest-enabled'))t.closest('.daily-edit').querySelector('.rest-value').disabled=!t.checked;
  else if(t.id==='importFile'&&t.files[0])importData(t.files[0]);
});
document.addEventListener('input',e=>{
  if(e.target.id==='search'){query=e.target.value;UI.renderCharacters(filter,query);}
  else if(e.target.id==='candidateSearch')UI.renderRosterCandidates(e.target.value);
});
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-filter]');
  if(b){
    filter=b.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));
    UI.renderCharacters(filter,query);
  }
  const st=e.target.closest('[data-settings-tab]');
  if(st)UI.setSettingsTab(st.dataset.settingsTab);
  const et=e.target.closest('[data-edit-tab]');
  if(et)UI.switchEditorTab(et.dataset.editTab);
  if(e.target.classList.contains('modal-bg'))UI.modal(e.target.id,false);
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape')document.querySelectorAll('.modal-bg.open').forEach(m=>UI.modal(m.id,false));
});

document.getElementById('apiKey').value=getApiKey();
ensureResets();
render();
