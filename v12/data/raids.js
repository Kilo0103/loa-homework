export const RAID_CATALOG = [
  {id:'argos',name:'아르고스',group:'레거시',legacy:true,difficulties:[{id:'normal',name:'노말',ilvl:1370,gates:3,gold:0}]},
  {id:'valtan',name:'발탄',group:'군단장',legacy:true,difficulties:[{id:'normal',name:'노말',ilvl:1415,gates:2,gold:0},{id:'hard',name:'하드',ilvl:1445,gates:2,gold:0}]},
  {id:'vykas',name:'비아키스',group:'군단장',legacy:true,difficulties:[{id:'normal',name:'노말',ilvl:1430,gates:2,gold:0},{id:'hard',name:'하드',ilvl:1460,gates:2,gold:0}]},
  {id:'kakul',name:'쿠크세이튼',group:'군단장',legacy:true,difficulties:[{id:'normal',name:'노말',ilvl:1475,gates:3,gold:0}]},
  {id:'brel_legacy',name:'아브렐슈드 (군단장)',group:'군단장',legacy:true,difficulties:[{id:'normal',name:'노말',ilvl:1490,gates:4,gold:0},{id:'hard',name:'하드',ilvl:1540,gates:4,gold:0}]},
  {id:'kayangel',name:'카양겔',group:'어비스',legacy:true,difficulties:[{id:'normal',name:'노말',ilvl:1540,gates:3,gold:0},{id:'hard',name:'하드',ilvl:1580,gates:3,gold:0}]},
  {id:'akkan',name:'일리아칸',group:'군단장',legacy:true,difficulties:[{id:'normal',name:'노말',ilvl:1580,gates:3,gold:0},{id:'hard',name:'하드',ilvl:1600,gates:3,gold:0}]},
  {id:'ivory',name:'혼돈의 상아탑',group:'어비스',legacy:true,difficulties:[{id:'normal',name:'노말',ilvl:1600,gates:3,gold:0},{id:'hard',name:'하드',ilvl:1620,gates:3,gold:0}]},
  {id:'thaemine',name:'카멘',group:'군단장',difficulties:[{id:'normal',name:'노말',ilvl:1610,gates:4,gold:6400},{id:'hard',name:'하드',ilvl:1630,gates:4,gold:13000}]},
  {id:'echidna',name:'서막 : 에키드나',group:'카제로스',difficulties:[{id:'single',name:'싱글',ilvl:1620,gates:2,gold:6100},{id:'normal',name:'노말',ilvl:1620,gates:2,gold:6100},{id:'hard',name:'하드',ilvl:1640,gates:2,gold:7200}]},
  {id:'behemoth',name:'베히모스',group:'에픽',difficulties:[{id:'normal',name:'노말',ilvl:1640,gates:2,gold:7200}]},
  {id:'act1',name:'1막 : 에기르',group:'카제로스',difficulties:[{id:'single',name:'싱글',ilvl:1660,gates:2,gold:11500},{id:'normal',name:'노말',ilvl:1660,gates:2,gold:11500},{id:'hard',name:'하드',ilvl:1680,gates:2,gold:18000}]},
  {id:'act2',name:'2막 : 아브렐슈드',group:'카제로스',difficulties:[{id:'single',name:'싱글',ilvl:1670,gates:2,gold:16500},{id:'normal',name:'노말',ilvl:1670,gates:2,gold:16500},{id:'hard',name:'하드',ilvl:1690,gates:2,gold:23000}]},
  {id:'act3',name:'3막 : 모르둠',group:'카제로스',difficulties:[{id:'single',name:'싱글',ilvl:1680,gates:3,gold:21000},{id:'normal',name:'노말',ilvl:1680,gates:3,gold:21000},{id:'hard',name:'하드',ilvl:1700,gates:3,gold:27000}]},
  {id:'act4',name:'4막 : 아르모체',group:'카제로스',difficulties:[{id:'single',name:'싱글',ilvl:1700,gates:2,gold:27000,gateGold:[10000,17000]},{id:'normal',name:'노말',ilvl:1700,gates:2,gold:27000,gateGold:[10000,17000]},{id:'hard',name:'하드',ilvl:1720,gates:2,gold:38000,gateGold:[13000,25000]}]},
  {id:'finale',name:'종막 : 카제로스',group:'카제로스',difficulties:[{id:'normal',name:'노말',ilvl:1710,gates:2,gold:32000,gateGold:[11000,21000]},{id:'hard',name:'하드',ilvl:1730,gates:2,gold:48000,gateGold:[16000,32000]}]},
  {id:'serka',name:'고통의 마녀, 세르카',group:'그림자',difficulties:[{id:'normal',name:'노말',ilvl:1710,gates:2,gold:32000,gateGold:[12000,20000]},{id:'hard',name:'하드',ilvl:1730,gates:2,gold:44000,gateGold:[17500,26500]},{id:'nightmare',name:'나이트메어',ilvl:1740,gates:2,gold:54000,gateGold:[21000,33000]}]},
  {id:'cathedral',name:'지평의 성당',group:'어비스',boundGold:true,difficulties:[{id:'stage1',name:'1단계',ilvl:1700,gates:2,gold:30000,gateGold:[13500,16500]},{id:'stage2',name:'2단계',ilvl:1720,gates:2,gold:40000,gateGold:[16000,24000]},{id:'stage3',name:'3단계',ilvl:1750,gates:2,gold:50000,gateGold:[20000,30000]}]},
  {id:'belgardin',name:'죽음의 계승자, 벨가르딘',group:'그림자',difficulties:[{id:'normal',name:'노말',ilvl:1750,gates:2,gold:50000,gateGold:[20000,30000]},{id:'hard',name:'하드',ilvl:1770,gates:2,gold:62000,gateGold:[25000,37000]},{id:'nightmare',name:'나이트메어',ilvl:1780,gates:2,gold:75000,gateGold:[30000,45000]}]}
];

export function raidById(id){return RAID_CATALOG.find(r=>r.id===id)||null;}
export function difficultyOf(raidId,difficultyId){const r=raidById(raidId);return r?.difficulties.find(d=>d.id===difficultyId)||null;}
export function optionLabel(raid,d){return `${raid.name} · ${d.name} · Lv.${d.ilvl.toLocaleString('ko-KR')}`;}
export function distributeGateGold(d){if(Array.isArray(d?.gateGold)&&d.gateGold.length===d.gates)return [...d.gateGold];const gates=Math.max(1,Number(d?.gates||1));const total=Math.max(0,Number(d?.gold||0));const base=Math.floor(total/gates);const a=Array(gates).fill(base);a[gates-1]+=total-base*gates;return a;}
