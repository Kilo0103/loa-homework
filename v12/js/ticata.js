const KEY='loa-homework:ticata-stats-v2';
const modal=document.getElementById('ticataModal');
const playerBoardEl=document.getElementById('playerBoard');
const botBoardEl=document.getElementById('botBoard');
const statusEl=document.getElementById('ticataStatus');
const statEl=document.getElementById('ticataStats');
const playerDiceCube=document.getElementById('playerDiceCube');
const botDiceCube=document.getElementById('botDiceCube');
const playerDicePanel=document.getElementById('playerDicePanel');
const botDicePanel=document.getElementById('botDicePanel');
const playerDieType=document.getElementById('playerDieType');
const botDieType=document.getElementById('botDieType');
const hintEl=document.getElementById('gameHint');
const rollBtn=document.getElementById('rollBtn');
const rerollBtn=document.getElementById('rerollBtn');
const rerollChoice=document.getElementById('rerollChoice');
const playerTotalEl=document.getElementById('playerTotal');
const botTotalEl=document.getElementById('botTotal');
const matchBadge=document.getElementById('matchBadge');
const opponentNameEl=document.getElementById('opponentName');
const opponentLevelEl=document.getElementById('opponentLevel');
const matchOverlay=document.getElementById('matchOverlay');
const matchOverlayTitle=document.getElementById('matchOverlayTitle');
const matchOverlaySub=document.getElementById('matchOverlaySub');
const resultOverlay=document.getElementById('resultOverlay');
const resultCard=document.getElementById('resultCard');
const resultTitle=document.getElementById('resultTitle');
const resultReason=document.getElementById('resultReason');
const resultOpponent=document.getElementById('resultOpponent');
const resultFields=document.getElementById('resultFields');
const resultTiebreak=document.getElementById('resultTiebreak');
const resultTotalScore=document.getElementById('resultTotalScore');
const mobileWidthQuery=window.matchMedia('(max-width: 820px)');
const coarsePointerQuery=window.matchMedia('(pointer: coarse)');

function browserReportsMobile(){
  const ua=navigator.userAgent||'';
  const uaLooksMobile=/Android|iPhone|iPod|Mobile|IEMobile|Opera Mini/i.test(ua);
  if(navigator.userAgentData&&navigator.userAgentData.mobile===true)return true;
  return uaLooksMobile;
}
function phoneSizedScreen(){
  const sw=window.screen?.width||window.innerWidth;
  const sh=window.screen?.height||window.innerHeight;
  return Math.min(sw,sh)<=600;
}
function likelyDesktopSiteMode(){
  const wideDesktopViewport=window.innerWidth>=900;
  const uaLooksDesktop=!browserReportsMobile();
  return coarsePointerQuery.matches&&phoneSizedScreen()&&wideDesktopViewport&&uaLooksDesktop;
}
function useMobileGameLayout(){
  // A genuinely narrow viewport is always the mobile game UI, even if
  // UA Client Hints are missing or misleading in an in-app/Samsung browser.
  if(window.innerWidth<=820)return true;
  if(likelyDesktopSiteMode())return false;
  if(browserReportsMobile()&&phoneSizedScreen())return true;
  return false;
}
function syncMobileViewportHeight(){
  const height=Math.round(window.visualViewport?.height||window.innerHeight);
  modal.style.setProperty('--ticata-vh',`${height}px`);
  modal.dataset.viewportHeight=String(height);
}
function syncMobileGameLayout(){
  const mobile=useMobileGameLayout();
  modal.classList.toggle('mobile-game',mobile);
  modal.dataset.layout=mobile?'mobile':'desktop';
  modal.dataset.viewport=String(window.innerWidth);
  syncMobileViewportHeight();
}
if(mobileWidthQuery.addEventListener){
  mobileWidthQuery.addEventListener('change',syncMobileGameLayout);
  coarsePointerQuery.addEventListener('change',syncMobileGameLayout);
}else{
  mobileWidthQuery.addListener(syncMobileGameLayout);
  coarsePointerQuery.addListener(syncMobileGameLayout);
}
window.addEventListener('resize',syncMobileGameLayout,{passive:true});
if(window.visualViewport){
  window.visualViewport.addEventListener('resize',syncMobileViewportHeight,{passive:true});
}
syncMobileGameLayout();

const CARD_OPPONENTS=[
  {name:'키에사',grade:'일반',ai:'normal-card'},
  {name:'투란',grade:'일반',ai:'normal-card'},
  {name:'킬리언',grade:'고급',ai:'uncommon-card'},
  {name:'호동',grade:'고급',ai:'uncommon-card'},
  {name:'아그리스',grade:'고급',ai:'uncommon-card'},
  {name:'칼라도세',grade:'희귀',ai:'rare-card'},
  {name:'혼재의 추오',grade:'희귀',ai:'rare-card'},
  {name:'타르실라',grade:'희귀',ai:'rare-card'},
  {name:'시그나투스',grade:'희귀',ai:'rare-card'},
  {name:'자크라',grade:'희귀',ai:'rare-card'},
  {name:'아르카디아',grade:'영웅',ai:'epic-card'},
  {name:'아슈타로테',grade:'영웅',ai:'epic-card'},
  {name:'라우리엘',grade:'영웅',ai:'epic-card'},
  {name:'모르페',grade:'영웅',ai:'epic-card'},
  {name:'실리안',grade:'전설',ai:'legendary-card'},
  {name:'니나브',grade:'전설',ai:'legendary-card'},
  {name:'아만',grade:'전설',ai:'legendary-card'},
  {name:'웨이',grade:'전설',ai:'legendary-card'},
  {name:'카단',grade:'전설',ai:'legendary-card'},
  {name:'카마인',grade:'전설',ai:'legendary-card'},
  {name:'카멘',grade:'전설',ai:'legendary-card'},
  {name:'샨디',grade:'전설',ai:'legendary-card'},
  {name:'베아트리스',grade:'전설',ai:'legendary-card'}
];
const CARD_GRADES=['일반','고급','희귀','영웅','전설'];
const GRADE_ORDER={일반:0,고급:1,희귀:2,영웅:3,전설:4};
const GRADE_CLASS={일반:'normal',고급:'uncommon',희귀:'rare',영웅:'epic',전설:'legendary'};

let dieAnimating=false;
let lastFlick=null;
let matchTimer=null;
let matchReadyTimer=null;

const state={
  board:{player:[[],[],[]],bot:[[],[],[]]},
  turn:'player',
  phase:'matching',
  current:null,
  pendingType:'normal',
  opening:true,
  reroll:{player:true,bot:true},
  difficulty:'rare-card',
  opponentGrade:'희귀',
  opponentName:'BOT',
  alt:null,
  over:false,
  thinking:false
};

function stats(){
  try{return {...{win:0,draw:0,lose:0},...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return {win:0,draw:0,lose:0}}
}
function saveStats(s){localStorage.setItem(KEY,JSON.stringify(s));renderStats();}
function renderStats(){const s=stats();statEl.textContent=`승 ${s.win} · 무 ${s.draw} · 패 ${s.lose}`;}
function roll(){return 1+Math.floor(Math.random()*6);}
function other(side){return side==='player'?'bot':'player';}
function boardFull(side){return state.board[side].every(line=>line.length>=3);}
function bothFull(){return boardFull('player')&&boardFull('bot');}
function pairBonus(line){
  const counts=new Map();
  line.forEach(d=>counts.set(d.value,(counts.get(d.value)||0)+1));
  let bonus=0;
  for(const [value,count] of counts)bonus+=value*(count*(count-1)/2);
  return bonus;
}
function lineScore(line){return line.reduce((s,d)=>s+d.value,0)+pairBonus(line);}
function totalScore(side){return state.board[side].reduce((s,line)=>s+lineScore(line),0);}
function fieldResults(){
  return [0,1,2].map(i=>{
    const player=lineScore(state.board.player[i]);
    const bot=lineScore(state.board.bot[i]);
    return {index:i,player,bot,result:player>bot?'win':bot>player?'lose':'draw'};
  });
}
function evaluateMatch(){
  const fields=fieldResults();
  const p=fields.filter(f=>f.result==='win').length;
  const b=fields.filter(f=>f.result==='lose').length;
  const d=fields.filter(f=>f.result==='draw').length;
  const pt=fields.reduce((s,f)=>s+f.player,0);
  const bt=fields.reduce((s,f)=>s+f.bot,0);
  let result='draw',tiebreak=false;

  if(p>b)result='win';
  else if(b>p)result='lose';
  else{
    tiebreak=true;
    if(pt>bt)result='win';
    else if(bt>pt)result='lose';
  }
  return {fields,p,b,d,pt,bt,result,tiebreak};
}
function dieHtml(d){
  if(!d)return '<span class="slot-empty">·</span>';
  return `<span class="board-die ${d.shield?'shield':''}" title="${d.shield?'실드':'일반'} ${d.value}">${d.shield?'<i>◆</i>':''}<b>${d.value}</b></span>`;
}
function renderBoard(side,root){
  root.innerHTML=state.board[side].map((line,i)=>{
    const score=lineScore(line);
    const rival=lineScore(state.board[other(side)][i]);
    const lead=score>rival?'ahead':score<rival?'behind':'tied';
    const slots=[...line];
    if(side==='player'){
      while(slots.length<3)slots.unshift(null);
    }else{
      while(slots.length<3)slots.push(null);
    }
    const can=canPlace(side,i);
    const flicked=lastFlick&&lastFlick.line===i&&(lastFlick.side===side||lastFlick.attacker===side);
    return `<button class="tika-line ${lead} ${can?'placeable':''} ${flicked?'flicked':''}" data-game-place data-side="${side}" data-line="${i}" ${can?'':'disabled'}>
      <span class="line-no">${i+1}줄</span>
      <span class="dice-row">${slots.map(d=>dieHtml(d)).join('')}</span>
      <span class="line-score">${score}</span>
    </button>`;
  }).join('');
}
function canPlace(targetSide,line){
  if(state.over||state.turn!=='player'||state.phase!=='place'||!state.current||state.thinking||dieAnimating)return false;
  if(state.board[targetSide][line].length>=3)return false;
  if(state.current.shield){
    if(state.current.opening&&targetSide!=='player')return false;
    return true;
  }
  return targetSide==='player';
}
function dieClass(die,extra=''){
  return `dice-cube face-${die?.value||1} ${die?.shield?'shield':''} ${extra}`.trim();
}
function animateDie(side,die,done){
  const cube=side==='player'?playerDiceCube:botDiceCube;
  const panel=side==='player'?playerDicePanel:botDicePanel;
  dieAnimating=true;
  panel.classList.add('active','rolling-owner');
  cube.className=`dice-cube rolling ${die.shield?'shield':''}`;
  setTimeout(()=>{
    cube.className=dieClass(die,'landed');
    dieAnimating=false;
    panel.classList.remove('rolling-owner');
    renderBoard('player',playerBoardEl);
    renderBoard('bot',botBoardEl);
    setTimeout(()=>cube.classList.remove('landed'),220);
    done?.();
  },720);
}
function currentTypeLabel(){
  if(!state.current)return '대기';
  if(state.current.shield)return state.current.bonus?'보너스 실드':'실드 주사위';
  return '일반 주사위';
}
function renderControls(){
  const myTurn=state.turn==='player'&&!state.over;
  playerDicePanel.classList.toggle('active',myTurn);
  botDicePanel.classList.toggle('active',state.turn==='bot'&&!state.over);
  playerDicePanel.classList.toggle('inactive',!myTurn);
  botDicePanel.classList.toggle('inactive',state.turn!=='bot'||state.over);

  playerDieType.textContent=state.turn==='player'?currentTypeLabel():'대기';
  botDieType.textContent=state.turn==='bot'?currentTypeLabel():'대기';

  const canRoll=myTurn&&state.phase==='await-roll'&&!dieAnimating;
  rollBtn.hidden=!canRoll;
  if(canRoll){
    rollBtn.textContent=state.pendingType==='bonus-shield'?'보너스 실드 굴리기':state.pendingType==='opening-shield'?'첫 실드 주사위 굴리기':'주사위 굴리기';
  }

  rerollBtn.hidden=!(myTurn&&state.phase==='place'&&state.current&&!state.current.bonus&&state.reroll.player&&!dieAnimating);
  rerollChoice.hidden=state.alt===null;
}
function render(){
  renderBoard('player',playerBoardEl);
  renderBoard('bot',botBoardEl);
  playerTotalEl.textContent=`${totalScore('player')}점`;
  botTotalEl.textContent=`${totalScore('bot')}점`;
  renderControls();
}
function showMatchOverlay(title,sub,matched=false){
  matchOverlay.classList.add('show');
  matchOverlay.classList.toggle('matched',matched);
  matchOverlayTitle.textContent=title;
  matchOverlaySub.textContent=sub;
}
function hideMatchOverlay(){matchOverlay.classList.remove('show','matched');}
function hideResultOverlay(){resultOverlay.classList.remove('show');resultCard.classList.remove('win','lose','draw');}
function showResultOverlay(match){
  resultTitle.textContent=match.result==='win'?'승리':match.result==='lose'?'패배':'무승부';
  resultOpponent.textContent=`${state.opponentName} · ${state.opponentGrade} 카드`;
  resultReason.textContent=match.tiebreak
    ? `${match.p}승 ${match.d}무 ${match.b}패 · 필드 승수 동률`
    : `${match.p} : ${match.b} 필드 ${match.result==='win'?'승리':'패배'}`;

  resultFields.innerHTML=match.fields.map(f=>{
    const label=f.result==='win'?'승':f.result==='lose'?'패':'무';
    return `<div class="result-field ${f.result}">
      <span>${f.index+1}필드</span>
      <b>${f.player}</b>
      <em>:</em>
      <b>${f.bot}</b>
      <strong>${label}</strong>
    </div>`;
  }).join('');

  resultTiebreak.hidden=!match.tiebreak;
  resultTotalScore.textContent=`${match.pt} : ${match.bt}`;
  resultCard.classList.remove('win','lose','draw');
  resultCard.classList.add(match.result);
  resultOverlay.classList.add('show');
}
function clearMatchTimers(){
  if(matchTimer)clearTimeout(matchTimer);
  if(matchReadyTimer)clearTimeout(matchReadyTimer);
  matchTimer=null;matchReadyTimer=null;
}
function newMatch(){
  clearMatchTimers();
  hideResultOverlay();
  state.phase='matching';
  state.over=false;
  state.current=null;
  state.alt=null;
  state.thinking=false;
  state.board={player:[[],[],[]],bot:[[],[],[]]};
  state.reroll={player:true,bot:true};
  statusEl.textContent='상대 찾는 중...';
  hintEl.textContent='티카투카 매칭을 검색하고 있습니다.';
  opponentNameEl.textContent='상대 찾는 중';
  opponentLevelEl.textContent='MATCHMAKING';
  matchBadge.className='match-badge';
  playerDiceCube.className='dice-cube face-1 idle';
  botDiceCube.className='dice-cube face-1 idle';
  render();
  showMatchOverlay('상대 찾는 중...','잠시만 기다려 주세요.');
  const wait=700+Math.floor(Math.random()*650);
  matchTimer=setTimeout(()=>{
    const grade=CARD_GRADES[Math.floor(Math.random()*CARD_GRADES.length)];
    const gradePool=CARD_OPPONENTS.filter(card=>card.grade===grade);
    const opponent=gradePool[Math.floor(Math.random()*gradePool.length)];
    state.difficulty=opponent.ai;
    state.opponentGrade=opponent.grade;
    state.opponentName=opponent.name;
    opponentNameEl.textContent=opponent.name;
    opponentLevelEl.textContent=opponent.grade;
    matchBadge.className=`match-badge found grade-${GRADE_CLASS[opponent.grade]}`;
    statusEl.textContent='MATCH FOUND';
    showMatchOverlay('MATCH FOUND',`${opponent.name} · ${opponent.grade} 카드`,true);
    matchReadyTimer=setTimeout(()=>{
      hideMatchOverlay();
      startRound();
    },650);
  },wait);
}
function startRound(){
  state.board={player:[[],[],[]],bot:[[],[],[]]};
  state.turn='player';
  state.phase='await-roll';
  state.pendingType='opening-shield';
  state.current=null;
  state.opening=true;
  state.reroll={player:true,bot:true};
  state.alt=null;
  state.over=false;
  state.thinking=false;
  statusEl.textContent='내 차례';
  hintEl.textContent='먼저 첫 실드 주사위를 굴리세요.';
  render();
}
function createDie(type){
  return {
    value:roll(),
    shield:type==='opening-shield'||type==='bonus-shield',
    opening:type==='opening-shield',
    bonus:type==='bonus-shield'
  };
}
function playerRoll(){
  if(state.turn!=='player'||state.phase!=='await-roll'||state.over||dieAnimating)return;
  state.current=createDie(state.pendingType);
  state.phase='rolling';
  hintEl.textContent='주사위를 굴리는 중...';
  renderControls();
  animateDie('player',state.current,()=>{
    state.phase='place';
    statusEl.textContent='내 차례';
    hintEl.textContent=state.current.shield?(state.current.bonus?'보너스 실드를 배치하세요.':'실드 주사위를 내 보드에 배치하세요.'):'내 보드의 원하는 줄을 선택하세요.';
    render();
  });
}
function resolveFlick(attacker,line,value){
  const target=other(attacker);
  const targetBefore=state.board[target][line].length;
  const attackerBefore=state.board[attacker][line].length;
  state.board[target][line]=state.board[target][line].filter(d=>d.shield||d.value!==value);
  const targetRemoved=targetBefore-state.board[target][line].length;
  if(targetRemoved<=0)return {targetRemoved:0,attackerRemoved:0};

  state.board[attacker][line]=state.board[attacker][line].filter(d=>d.shield||d.value!==value);
  const attackerRemoved=attackerBefore-state.board[attacker][line].length;

  lastFlick={side:target,attacker,line};
  setTimeout(()=>{lastFlick=null;render();},420);
  return {targetRemoved,attackerRemoved};
}
function clearSpentDie(side){
  const cube=side==='player'?playerDiceCube:botDiceCube;
  const label=side==='player'?playerDieType:botDieType;
  cube.className='dice-cube face-1 idle spent';
  label.textContent='사용됨';
}
function place(side,targetSide,line){
  if(state.board[targetSide][line].length>=3)return false;
  const d={...state.current};
  state.board[targetSide][line].push(d);
  if(d.shield){
    if(d.opening)state.opening=false;
    state.current=null;
    state.alt=null;
    endTurn();
    return true;
  }
  const flick=resolveFlick(side,line,d.value);
  if(flick.targetRemoved>0){
    state.current=null;
    state.alt=null;
    state.pendingType='bonus-shield';
    clearSpentDie(side);
    if(side==='player'){
      state.phase='await-roll';
      statusEl.textContent=`알까기! 상대 ${flick.targetRemoved} · 내 ${flick.attackerRemoved} 제거`;
      hintEl.textContent='보너스 실드 주사위를 직접 굴리세요.';
      render();
    }else{
      state.phase='bot-wait';
      statusEl.textContent=`${state.opponentName} 알까기 · 상대 ${flick.targetRemoved} · 자기 ${flick.attackerRemoved} 제거`;
      hintEl.textContent='상대가 보너스 실드 주사위를 굴립니다.';
      render();
      setTimeout(botRoll,500);
    }
    return true;
  }
  state.current=null;
  state.alt=null;
  endTurn();
  return true;
}
function skipIfFull(){
  if(bothFull()){finish();return true;}
  if(boardFull(state.turn)){
    state.turn=other(state.turn);
    if(bothFull()){finish();return true;}
    return skipIfFull();
  }
  return false;
}
function beginTurn(){
  if(skipIfFull())return;
  state.alt=null;
  state.current=null;
  state.pendingType='normal';
  if(state.turn==='player'){
    state.phase='await-roll';
    state.thinking=false;
    statusEl.textContent='내 차례';
    hintEl.textContent='주사위 굴리기를 눌러 주세요.';
    render();
  }else{
    state.phase='bot-wait';
    state.thinking=true;
    statusEl.textContent=`${state.opponentName} 차례`;
    hintEl.textContent='상대가 주사위를 굴릴 준비를 합니다.';
    render();
    setTimeout(botRoll,500);
  }
}
function endTurn(){
  if(bothFull()){finish();return;}
  state.turn=other(state.turn);
  beginTurn();
}
function legalOwnLines(side){return [0,1,2].filter(i=>state.board[side][i].length<3);}
function legalShieldTargets(){
  const a=[];
  for(const side of ['player','bot'])for(let i=0;i<3;i++)if(state.board[side][i].length<3)a.push({side,line:i});
  return a;
}
function cloneLine(line){return line.map(d=>({...d}));}
function previewNormal(line,value){
  const own=cloneLine(state.board.bot[line]);
  const player=cloneLine(state.board.player[line]);
  const beforeOwn=lineScore(own),beforePlayer=lineScore(player);
  own.push({value,shield:false});
  const removed=player.filter(d=>!d.shield&&d.value===value).length;
  if(removed>0){
    const afterOwn=own.filter(d=>d.shield||d.value!==value);
    const afterPlayer=player.filter(d=>d.shield||d.value!==value);
    return {line,removed,beforeOwn,beforePlayer,afterOwn:lineScore(afterOwn),afterPlayer:lineScore(afterPlayer)};
  }
  return {line,removed:0,beforeOwn,beforePlayer,afterOwn:lineScore(own),afterPlayer:beforePlayer};
}
function fieldLead(botScore,playerScore){
  return botScore>playerScore?1:botScore<playerScore?-1:0;
}
function currentFieldWins(){
  let bot=0,player=0;
  for(let i=0;i<3;i++){
    const lead=fieldLead(lineScore(state.board.bot[i]),lineScore(state.board.player[i]));
    if(lead>0)bot++;
    else if(lead<0)player++;
  }
  return {bot,player};
}
function strategicFieldBonus(line,p,grade){
  if(grade<3)return 0;
  const before=fieldLead(p.beforeOwn,p.beforePlayer);
  const after=fieldLead(p.afterOwn,p.afterPlayer);
  const wins=currentFieldWins();
  let bonus=0;

  // Flipping a field matters much more than adding raw score.
  if(before<0&&after>0)bonus+=grade===4?34:26;
  else if(before===0&&after>0)bonus+=grade===4?22:16;
  else if(before<0&&after===0)bonus+=grade===4?12:8;

  // Prioritize the second field needed for match control.
  const botWinsAfter=wins.bot+(before<=0&&after>0?1:0)-(before>0&&after<=0?1:0);
  const playerWinsAfter=wins.player+(before>=0&&after<0?1:0)-(before<0&&after>=0?1:0);
  if(botWinsAfter>=2&&wins.bot<2)bonus+=grade===4?42:30;
  if(wins.player>=2&&playerWinsAfter<wins.player)bonus+=grade===4?38:27;

  // Do not waste strong dice on a field already comfortably ahead.
  const leadMargin=p.beforeOwn-p.beforePlayer;
  if(before>0&&leadMargin>=8&&p.removed===0)bonus-=grade===4?15:10;

  // Breaking a developed opponent field is especially valuable.
  if(p.removed>0){
    const playerDice=state.board.player[line].filter(d=>!d.shield).length;
    bonus+=p.removed*(grade===4?8:5);
    if(playerDice>=2)bonus+=grade===4?14:9;
  }
  return bonus;
}
function normalPlacementValue(value,line){
  const p=previewNormal(line,value);
  const comboCount=state.board.bot[line].filter(d=>d.value===value).length;
  const swing=(p.afterOwn-p.beforeOwn)+(p.beforePlayer-p.afterPlayer);
  const grade=GRADE_ORDER[state.opponentGrade]??2;
  let score=swing*2+comboCount*5+p.removed*11;
  if(p.beforeOwn<=p.beforePlayer&&p.afterOwn>p.afterPlayer)score+=12;
  if(p.beforeOwn>p.beforePlayer&&p.afterOwn>=p.afterPlayer)score+=3;
  if(state.board.bot[line].length===2&&p.removed===0)score-=grade>=3?5:2;
  if(p.removed>0&&p.beforePlayer>=12)score+=grade>=3?8:4;
  score+=strategicFieldBonus(line,p,grade);
  return score;
}
function rankedBotLines(value){
  return legalOwnLines('bot').map(line=>({line,score:normalPlacementValue(value,line)})).sort((a,b)=>b.score-a.score||Math.random()-.5);
}
function botChooseLine(value){
  const ranked=rankedBotLines(value);
  if(!ranked.length)return -1;
  const grade=GRADE_ORDER[state.opponentGrade]??2;
  if(grade===0)return ranked[Math.floor(Math.random()*ranked.length)].line;
  if(grade===1){
    if(ranked.length>1&&Math.random()<0.48)return ranked[1].line;
    return ranked[0].line;
  }
  if(grade===2){
    if(ranked.length>1&&Math.random()<0.18)return ranked[1].line;
    return ranked[0].line;
  }
  if(grade===3){
    if(ranked.length>1&&Math.random()<0.025)return ranked[1].line;
    return ranked[0].line;
  }
  return ranked[0].line;
}
function bestNormalValue(value){
  const ranked=rankedBotLines(value);
  return ranked.length?ranked[0].score:-999;
}
function botShouldReroll(){
  if(!state.reroll.bot||!state.current||state.current.bonus)return false;
  const currentValue=state.current.value;
  const currentScore=bestNormalValue(currentValue);
  const grade=GRADE_ORDER[state.opponentGrade]??2;
  if(grade<=1)return false;
  const alt=roll();
  const altScore=bestNormalValue(alt);
  let use=false;
  if(grade===2){
    const flick=legalOwnLines('bot').some(i=>state.board.player[i].some(d=>!d.shield&&d.value===currentValue));
    use=!flick&&currentValue<=2&&(alt>=4||altScore>currentScore+4);
  }else if(grade===3){
    const hasFlick=legalOwnLines('bot').some(i=>state.board.player[i].some(d=>!d.shield&&d.value===currentValue));
    use=!hasFlick&&(altScore>currentScore+2||(currentValue<=3&&altScore>currentScore));
  }else{
    const hasFlick=legalOwnLines('bot').some(i=>state.board.player[i].some(d=>!d.shield&&d.value===currentValue));
    use=!hasFlick&&(altScore>currentScore||(currentValue<=3&&altScore>=currentScore));
  }
  if(!use)return false;
  state.reroll.bot=false;
  const old=currentValue;
  if(altScore>=currentScore)state.current.value=alt;
  statusEl.textContent=`${state.opponentName} 리롤 · ${old} → ${alt}`;
  hintEl.textContent='상대가 리롤 결과를 선택했습니다.';
  animateDie('bot',state.current,()=>setTimeout(botAct,250));
  return true;
}
function shieldTargetValue(t,value){
  const line=state.board[t.side][t.line];
  const grade=GRADE_ORDER[state.opponentGrade]??2;
  const wins=currentFieldWins();

  if(t.side==='bot'){
    const before=lineScore(line);
    const after=lineScore([...line,{value,shield:true}]);
    const combo=line.filter(d=>d.value===value).length;
    const rival=lineScore(state.board.player[t.line]);
    let score=(after-before)*2+combo*5;
    if(before<=rival&&after>rival)score+=grade===4?28:grade===3?20:10;
    if(line.length===2)score+=grade>=3?7:2;
    if(grade>=3&&wins.bot===1&&before<=rival&&after>rival)score+=grade===4?30:20;
    if(grade>=3&&before-rival>=8)score-=grade===4?12:8;
    return score;
  }

  const before=lineScore(line);
  const after=lineScore([...line,{value,shield:true}]);
  const helpsCombo=line.some(d=>d.value===value);
  const lock=line.length===2?18:line.length===1?8:3;
  let score=lock-(after-before)*.8+(value<=3?8:0)-(helpsCombo?14:0);
  const botScore=lineScore(state.board.bot[t.line]);
  if(before>botScore&&line.length===2)score+=7;

  if(grade>=3){
    // A low-value shield on the opponent can poison a nearly-complete field.
    if(line.length===2)score+=grade===4?18:12;
    if(before>botScore&&wins.player>=1)score+=grade===4?16:10;
    if(value<=2)score+=grade===4?8:5;
    if(helpsCombo)score-=grade===4?10:6;
  }
  return score;
}
function botChooseShieldTarget(){
  const targets=legalShieldTargets();
  if(!targets.length)return null;
  const grade=GRADE_ORDER[state.opponentGrade]??2;
  if(grade===0)return targets[Math.floor(Math.random()*targets.length)];
  const value=state.current.value;
  if(grade===1){
    const preferred=targets.filter(x=>value<=2?x.side==='player':x.side==='bot');
    const pool=preferred.length?preferred:targets;
    return pool[Math.floor(Math.random()*pool.length)];
  }
  if(grade===2){
    const preferred=targets.filter(x=>value<=3?x.side==='player':x.side==='bot');
    const pool=preferred.length?preferred:targets;
    return pool.sort((a,b)=>shieldTargetValue(b,value)-shieldTargetValue(a,value))[0];
  }
  return targets.sort((a,b)=>shieldTargetValue(b,value)-shieldTargetValue(a,value))[0];
}
function botPlaceShield(){
  const t=botChooseShieldTarget();
  if(!t){state.current=null;state.thinking=false;endTurn();return;}
  state.board[t.side][t.line].push({...state.current});
  statusEl.textContent=t.side==='player'?`${state.opponentName} 실드 방해`:`${state.opponentName} 실드 강화`;
  state.current=null;
  state.thinking=false;
  endTurn();
}
function botRoll(){
  if(state.turn!=='bot'||state.over)return;
  state.current=createDie(state.pendingType);
  state.phase='rolling';
  hintEl.textContent='상대 주사위가 굴러갑니다.';
  renderControls();
  animateDie('bot',state.current,()=>{
    if(state.current?.bonus){
      state.phase='bot-place';
      setTimeout(botPlaceShield,260);
    }else{
      state.phase='bot-place';
      setTimeout(botAct,260);
    }
  });
}
function botAct(){
  if(state.over||state.turn!=='bot'||!state.current)return;
  if(botShouldReroll())return;
  const line=botChooseLine(state.current.value);
  if(line<0){state.current=null;state.thinking=false;endTurn();return;}
  state.board.bot[line].push({...state.current});
  const flick=resolveFlick('bot',line,state.current.value);
  if(flick.targetRemoved>0){
    state.current=null;
    state.pendingType='bonus-shield';
    clearSpentDie('bot');
    state.phase='bot-wait';
    statusEl.textContent=`${state.opponentName} 알까기 · 상대 ${flick.targetRemoved} · 자기 ${flick.attackerRemoved} 제거`;
    hintEl.textContent='상대가 보너스 실드 주사위를 굴립니다.';
    render();
    setTimeout(botRoll,500);
  }else{
    state.current=null;
    state.thinking=false;
    endTurn();
  }
}
function finish(){
  state.over=true;
  state.thinking=false;
  state.phase='over';
  state.current=null;
  state.alt=null;

  const match=evaluateMatch();
  const s=stats();
  if(match.result==='win'){
    s.win++;
    statusEl.textContent=match.tiebreak?'승리 · 총점 판정':`승리 · 필드 ${match.p}:${match.b}`;
  }else if(match.result==='lose'){
    s.lose++;
    statusEl.textContent=match.tiebreak?'패배 · 총점 판정':`패배 · 필드 ${match.p}:${match.b}`;
  }else{
    s.draw++;
    statusEl.textContent='무승부';
  }
  saveStats(s);
  hintEl.textContent=match.tiebreak
    ? `필드 승수 동률 · 총점 ${match.pt} : ${match.bt}`
    : `필드 결과 ${match.p}승 ${match.d}무 ${match.b}패`;
  render();
  setTimeout(()=>showResultOverlay(match),360);
}
function doReroll(){
  if(state.turn!=='player'||state.phase!=='place'||!state.current||!state.reroll.player||state.current.bonus||state.over||dieAnimating)return;
  state.reroll.player=false;
  state.alt=roll();
  state.phase='rerolling';
  rerollBtn.hidden=true;
  rerollChoice.hidden=true;
  const preview={...state.current,value:state.alt};
  hintEl.textContent='리롤 중...';
  animateDie('player',preview,()=>{
    state.phase='reroll-choice';
    rerollChoice.innerHTML=`<span>리롤 결과</span><button class="btn small" data-game-pick="old">기존 ${state.current.value}</button><button class="btn small primary" data-game-pick="new">새 ${state.alt}</button>`;
    rerollChoice.hidden=false;
    hintEl.textContent='기존 눈과 새 눈 중 하나를 선택하세요.';
  });
}
function chooseReroll(which){
  if(state.phase!=='reroll-choice'||state.alt===null||dieAnimating)return;
  if(which==='new')state.current.value=state.alt;
  state.alt=null;
  state.phase='place';
  playerDiceCube.className=dieClass(state.current,'landed');
  render();
  hintEl.textContent=state.current.shield?'실드 주사위를 배치하세요.':'내 보드의 원하는 줄을 선택하세요.';
}

document.addEventListener('click',e=>{
  if(e.target.closest('[data-game-open]')){syncMobileGameLayout();modal.classList.add('open');renderStats();newMatch();return;}
  if(e.target.closest('[data-game-close]')){clearMatchTimers();modal.classList.remove('open');return;}
  if(e.target.closest('[data-game-reset]')){newMatch();return;}
  if(e.target.closest('[data-game-next]')){newMatch();return;}
  if(e.target.closest('[data-game-roll]')){playerRoll();return;}
  if(e.target.closest('[data-game-reroll]')){doReroll();return;}
  const pick=e.target.closest('[data-game-pick]');
  if(pick){chooseReroll(pick.dataset.gamePick);return;}
  const line=e.target.closest('[data-game-place]');
  if(!line||line.disabled||state.turn!=='player'||state.phase!=='place'||!state.current)return;
  const targetSide=line.dataset.side,idx=Number(line.dataset.line);
  if(!canPlace(targetSide,idx))return;
  place('player',targetSide,idx);
});
renderStats();
render();
