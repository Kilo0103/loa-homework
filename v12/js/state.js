import { difficultyOf, distributeGateGold, boundRateOf } from '../data/raids.js';

export const STORAGE_KEY='loa-homework-v12';
const OLD_KEYS=['loa-homework-v9','loa-homework-v8'];
export const API_KEY_STORAGE='loa-homework-v12:api-key';
const OLD_API_KEYS=['loa-homework-v9:api-key','loa-homework-v8:api-key'];
export const listeners=new Set();

function uid(prefix='id'){return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;}
function kstParts(){
  const f=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'});
  return Object.fromEntries(f.formatToParts(new Date()).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
}
export function dailyCycle(){
  const p=kstParts(),d=new Date(Date.UTC(+p.year,+p.month-1,+p.day,12));
  if(+p.hour<6)d.setUTCDate(d.getUTCDate()-1);
  return d.toISOString().slice(0,10);
}
export function weeklyCycle(){
  const p=kstParts(),d=new Date(Date.UTC(+p.year,+p.month-1,+p.day,12));
  if(+p.hour<6)d.setUTCDate(d.getUTCDate()-1);
  d.setUTCDate(d.getUTCDate()-((d.getUTCDay()-3+7)%7));
  return d.toISOString().slice(0,10);
}
function defaults(){
  return {
    version:13,
    meta:{dailyCycle:dailyCycle(),weeklyCycle:weeklyCycle()},
    settings:{characterName:'',rememberApiKey:false,autoAssign:true,autoDaily:true,autoWeekly:true,recommendCount:3},
    apiRoster:{fetchedAt:null,characters:[]},
    activeCharacters:[]
  };
}
function normalizeDaily(t){
  return {
    id:t.id||uid('d'),
    name:String(t.name||'숙제'),
    target:Math.max(1,Number(t.target||1)),
    current:Math.max(0,Number(t.current||0)),
    restEnabled:!!t.restEnabled,
    rest:Math.max(0,Math.min(200,Number(t.rest||0))),
    active:t.active!==false,
    source:String(t.source||'manual')
  };
}
function normalizeWeekly(t){
  if(t.type==='raid'||t.raidId){
    const diff=difficultyOf(t.raidId,t.difficultyId);
    const gates=Math.max(1,Number(t.gates?.length||diff?.gates||1));
    const oldDone=!!t.done;
    return {
      id:t.id||uid('w'),
      type:'raid',
      raidId:t.raidId,
      difficultyId:t.difficultyId,
      gates:Array.from({length:gates},(_,i)=>({done:Array.isArray(t.gates)?!!t.gates[i]?.done:oldDone})),
      goldEnabled:t.goldEnabled!==false,
      goldOverride:t.goldOverride===null||t.goldOverride===undefined||t.goldOverride===''?null:(Number.isFinite(Number(t.goldOverride))?Number(t.goldOverride):null),
      note:String(t.note||''),
      active:t.active!==false,
      source:String(t.source||'manual')
    };
  }
  return {
    id:t.id||uid('w'),
    type:'custom',
    name:String(t.name||'주간 숙제'),
    done:!!t.done,
    gold:Math.max(0,Number(t.gold||0)),
    goldEnabled:t.goldEnabled!==false,
    note:String(t.note||''),
    active:t.active!==false,
    source:String(t.source||'manual')
  };
}
function migrate(raw){
  const s=defaults();
  if(!raw||typeof raw!=='object')return s;
  s.settings={...s.settings,...(raw.settings||{})};
  s.apiRoster={...s.apiRoster,...(raw.apiRoster||{})};
  s.meta={...s.meta,...(raw.meta||{})};
  s.activeCharacters=Array.isArray(raw.activeCharacters)?raw.activeCharacters.map((c,i)=>{
    const isSix=c.goldCharacter===undefined?i<6:!!c.goldCharacter;
    const dailyRaw=Array.isArray(c.dailyTasks)?c.dailyTasks:[];
    const weeklyRaw=Array.isArray(c.weeklyTasks)?c.weeklyTasks:[];
    const dailyTasks=dailyRaw.map(t=>{
      const n=normalizeDaily(t);
      if(!isSix&&t.active===undefined)n.active=false;
      return n;
    });
    const weeklyTasks=weeklyRaw.map(t=>{
      const n=normalizeWeekly(t);
      if(!isSix&&t.active===undefined)n.active=false;
      return n;
    });
    return {
      key:c.key||`${c.serverName||''}::${c.characterName||''}`,
      serverName:c.serverName||'',
      characterName:c.characterName||'',
      characterClassName:c.characterClassName||'',
      characterLevel:Number(c.characterLevel||0),
      itemAvgLevel:Number(c.itemAvgLevel||String(c.itemAvgLevelText||'0').replaceAll(',','')),
      itemAvgLevelText:c.itemAvgLevelText||String(c.itemAvgLevel||0),
      profile:c.profile||null,
      favorite:!!c.favorite,
      goldCharacter:isSix,
      extraGoals:Array.isArray(c.extraGoals)?c.extraGoals.filter(Boolean):[],
      dailyTasks,
      weeklyTasks
    };
  }):[];
  let goldSeen=0;
  s.activeCharacters.forEach(c=>{
    if(c.goldCharacter){
      goldSeen++;
      if(goldSeen>6)c.goldCharacter=false;
    }
  });
  return s;
}
function load(){
  try{
    const v=localStorage.getItem(STORAGE_KEY);
    if(v)return migrate(JSON.parse(v));
    for(const k of OLD_KEYS){
      const o=localStorage.getItem(k);
      if(o){
        const s=migrate(JSON.parse(o));
        localStorage.setItem(STORAGE_KEY,JSON.stringify(s));
        return s;
      }
    }
  }catch(e){console.warn(e);}
  return defaults();
}
export let state=load();
export function save(emit=true){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  if(emit)listeners.forEach(fn=>fn(state));
}
export function subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);}
export function ensureResets(){
  let dirty=false;
  const d=dailyCycle(),w=weeklyCycle();
  if(state.meta.dailyCycle!==d){
    state.activeCharacters.forEach(c=>c.dailyTasks.forEach(t=>t.current=0));
    state.meta.dailyCycle=d;
    dirty=true;
  }
  if(state.meta.weeklyCycle!==w){
    state.activeCharacters.forEach(c=>c.weeklyTasks.forEach(t=>{
      if(t.type==='raid')t.gates.forEach(g=>g.done=false);
      else t.done=false;
    }));
    state.meta.weeklyCycle=w;
    dirty=true;
  }
  if(dirty)save(false);
}
export function getApiKey(){return localStorage.getItem(API_KEY_STORAGE)||OLD_API_KEYS.map(k=>localStorage.getItem(k)).find(Boolean)||'';}
export function setApiKey(key,remember){
  OLD_API_KEYS.forEach(k=>localStorage.removeItem(k));
  if(remember&&key)localStorage.setItem(API_KEY_STORAGE,key);
  else localStorage.removeItem(API_KEY_STORAGE);
}
export function resetState(){
  state=defaults();
  localStorage.removeItem(STORAGE_KEY);
  setApiKey('',false);
  save();
}
export function character(key){return state.activeCharacters.find(c=>c.key===key)||null;}
export function isTracked(c,t){return !!c.goldCharacter||t.active!==false;}
export function weeklyTaskGold(t){
  if(!t.goldEnabled)return 0;
  if(t.type==='custom')return Math.max(0,Number(t.gold||0));
  const d=difficultyOf(t.raidId,t.difficultyId);
  return t.goldOverride!==null&&t.goldOverride!==undefined?Math.max(0,Number(t.goldOverride||0)):Math.max(0,Number(d?.gold||0));
}
export function weeklyTaskEarned(t){
  const total=weeklyTaskGold(t);
  if(t.type==='custom')return t.done?total:0;
  const d=difficultyOf(t.raidId,t.difficultyId);
  let gateGold=distributeGateGold(d);
  if(t.goldOverride!==null&&t.goldOverride!==undefined&&Number(t.goldOverride)!==Number(d?.gold||0)){
    const count=t.gates.length||1,base=Math.floor(total/count);
    gateGold=Array(count).fill(base);
    gateGold[count-1]+=total-base*count;
  }
  return t.gates.reduce((sum,g,i)=>sum+(g.done?(gateGold[i]||0):0),0);
}
function splitGold(t,total){
  const amount=Math.max(0,Number(total||0));
  if(t.type==='custom')return {total:amount,tradeable:amount,bound:0,boundRate:0};
  const rate=boundRateOf(t.raidId,t.difficultyId);
  const bound=Math.round(amount*rate);
  return {total:amount,tradeable:amount-bound,bound,boundRate:rate};
}
export function weeklyTaskGoldBreakdown(t){return splitGold(t,weeklyTaskGold(t));}
export function weeklyTaskEarnedBreakdown(t){return splitGold(t,weeklyTaskEarned(t));}
export function summary(){
  let sixDailyDone=0,sixDailyTotal=0,sixWeeklyDone=0,sixWeeklyTotal=0;
  let extraDone=0,extraTotal=0,potential=0,earned=0;
  let potentialTradeable=0,potentialBound=0,earnedTradeable=0,earnedBound=0;
  let sixCount=0,extraCount=0;
  state.activeCharacters.forEach(c=>{
    if(c.goldCharacter){
      sixCount++;
      c.dailyTasks.forEach(t=>{sixDailyTotal+=t.target;sixDailyDone+=Math.min(t.current,t.target);});
      c.weeklyTasks.forEach(t=>{
        const done=t.type==='raid'?t.gates.every(g=>g.done):t.done;
        sixWeeklyTotal++;
        if(done)sixWeeklyDone++;
        const p=weeklyTaskGoldBreakdown(t),e=weeklyTaskEarnedBreakdown(t);
        potential+=p.total;
        earned+=e.total;
        potentialTradeable+=p.tradeable;
        potentialBound+=p.bound;
        earnedTradeable+=e.tradeable;
        earnedBound+=e.bound;
      });
    }else{
      extraCount++;
      c.dailyTasks.filter(t=>t.active!==false).forEach(t=>{extraTotal+=t.target;extraDone+=Math.min(t.current,t.target);});
      c.weeklyTasks.filter(t=>t.active!==false).forEach(t=>{
        extraTotal++;
        const done=t.type==='raid'?t.gates.every(g=>g.done):t.done;
        if(done)extraDone++;
      });
    }
  });
  return {
    sixDailyDone,sixDailyTotal,sixWeeklyDone,sixWeeklyTotal,extraDone,extraTotal,
    goldPotential:potential,goldEarned:earned,
    goldPotentialTradeable:potentialTradeable,goldPotentialBound:potentialBound,
    goldEarnedTradeable:earnedTradeable,goldEarnedBound:earnedBound,
    sixCount,extraCount
  };
}
export function makeDaily(name,target=1,restEnabled=false){
  return normalizeDaily({id:uid('d'),name,target,current:0,restEnabled,rest:0,active:true,source:'manual'});
}
export function makeCustomWeekly(name='주간 숙제',gold=0){
  return normalizeWeekly({id:uid('w'),type:'custom',name,done:false,gold,goldEnabled:true,active:true,source:'manual'});
}
export function makeRaidWeekly(raidId,difficultyId){
  const d=difficultyOf(raidId,difficultyId);
  return normalizeWeekly({id:uid('r'),type:'raid',raidId,difficultyId,gates:Array.from({length:d?.gates||1},()=>({done:false})),goldEnabled:true,goldOverride:null,active:true,source:'manual'});
}
