const RAID_CATALOG_V11=[
 {id:"argos",name:"아르고스",type:"raid",difficulties:[{id:"normal",name:"노말",ilvl:1370}]},
 {id:"valtan",name:"발탄",type:"raid",difficulties:[{id:"normal",name:"노말",ilvl:1415},{id:"hard",name:"하드",ilvl:1445}]},
 {id:"vykas",name:"비아키스",type:"raid",difficulties:[{id:"normal",name:"노말",ilvl:1430},{id:"hard",name:"하드",ilvl:1460}]},
 {id:"kakul",name:"쿠크세이튼",type:"raid",difficulties:[{id:"normal",name:"노말",ilvl:1475}]},
 {id:"brel",name:"아브렐슈드",type:"raid",difficulties:[{id:"normal",name:"노말",ilvl:1490},{id:"hard",name:"하드",ilvl:1540}]},
 {id:"kayangel",name:"카양겔",type:"abyss",difficulties:[{id:"normal",name:"노말",ilvl:1540},{id:"hard",name:"하드",ilvl:1580}]},
 {id:"akkan",name:"일리아칸",type:"raid",difficulties:[{id:"normal",name:"노말",ilvl:1580},{id:"hard",name:"하드",ilvl:1600}]},
 {id:"ivory",name:"혼돈의 상아탑",type:"abyss",difficulties:[{id:"normal",name:"노말",ilvl:1600},{id:"hard",name:"하드",ilvl:1620}]},
 {id:"thaemine",name:"카멘",type:"raid",difficulties:[{id:"normal",name:"노말",ilvl:1610},{id:"hard",name:"하드",ilvl:1630}]},
 {id:"echidna",name:"카제로스 서막 · 에키드나",type:"raid",difficulties:[{id:"single",name:"싱글",ilvl:1620},{id:"normal",name:"노말",ilvl:1620},{id:"hard",name:"하드",ilvl:1640}]},
 {id:"behemoth",name:"베히모스",type:"raid",difficulties:[{id:"normal",name:"노말",ilvl:1640}]},
 {id:"kazeros1",name:"카제로스 1막 · 에기르",type:"raid",difficulties:[{id:"normal",name:"노말",ilvl:1660},{id:"hard",name:"하드",ilvl:1680}]},
 {id:"kazeros2",name:"카제로스 2막 · 아브렐슈드",type:"raid",difficulties:[{id:"normal",name:"노말",ilvl:1670},{id:"hard",name:"하드",ilvl:1690}]},
 {id:"kazeros3",name:"카제로스 3막 · 모르둠",type:"raid",difficulties:[{id:"normal",name:"노말",ilvl:1680},{id:"hard",name:"하드",ilvl:1700}]},
 {id:"kazeros4",name:"카제로스 4막 · 파멸의 성채",type:"raid",difficulties:[{id:"normal",name:"노말",ilvl:1700},{id:"hard",name:"하드",ilvl:1720}]},
 {id:"kazerosFinale",name:"카제로스 종막 · 최후의 날",type:"raid",difficulties:[{id:"normal",name:"노말",ilvl:1710},{id:"hard",name:"하드",ilvl:1730}]},
 {id:"serka",name:"그림자 레이드 · 세르카",type:"raid",difficulties:[{id:"normal",name:"노말",ilvl:1710},{id:"hard",name:"하드",ilvl:1730},{id:"nightmare",name:"나이트메어",ilvl:1740}]},
 {id:"horizon",name:"지평의 성당",type:"abyss",difficulties:[{id:"stage1",name:"1단계",ilvl:1700},{id:"stage2",name:"2단계",ilvl:1720},{id:"stage3",name:"3단계",ilvl:1750}]},
 {id:"velgardin",name:"그림자 레이드 · 벨가르딘",type:"raid",difficulties:[{id:"normal",name:"노말",ilvl:1750},{id:"hard",name:"하드",ilvl:1770},{id:"nightmare",name:"나이트메어",ilvl:1780}]}
];

function ensureV11AutoAssign(){
 if(!state.settings.autoAssign)state.settings.autoAssign={enabled:false,daily:[],weekly:[]};
 const a=state.settings.autoAssign;
 if(a.mode!=="preset"&&a.mode!=="level")a.mode="level";
 a.recommendedCount=Math.min(3,Math.max(1,Number(a.recommendedCount||3)));
 if(!Array.isArray(a.daily))a.daily=[];
 if(!Array.isArray(a.weekly))a.weekly=[];
}
function raidV11(id){return RAID_CATALOG_V11.find(r=>r.id===id)||null;}
function diffV11(raidId,difficultyId){return raidV11(raidId)?.difficulties.find(d=>d.id===difficultyId)||null;}
function raidTaskNameV11(raidId,difficultyId){const raid=raidV11(raidId),diff=diffV11(raidId,difficultyId);return raid&&diff?`${raid.name} · ${diff.name}`:"레이드";}
function raidOptionsV11(selected){return RAID_CATALOG_V11.map(r=>`<option value="${r.id}" ${r.id===selected?"selected":""}>${esc(r.name)}${r.type==="abyss"?" · 어비스":""}</option>`).join("");}
function difficultyOptionsV11(raidId,selected){const raid=raidV11(raidId)||RAID_CATALOG_V11[0];return raid.difficulties.map(d=>`<option value="${d.id}" ${d.id===selected?"selected":""}>${esc(d.name)} · Lv.${d.ilvl}</option>`).join("");}
function updateRaidRowV11(row,raidClass,diffClass){const raidSelect=row.querySelector(raidClass),diffSelect=row.querySelector(diffClass);if(!raidSelect||!diffSelect)return;const raid=raidV11(raidSelect.value)||RAID_CATALOG_V11[0],current=diffSelect.value;diffSelect.innerHTML=difficultyOptionsV11(raid.id,current);if(!diffV11(raid.id,diffSelect.value))diffSelect.value=raid.difficulties[0].id;}
function highestEligibleV11(raid,itemLevel){return [...raid.difficulties].filter(d=>d.ilvl<=itemLevel).sort((a,b)=>b.ilvl-a.ilvl)[0]||null;}
function recommendedRaidTemplatesV11(itemLevel,count){const candidates=[];RAID_CATALOG_V11.forEach((raid,index)=>{if(raid.type!=="raid")return;const diff=highestEligibleV11(raid,itemLevel);if(diff)candidates.push({raid,diff,index});});candidates.sort((a,b)=>b.diff.ilvl-a.diff.ilvl||b.index-a.index);return candidates.slice(0,count).map(x=>({name:raidTaskNameV11(x.raid.id,x.diff.id),note:`Lv.${x.diff.ilvl}+ 입장 가능 추천`,category:"레이드",gold:0,raidId:x.raid.id,difficultyId:x.diff.id,requiredIlvl:x.diff.ilvl}));}
function toggleAutoAssignModeV11(){const mode=document.getElementById("autoAssignMode")?.value||"level",panel=document.getElementById("autoPresetPanel"),count=document.getElementById("recommendedRaidCount"),help=document.getElementById("autoAssignModeHelp");if(panel)panel.style.display=mode==="preset"?"block":"none";if(count)count.disabled=mode!=="level";if(help)help.textContent=mode==="level"?"레벨별 추천은 해당 캐릭터가 입장 가능한 레이드 중 높은 구간을 우선 제안합니다.":"직접 지정 프리셋은 아래에서 고른 레이드와 난이도를 모든 신규 캐릭터에 동일하게 넣습니다.";}

openSettings=function(){
 ensureV11AutoAssign();
 document.getElementById("apiCharacter").value=state.settings.characterName||"";
 document.getElementById("rememberKey").checked=!!state.settings.rememberApiKey;
 document.getElementById("apiKey").value=localStorage.getItem(API_KEY_STORAGE)||localStorage.getItem(V8_API_KEY)||"";
 document.getElementById("syncMessage").innerHTML="";
 document.getElementById("autoAssignEnabled").checked=!!state.settings.autoAssign.enabled;
 document.getElementById("autoAssignMode").value=state.settings.autoAssign.mode;
 document.getElementById("recommendedRaidCount").value=String(state.settings.autoAssign.recommendedCount);
 renderAutoAssignEditors();toggleAutoAssignModeV11();openModal("settingsModal");
};

saveSettings=function(){
 ensureV11AutoAssign();
 state.settings.characterName=document.getElementById("apiCharacter").value.trim();
 state.settings.rememberApiKey=document.getElementById("rememberKey").checked;
 state.settings.autoAssign={enabled:document.getElementById("autoAssignEnabled").checked,mode:document.getElementById("autoAssignMode").value,recommendedCount:Math.min(3,Math.max(1,Number(document.getElementById("recommendedRaidCount").value||3))),daily:collectAutoDaily(),weekly:collectAutoWeekly()};
 const k=normalizeKey(document.getElementById("apiKey").value);
 if(state.settings.rememberApiKey&&k)localStorage.setItem(API_KEY_STORAGE,k);else{localStorage.removeItem(API_KEY_STORAGE);localStorage.removeItem(V8_API_KEY);}
 save();closeModal("settingsModal");toast("설정을 저장했습니다.");
};

autoWeeklyEdit=function(t){
 if(t.raidId&&raidV11(t.raidId)){
   const raid=raidV11(t.raidId),diff=diffV11(t.raidId,t.difficultyId)||raid.difficulties[0];
   return `<div class="edit-row auto-weekly-row" data-kind="raid"><div class="edit-main"><select class="select auto-raid-id" onchange="updateRaidRowV11(this.closest('.edit-row'),'.auto-raid-id','.auto-difficulty-id')">${raidOptionsV11(raid.id)}</select><input class="input auto-weekly-note" value="${esc(t.note||"")}" placeholder="메모 (선택)"></div><select class="select auto-difficulty-id">${difficultyOptionsV11(raid.id,diff.id)}</select><input class="input auto-weekly-gold" type="number" min="0" value="${Math.max(0,Number(t.gold||0))}" placeholder="골드"><button class="remove" type="button" onclick="this.closest('.edit-row').remove()">✕</button></div>`;
 }
 return `<div class="edit-row auto-weekly-row" data-kind="custom"><div class="edit-main"><input class="input auto-weekly-name" value="${esc(t.name||"")}" placeholder="주간 숙제 이름"><input class="input auto-weekly-note" value="${esc(t.note||"")}" placeholder="메모 (선택)"></div><select class="select auto-weekly-cat">${["레이드","낙원","주간","기타"].map(cat=>`<option ${cat===(t.category||"주간")?"selected":""}>${cat}</option>`).join("")}</select><input class="input auto-weekly-gold" type="number" min="0" value="${Math.max(0,Number(t.gold||0))}" placeholder="골드"><button class="remove" type="button" onclick="this.closest('.edit-row').remove()">✕</button></div>`;
};
renderAutoAssignEditors=function(){ensureV11AutoAssign();const a=state.settings.autoAssign;document.getElementById("autoDailyEditor").innerHTML=(a.daily||[]).map(autoDailyEdit).join("");document.getElementById("autoWeeklyEditor").innerHTML=(a.weekly||[]).map(autoWeeklyEdit).join("");};
collectAutoWeekly=function(){return [...document.querySelectorAll("#autoWeeklyEditor .auto-weekly-row")].map(r=>{if(r.dataset.kind==="raid"){const raidId=r.querySelector(".auto-raid-id").value,difficultyId=r.querySelector(".auto-difficulty-id").value,diff=diffV11(raidId,difficultyId);return {name:raidTaskNameV11(raidId,difficultyId),note:r.querySelector(".auto-weekly-note").value.trim(),category:"레이드",gold:Math.max(0,Number(r.querySelector(".auto-weekly-gold").value||0)),raidId,difficultyId,requiredIlvl:Number(diff?.ilvl||0)};}return {name:r.querySelector(".auto-weekly-name").value.trim(),note:r.querySelector(".auto-weekly-note").value.trim(),category:r.querySelector(".auto-weekly-cat").value,gold:Math.max(0,Number(r.querySelector(".auto-weekly-gold").value||0))};}).filter(t=>t.name);};
function addAutoRaidV11(){const raid=RAID_CATALOG_V11[RAID_CATALOG_V11.length-1],diff=raid.difficulties[0];document.getElementById("autoWeeklyEditor").insertAdjacentHTML("beforeend",autoWeeklyEdit({raidId:raid.id,difficultyId:diff.id,note:"",gold:0}));}

defaultTasksForNewCharacter=function(character){
 ensureV11AutoAssign();const a=state.settings.autoAssign;
 if(!a.enabled)return {dailyTasks:[],weeklyTasks:[]};
 const dailyTasks=(a.daily||[]).map(t=>({id:uid("daily"),name:t.name,target:Math.max(1,Number(t.target||1)),current:0}));
 const templates=a.mode==="preset"?(a.weekly||[]):recommendedRaidTemplatesV11(Number(character?.itemAvgLevel||0),a.recommendedCount);
 const weeklyTasks=templates.map(t=>({id:uid("weekly"),name:t.name,note:t.note||"",category:t.category||"레이드",gold:Math.max(0,Number(t.gold||0)),done:false,raidId:t.raidId||null,difficultyId:t.difficultyId||null,requiredIlvl:Number(t.requiredIlvl||0)}));
 return {dailyTasks,weeklyTasks};
};

confirmAdd=function(){
 ensureV11AutoAssign();const selected=[...document.querySelectorAll(".candidate-check:checked")],existing=new Set(state.activeCharacters.map(c=>c.key));let count=0;
 selected.forEach(box=>{const c=state.apiRoster.characters.find(x=>keyOf(x)===box.value);if(!c||existing.has(box.value))return;const defaults=defaultTasksForNewCharacter(c);state.activeCharacters.push({key:box.value,serverName:c.serverName,characterName:c.characterName,characterLevel:c.characterLevel,characterClassName:c.characterClassName,itemAvgLevel:c.itemAvgLevel,itemAvgLevelText:c.itemAvgLevelText,profile:c.profile,favorite:false,dailyTasks:defaults.dailyTasks,weeklyTasks:defaults.weeklyTasks});existing.add(box.value);count++;});
 save();closeModal("addModal");render();toast(state.settings.autoAssign.enabled?`${count}명 추가 · 숙제 자동 할당 완료`:`${count}명 추가했습니다.`);
};

weeklyEdit=function(t){
 if(t.raidId&&raidV11(t.raidId)){
   const raid=raidV11(t.raidId),diff=diffV11(t.raidId,t.difficultyId)||raid.difficulties[0];
   return `<div class="edit-row weekly-row" data-kind="raid" data-id="${esc(t.id)}" data-done="${t.done?"1":"0"}"><div class="edit-main"><select class="select raid-id" onchange="updateRaidRowV11(this.closest('.edit-row'),'.raid-id','.difficulty-id')">${raidOptionsV11(raid.id)}</select><input class="input task-note" value="${esc(t.note||"")}" placeholder="메모 (선택)"></div><select class="select difficulty-id">${difficultyOptionsV11(raid.id,diff.id)}</select><input class="input gold-input" type="number" min="0" value="${Number(t.gold||0)}" placeholder="골드"><button class="remove" onclick="this.closest('.edit-row').remove()">✕</button></div>`;
 }
 return `<div class="edit-row weekly-row" data-kind="custom" data-id="${esc(t.id)}" data-done="${t.done?"1":"0"}"><div class="edit-main"><input class="input task-name" value="${esc(t.name)}" placeholder="주간 숙제 이름"><input class="input task-note" value="${esc(t.note||"")}" placeholder="메모 (선택)"></div><select class="select task-cat">${["레이드","낙원","주간","기타"].map(cat=>`<option ${cat===t.category?"selected":""}>${cat}</option>`).join("")}</select><input class="input gold-input" type="number" min="0" value="${Number(t.gold||0)}" placeholder="골드"><button class="remove" onclick="this.closest('.edit-row').remove()">✕</button></div>`;
};
function addRaidTaskV11(){const raid=RAID_CATALOG_V11[RAID_CATALOG_V11.length-1],diff=raid.difficulties[0];document.getElementById("weeklyEditor").insertAdjacentHTML("beforeend",weeklyEdit({id:uid("weekly"),name:raidTaskNameV11(raid.id,diff.id),note:"",category:"레이드",gold:0,done:false,raidId:raid.id,difficultyId:diff.id,requiredIlvl:diff.ilvl}));}
function recommendCurrentRaidsV11(){const ck=document.getElementById("taskCharacterKey").value,c=state.activeCharacters.find(x=>x.key===ck);if(!c)return;ensureV11AutoAssign();const count=state.settings.autoAssign.recommendedCount||3,templates=recommendedRaidTemplatesV11(Number(c.itemAvgLevel||0),count);if(!templates.length){toast("현재 레벨에서 추천할 레이드를 찾지 못했습니다.");return;}if(document.querySelectorAll("#weeklyEditor .edit-row").length&&!confirm("현재 주간 숙제 편집 내용을 레벨 기준 추천으로 교체할까요?"))return;document.getElementById("weeklyEditor").innerHTML=templates.map(t=>weeklyEdit({id:uid("weekly"),...t,done:false})).join("");toast(`Lv.${c.itemAvgLevelText} 기준 ${templates.length}개를 추천했습니다.`);}

saveTasks=function(){
 const ck=document.getElementById("taskCharacterKey").value,c=state.activeCharacters.find(x=>x.key===ck);if(!c)return;
 c.dailyTasks=[...document.querySelectorAll("#dailyEditor .edit-row")].map(r=>({id:r.dataset.id||uid("daily"),name:r.querySelector(".task-name").value.trim(),target:Math.max(1,Number(r.querySelector(".target-input").value||1)),current:Math.max(0,Number(r.dataset.current||0))})).filter(t=>t.name);
 c.weeklyTasks=[...document.querySelectorAll("#weeklyEditor .weekly-row")].map(r=>{if(r.dataset.kind==="raid"){const raidId=r.querySelector(".raid-id").value,difficultyId=r.querySelector(".difficulty-id").value,diff=diffV11(raidId,difficultyId);return {id:r.dataset.id||uid("weekly"),name:raidTaskNameV11(raidId,difficultyId),note:r.querySelector(".task-note").value.trim(),category:"레이드",gold:Math.max(0,Number(r.querySelector(".gold-input").value||0)),done:r.dataset.done==="1",raidId,difficultyId,requiredIlvl:Number(diff?.ilvl||0)};}return {id:r.dataset.id||uid("weekly"),name:r.querySelector(".task-name").value.trim(),note:r.querySelector(".task-note").value.trim(),category:r.querySelector(".task-cat").value,gold:Math.max(0,Number(r.querySelector(".gold-input").value||0)),done:r.dataset.done==="1"};}).filter(t=>t.name);
 save();closeModal("taskModal");render();toast("숙제 구성을 저장했습니다.");
};

ensureV11AutoAssign();
document.getElementById("settings").onclick=openSettings;
document.getElementById("syncTop").onclick=openSettings;
document.getElementById("saveSettings").onclick=saveSettings;
document.getElementById("confirmAdd").onclick=confirmAdd;
document.getElementById("saveTasks").onclick=saveTasks;
document.getElementById("autoAssignMode").onchange=toggleAutoAssignModeV11;
document.getElementById("addAutoRaid").onclick=addAutoRaidV11;
document.getElementById("addRaidTask").onclick=addRaidTaskV11;
document.getElementById("recommendCurrentRaids").onclick=recommendCurrentRaidsV11;
render();