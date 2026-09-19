import { RAID_CATALOG } from '../data/raids.js?v=18';
import { makeDaily, makeRaidWeekly } from './state.js?v=18';

export const EXTRA_GOALS=[
  {id:'gem',label:'보석'},
  {id:'silver',label:'실링'},
  {id:'material',label:'재련 재료'},
  {id:'card',label:'카드'},
  {id:'fate',label:'편린'},
  {id:'cube',label:'큐브 티켓'}
];

export function recommendedDaily(c){
  const ilvl=Number(c.itemAvgLevel||0);
  if(ilvl>=1730)return [
    makeDaily('혼돈의 균열',1,true),
    makeDaily('가디언의 잔영',1,true)
  ];
  if(ilvl>=1640)return [
    makeDaily('쿠르잔 전선',1,true),
    makeDaily('가디언 토벌',1,true)
  ];
  return [
    makeDaily('카오스 던전',2,true),
    makeDaily('가디언 토벌',1,true)
  ];
}

export function recommendedRaids(c,count=3){
  const ilvl=Number(c.itemAvgLevel||0);
  const candidates=[];
  for(const raid of RAID_CATALOG){
    if(raid.legacy)continue;
    const eligible=raid.difficulties.filter(d=>d.ilvl<=ilvl);
    if(!eligible.length)continue;
    eligible.sort((a,b)=>b.ilvl-a.ilvl||b.gold-a.gold);
    const d=eligible[0];
    candidates.push({raid,d});
  }
  candidates.sort((a,b)=>b.d.gold-a.d.gold||b.d.ilvl-a.d.ilvl);
  return candidates.slice(0,Math.max(1,Number(count||3))).map(x=>makeRaidWeekly(x.raid.id,x.d.id));
}

function suggestionScore(goals,tags,base=0){
  return tags.reduce((sum,id)=>sum+(goals.includes(id)?2:0),base);
}

export function extraSuggestions(c){
  const ilvl=Number(c.itemAvgLevel||0);
  const goals=Array.isArray(c.extraGoals)?c.extraGoals:[];
  if(!goals.length)return [];
  const chaosName=ilvl>=1730?'혼돈의 균열':ilvl>=1640?'쿠르잔 전선':'카오스 던전';
  const guardianName=ilvl>=1730?'가디언의 잔영':'가디언 토벌';
  const chaosTarget=ilvl>=1640?1:2;
  const pool=[
    {
      id:'chaos',
      kind:'daily',
      name:chaosName,
      target:chaosTarget,
      restEnabled:true,
      tags:['gem','silver','material','fate','cube'],
      reason:'실링·재련 재료를 챙기면서 편린/큐브 입장권 같은 확률 보상도 노릴 수 있음',
      base:2
    },
    {
      id:'guardian',
      kind:'daily',
      name:guardianName,
      target:1,
      restEnabled:true,
      tags:['gem','material','card'],
      reason:'캐릭터 성장 재료와 세팅/카드 계열 보상을 함께 노리는 선택',
      base:1
    },
    {
      id:'cube',
      kind:'weekly',
      name:'에브니 큐브',
      tags:['gem','silver'],
      reason:'입장권을 보유했다면 보석·실링 목적에서 우선도가 높음',
      base:2
    }
  ];
  if(ilvl>=1640){
    pool.push({
      id:'paradise',
      kind:'weekly',
      name:'낙원',
      tags:['material','silver'],
      reason:'시즌 성장 보상을 꾸준히 쌓는 용도. Extra라도 성장 재료 목적이면 고려',
      base:1
    });
  }
  return pool
    .map(x=>({...x,matched:x.tags.filter(t=>goals.includes(t)),score:suggestionScore(goals,x.tags,x.base)}))
    .filter(x=>x.matched.length>0)
    .sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name,'ko'));
}

export function extraPriority(score){
  if(score>=6)return '매우 추천';
  if(score>=4)return '추천';
  return '선택';
}
