const KEY='loa-homework:ticata-stats';
const modal=document.getElementById('ticataModal');
const cells=[...document.querySelectorAll('[data-game-cell]')];
const statusEl=document.getElementById('ticataStatus');
const statEl=document.getElementById('ticataStats');
let board=Array(9).fill('');
let locked=false;
let difficulty='normal';
const WIN=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

function stats(){
  try{return {...{win:0,draw:0,lose:0},...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return {win:0,draw:0,lose:0}}
}
function saveStats(s){localStorage.setItem(KEY,JSON.stringify(s));renderStats();}
function renderStats(){const s=stats();statEl.textContent=`승 ${s.win} · 무 ${s.draw} · 패 ${s.lose}`;}
function result(b){
  for(const line of WIN){
    const [a,c,d]=line;
    if(b[a]&&b[a]===b[c]&&b[a]===b[d])return b[a];
  }
  return b.every(Boolean)?'draw':null;
}
function empty(b){return b.map((v,i)=>v?'':i).filter(v=>v!=='');}
function minimax(b,maxing){
  const r=result(b);
  if(r==='O')return 10;
  if(r==='X')return -10;
  if(r==='draw')return 0;
  const moves=empty(b);
  if(maxing){
    let best=-Infinity;
    for(const i of moves){b[i]='O';best=Math.max(best,minimax(b,false));b[i]='';}
    return best;
  }
  let best=Infinity;
  for(const i of moves){b[i]='X';best=Math.min(best,minimax(b,true));b[i]='';}
  return best;
}
function bestMove(){
  const moves=empty(board);
  if(!moves.length)return -1;
  if(difficulty==='easy')return moves[Math.floor(Math.random()*moves.length)];
  if(difficulty==='normal'&&Math.random()<0.28)return moves[Math.floor(Math.random()*moves.length)];
  let best=-Infinity,pick=moves[0];
  for(const i of moves){
    board[i]='O';
    const score=minimax(board,false);
    board[i]='';
    if(score>best){best=score;pick=i;}
  }
  return pick;
}
function render(){
  cells.forEach((c,i)=>{
    c.textContent=board[i];
    c.classList.toggle('x',board[i]==='X');
    c.classList.toggle('o',board[i]==='O');
  });
}
function finish(r){
  locked=true;
  const s=stats();
  if(r==='X'){statusEl.textContent='승리!';s.win++;}
  else if(r==='O'){statusEl.textContent='BOT 승리';s.lose++;}
  else{statusEl.textContent='무승부';s.draw++;}
  saveStats(s);
}
function botTurn(){
  locked=true;
  statusEl.textContent='BOT 생각 중...';
  setTimeout(()=>{
    const i=bestMove();
    if(i>=0)board[i]='O';
    render();
    const r=result(board);
    if(r)finish(r);
    else{locked=false;statusEl.textContent='내 차례 · X';}
  },180);
}
function play(i){
  if(locked||board[i])return;
  board[i]='X';render();
  const r=result(board);
  if(r){finish(r);return;}
  botTurn();
}
function reset(){
  board=Array(9).fill('');
  locked=false;
  statusEl.textContent='내 차례 · X';
  render();
}
document.addEventListener('click',e=>{
  if(e.target.closest('[data-game-open]')){modal.classList.add('open');reset();renderStats();return;}
  if(e.target.closest('[data-game-close]')){modal.classList.remove('open');return;}
  const cell=e.target.closest('[data-game-cell]');
  if(cell){play(Number(cell.dataset.gameCell));return;}
  if(e.target.closest('[data-game-reset]')){reset();return;}
  const diff=e.target.closest('[data-game-difficulty]');
  if(diff){
    difficulty=diff.dataset.gameDifficulty;
    document.querySelectorAll('[data-game-difficulty]').forEach(b=>b.classList.toggle('active',b===diff));
    reset();
  }
});
renderStats();
render();
