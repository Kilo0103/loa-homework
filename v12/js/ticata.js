const KEY='loa-homework:ticata-stats-v2';
const modal=document.getElementById('ticataModal');
const playerBoardEl=document.getElementById('playerBoard');
const botBoardEl=document.getElementById('botBoard');
const statusEl=document.getElementById('ticataStatus');
const statEl=document.getElementById('ticataStats');
const currentDieEl=document.getElementById('currentDie');
const dieTypeEl=document.getElementById('dieType');
const turnLabelEl=document.getElementById('turnLabel');
const hintEl=document.getElementById('gameHint');
const rerollBtn=document.getElementById('rerollBtn');
const rerollChoice=document.getElementById('rerollChoice');
const playerTotalEl=document.getElementById('playerTotal');
const botTotalEl=document.getElementById('botTotal');

const state={
  board:{player:[[],[],[]],bot:[[],[],[]]},
  turn:'player',
  phase:'idle',
  current:null,
  opening:true,
  reroll:{player:true,bot:true},
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
function lineWins(){
  let p=0,b=0;
  for(let i=0;i<3;i++){
    const ps=lineScore(state.board.player[i]),bs=lineScore(state.board.bot[i]);
    if(ps>bs)p++; else if(bs>ps)b++;
  }
  return {p,b};
}
function dieHtml(d){
  if(!d)return '<span class="slot-empty">·</span>';
  return `<span class="board-die ${d.shield?'shield':''}" title="${d.shield?'실드':'일반'} ${d.value}">${d.shield?'<i>◆</i>':''}<b>${d.value}</b></span>`;
}
function renderBoard(side,root){
  root.innerHTML=state.board[side].map((line,i)=>{
    const score=lineScore(line);
    const slots=[...line];
    while(slots.length<3)slots.push(null);
    const can=canPlace(side,i);
    return `<button class="tika-line ${can?'placeable':''}" data-game-place data-side="${side}" data-line="${i}" ${can?'':'disabled'}>
      <span class="line-no">${i+1}줄</span>
      <span class="dice-row">${slots.map(d=>dieHtml(d)).join('')}</span>
      <span class="line-score">${score}</span>
    </button>`;
  }).join('');
}
function canPlace(targetSide,line){
  if(state.over||state.turn!=='player'||!state.current||state.thinking)return false;
  if(state.board[targetSide][line].length>=3)return false;
  if(state.current.shield){
    if(state.current.opening&&targetSide!=='player')return false;
    return true;
  }
  return targetSide==='player';
}
function renderCurrent(){
  currentDieEl.textContent=state.current?.value??'?';
  currentDieEl.classList.toggle('shield',!!state.current?.shield);
  dieTypeEl.textContent=state.current?(state.current.shield?(state.current.bonus?'보너스 실드':'실드 주사위'):'일반 주사위'):'주사위';
  turnLabelEl.textContent=state.turn==='player'?'내 차례':'BOT 차례';
  rerollBtn.hidden=state.turn!=='player'||state.over||!state.current||!state.reroll.player||!!state.current.bonus;
  rerollChoice.hidden=!state.alt;
  if(state.alt){
    rerollChoice.innerHTML=`<span>리롤 결과</span><button class="btn small" data-game-pick="old">기존 ${state.current.value}</button><button class="btn small primary" data-game-pick="new">새 ${state.alt}</button>`;
  }
}
function render(){
  renderBoard('player',playerBoardEl);
  renderBoard('bot',botBoardEl);
  playerTotalEl.textContent=`${totalScore('player')}점`;
  botTotalEl.textContent=`${totalScore('bot')}점`;
  renderCurrent();
}
function setHint(text){hintEl.textContent=text;}
function start(){
  state.board={player:[[],[],[]],bot:[[],[],[]]};
  state.turn='player';
  state.phase='place';
  state.current={value:roll(),shield:true,opening:true,bonus:false};
  state.opening=true;
  state.reroll={player:true,bot:true};
  state.alt=null;
  state.over=false;
  state.thinking=false;
  statusEl.textContent='게임 진행 중';
  setHint='첫 실드 주사위를 내 보드에 배치하세요.';
  hintEl.textContent='첫 실드 주사위를 내 보드에 배치하세요.';
  render();
}
function normalDie(){return {value:roll(),shield:false,opening:false,bonus:false};}
function bonusShield(){return {value:roll(),shield:true,opening:false,bonus:true};}
function removeMatches(attacker,line,value){
  const target=other(attacker);
  const before=state.board[target][line].length;
  state.board[target][line]=state.board[target][line].filter(d=>d.shield||d.value!==value);
  return before-state.board[target][line].length;
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
  const removed=removeMatches(side,line,d.value);
  if(removed>0){
    state.current=bonusShield();
    state.alt=null;
    statusEl.textContent=`알까기! ${removed}개 제거`;
    hintEl.textContent='보너스 실드를 내 보드 또는 상대 보드에 배치하세요.';
    render();
    if(side==='bot')setTimeout(botPlaceShield,280);
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
  state.current=normalDie();
  if(state.turn==='player'){
    statusEl.textContent='내 차례';
    hintEl.textContent='내 보드의 원하는 줄을 선택하세요.';
    state.thinking=false;
    render();
  }else{
    statusEl.textContent='BOT 차례';
    hintEl.textContent='BOT이 생각 중...';
    state.thinking=true;
    render();
    setTimeout(botTurn,350);
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
function botChooseLine(value){
  const own=legalOwnLines('bot');
  const flicks=own.filter(i=>state.board.player[i].some(d=>!d.shield&&d.value===value));
  const pool=flicks.length?flicks:own;
  return pool[Math.floor(Math.random()*pool.length)];
}
function botPlaceShield(){
  const targets=legalShieldTargets();
  if(!targets.length){state.current=null;endTurn();return;}
  const low=state.current.value<=3;
  const preferred=targets.filter(x=>low?x.side==='player':x.side==='bot');
  const pool=preferred.length?preferred:targets;
  const t=pool[Math.floor(Math.random()*pool.length)];
  state.board[t.side][t.line].push({...state.current});
  state.current=null;
  state.thinking=false;
  endTurn();
}
function botTurn(){
  if(state.over)return;
  const own=legalOwnLines('bot');
  if(!own.length){state.thinking=false;state.current=null;endTurn();return;}
  const line=botChooseLine(state.current.value);
  state.board.bot[line].push({...state.current});
  const removed=removeMatches('bot',line,state.current.value);
  if(removed>0){
    state.current=bonusShield();
    statusEl.textContent=`BOT 알까기 · ${removed}개 제거`;
    render();
    setTimeout(botPlaceShield,260);
  }else{
    state.current=null;
    state.thinking=false;
    endTurn();
  }
}
function finish(){
  state.over=true;
  state.thinking=false;
  state.current=null;
  state.alt=null;
  const w=lineWins(),pt=totalScore('player'),bt=totalScore('bot');
  let result='draw';
  if(w.p>=2)result='win';
  else if(w.b>=2)result='lose';
  else if(pt>bt)result='win';
  else if(bt>pt)result='lose';
  const s=stats();
  if(result==='win'){s.win++;statusEl.textContent=`승리 · 라인 ${w.p}:${w.b}`;}
  else if(result==='lose'){s.lose++;statusEl.textContent=`패배 · 라인 ${w.p}:${w.b}`;}
  else{s.draw++;statusEl.textContent='무승부';}
  saveStats(s);
  hintEl.textContent=`최종 점수 ${pt} : ${bt}`;
  render();
}
function doReroll(){
  if(state.turn!=='player'||!state.current||!state.reroll.player||state.current.bonus||state.over)return;
  state.reroll.player=false;
  state.alt=roll();
  render();
  hintEl.textContent='기존 눈과 새 눈 중 하나를 선택하세요.';
}
function chooseReroll(which){
  if(state.alt===null)return;
  if(which==='new')state.current.value=state.alt;
  state.alt=null;
  render();
  hintEl.textContent=state.current.shield?'실드 주사위를 배치하세요.':'내 보드의 원하는 줄을 선택하세요.';
}

document.addEventListener('click',e=>{
  if(e.target.closest('[data-game-open]')){modal.classList.add('open');start();renderStats();return;}
  if(e.target.closest('[data-game-close]')){modal.classList.remove('open');return;}
  if(e.target.closest('[data-game-reset]')){start();return;}
  if(e.target.closest('[data-game-reroll]')){doReroll();return;}
  const pick=e.target.closest('[data-game-pick]');
  if(pick){chooseReroll(pick.dataset.gamePick);return;}
  const line=e.target.closest('[data-game-place]');
  if(!line||line.disabled||state.turn!=='player'||!state.current)return;
  const targetSide=line.dataset.side,idx=Number(line.dataset.line);
  if(!canPlace(targetSide,idx))return;
  place('player',targetSide,idx);
});
renderStats();
render();
