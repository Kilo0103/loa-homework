import { state, save } from './state.js?v=18';
import { recommendedDaily, recommendedRaids, extraSuggestions } from './recommend.js?v=18';
import * as UI from './ui.js?v=18';

const AUTO_DAILY_NAMES=new Set(['카오스 던전','쿠르잔 전선','혼돈의 균열','가디언 토벌','가디언의 잔영','에포나 의뢰']);
let beforeSync=new Map();

function preserveDaily(next,old){
  if(!old)return next;
  next.id=old.id;
  next.current=Math.min(Number(old.current||0),Number(next.target||1));
  next.rest=Number(old.rest||0);
  next.active=true;
  return next;
}
function rebuildSixDaily(c){
  const oldByName=new Map((c.dailyTasks||[]).map(t=>[t.name,t]));
  const custom=(c.dailyTasks||[]).filter(t=>!AUTO_DAILY_NAMES.has(t.name)&&!String(t.source||'').startsWith('extra:'));
  const next=recommendedDaily(c).map(t=>{
    t.source='auto:level';
    return preserveDaily(t,oldByName.get(t.name));
  });
  c.dailyTasks=[...next,...custom];
}
function rebuildSixWeekly(c){
  const oldRaids=new Map((c.weeklyTasks||[]).filter(t=>t.type==='raid').map(t=>[`${t.raidId}::${t.difficultyId}`,t]));
  const custom=(c.weeklyTasks||[]).filter(t=>t.type==='custom');
  const next=recommendedRaids(c,state.settings.recommendCount||3).map(t=>{
    t.source='auto:level';
    const old=oldRaids.get(`${t.raidId}::${t.difficultyId}`);
    if(old){
      t.id=old.id;
      if(Array.isArray(old.gates)&&old.gates.length===t.gates.length)t.gates=old.gates.map(g=>({done:!!g.done}));
      t.goldEnabled=old.goldEnabled!==false;
      t.goldOverride=old.goldOverride??null;
    }
    return t;
  });
  c.weeklyTasks=[...next,...custom];
}
function refreshExtraLevelTasks(c){
  const recs=new Map(extraSuggestions(c).map(r=>[r.id,r]));
  for(const t of c.dailyTasks||[]){
    if(!String(t.source||'').startsWith('extra:'))continue;
    const id=t.source.slice(6),r=recs.get(id);
    if(!r||r.kind!=='daily')continue;
    t.name=r.name;
    t.target=r.target||1;
    t.current=Math.min(Number(t.current||0),t.target);
    t.restEnabled=!!r.restEnabled;
  }
  for(const t of c.weeklyTasks||[]){
    if(!String(t.source||'').startsWith('extra:'))continue;
    const id=t.source.slice(6),r=recs.get(id);
    if(!r||r.kind!=='weekly')continue;
    t.name=r.name;
  }
}
function applyLevelRefresh(){
  if(!beforeSync.size)return;
  const changed=[];
  for(const c of state.activeCharacters){
    const old=beforeSync.get(c.key);
    const now=Number(c.itemAvgLevel||0);
    if(old===undefined||Number(old)===now)continue;
    changed.push(c);
    if(c.goldCharacter&&state.settings.autoAssign){
      if(state.settings.autoDaily)rebuildSixDaily(c);
      if(state.settings.autoWeekly)rebuildSixWeekly(c);
    }else if(!c.goldCharacter){
      refreshExtraLevelTasks(c);
    }
  }
  beforeSync.clear();
  if(!changed.length)return;
  save();
  UI.renderAll();
  const names=changed.slice(0,3).map(c=>c.characterName).join(', ');
  UI.toast(`${names}${changed.length>3?` 외 ${changed.length-3}명`:''} 레벨 변경을 반영해 숙제를 갱신했습니다.`);
}

document.addEventListener('click',e=>{
  const sync=e.target.closest('#syncNow');
  if(sync){
    beforeSync=new Map(state.activeCharacters.map(c=>[c.key,Number(c.itemAvgLevel||0)]));
    return;
  }

  if(e.target.closest('[data-action]'))return;

  const daily=e.target.closest('.daily-item');
  if(daily){
    daily.querySelector('[data-action="daily-step"][data-delta="1"]')?.click();
    return;
  }

  const weekly=e.target.closest('.weekly-item');
  if(!weekly)return;

  const custom=weekly.querySelector('[data-action="weekly-custom-toggle"]');
  if(custom){custom.click();return;}

  const gates=[...weekly.querySelectorAll('[data-action="gate-toggle"]')];
  const next=gates.find(g=>!g.classList.contains('on'));
  next?.click();
});

const syncMessage=document.getElementById('syncMessage');
if(syncMessage){
  new MutationObserver(()=>{
    if(syncMessage.textContent.includes('동기화 완료'))applyLevelRefresh();
  }).observe(syncMessage,{childList:true,subtree:true,characterData:true});
}
