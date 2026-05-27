"use strict";

// ══════════════════════════════════════════════
// AI TABLES
// ══════════════════════════════════════════════
const PIECE_VALUE = { P:100, N:320, B:330, R:500, Q:900, K:20000 };
const PST = {
  P:[[ 0, 0, 0, 0, 0, 0, 0, 0],[50,50,50,50,50,50,50,50],[10,10,20,30,30,20,10,10],[ 5, 5,10,25,25,10, 5, 5],[ 0, 0, 0,20,20, 0, 0, 0],[ 5,-5,-10, 0, 0,-10,-5, 5],[ 5,10,10,-20,-20,10,10, 5],[ 0, 0, 0, 0, 0, 0, 0, 0]],
  N:[[-50,-40,-30,-30,-30,-30,-40,-50],[-40,-20, 0, 0, 0, 0,-20,-40],[-30, 0,10,15,15,10, 0,-30],[-30, 5,15,20,20,15, 5,-30],[-30, 0,15,20,20,15, 0,-30],[-30, 5,10,15,15,10, 5,-30],[-40,-20, 0, 5, 5, 0,-20,-40],[-50,-40,-30,-30,-30,-30,-40,-50]],
  B:[[-20,-10,-10,-10,-10,-10,-10,-20],[-10, 0, 0, 0, 0, 0, 0,-10],[-10, 0, 5,10,10, 5, 0,-10],[-10, 5, 5,10,10, 5, 5,-10],[-10, 0,10,10,10,10, 0,-10],[-10,10,10,10,10,10,10,-10],[-10, 5, 0, 0, 0, 0, 5,-10],[-20,-10,-10,-10,-10,-10,-10,-20]],
  R:[[ 0, 0, 0, 0, 0, 0, 0, 0],[ 5,10,10,10,10,10,10, 5],[-5, 0, 0, 0, 0, 0, 0,-5],[-5, 0, 0, 0, 0, 0, 0,-5],[-5, 0, 0, 0, 0, 0, 0,-5],[-5, 0, 0, 0, 0, 0, 0,-5],[-5, 0, 0, 0, 0, 0, 0,-5],[ 0, 0, 0, 5, 5, 0, 0, 0]],
  Q:[[-20,-10,-10,-5,-5,-10,-10,-20],[-10, 0, 0, 0, 0, 0, 0,-10],[-10, 0, 5, 5, 5, 5, 0,-10],[-5, 0, 5, 5, 5, 5, 0,-5],[ 0, 0, 5, 5, 5, 5, 0,-5],[-10, 5, 5, 5, 5, 5, 0,-10],[-10, 0, 5, 0, 0, 0, 0,-10],[-20,-10,-10,-5,-5,-10,-10,-20]],
  K:[[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-20,-30,-30,-40,-40,-30,-30,-20],[-10,-20,-20,-20,-20,-20,-20,-10],[20,20, 0, 0, 0, 0,20,20],[20,30,10, 0, 0,10,30,20]],
};

// ══════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════
const inBounds   = (r,c) => r>=0&&r<8&&c>=0&&c<8;
const clr        = p => p?p[0]:"";
const tp         = p => p?p[1]:"";
const isEnemy    = (p,c) => p&&clr(p)!==c;
const isFriendly = (p,c) => p&&clr(p)===c;
const cloneBoard = st => st.map(r=>[...r]);
const cloneRights= r  => ({...r});

function getKingPos(color, st) {
  for (let r=0;r<8;r++) for (let c=0;c<8;c++)
    if (st[r][c]===color+"K") return {row:r,col:c};
  return null;
}

// ══════════════════════════════════════════════
// MOVE GENERATION
// ══════════════════════════════════════════════
function pseudoMoves(row,col,st,epTgt,cRights,attackOnly=false) {
  const moves=[];
  const pc=st[row][col]; if(!pc) return moves;
  const c=clr(pc), t=tp(pc);

  if(t==="P"){
    const fwd=c==="w"?-1:1, startRow=c==="w"?6:1;
    if(!attackOnly){
      const one=row+fwd;
      if(inBounds(one,col)&&!st[one][col]){
        moves.push({row:one,col,flags:[]});
        const two=row+fwd*2;
        if(row===startRow&&!st[two][col]) moves.push({row:two,col,flags:["doublePush"]});
      }
    }
    for(const dc of[-1,1]){
      const cr=row+fwd,cc=col+dc;
      if(!inBounds(cr,cc)) continue;
      if(isEnemy(st[cr][cc],c))  moves.push({row:cr,col:cc,flags:[]});
      else if(attackOnly)        moves.push({row:cr,col:cc,flags:[]});
      if(!attackOnly&&epTgt&&epTgt.row===cr&&epTgt.col===cc)
        moves.push({row:cr,col:cc,flags:["enPassant"]});
    }
    return moves;
  }

  if(t==="N"){
    for(const [dr,dc] of[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]){
      const nr=row+dr,nc=col+dc;
      if(inBounds(nr,nc)&&!isFriendly(st[nr][nc],c)) moves.push({row:nr,col:nc,flags:[]});
    }
    return moves;
  }

  if(t==="K"){
    for(const [dr,dc] of[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]){
      const nr=row+dr,nc=col+dc;
      if(inBounds(nr,nc)&&!isFriendly(st[nr][nc],c)) moves.push({row:nr,col:nc,flags:[]});
    }
    if(!attackOnly){
      const rank=c==="w"?7:0;
      if(row===rank&&col===4){
        if(cRights[c+"K"]&&!st[rank][5]&&!st[rank][6]&&st[rank][7]===c+"R"&&
           !isAttacked(rank,4,c,st)&&!isAttacked(rank,5,c,st)&&!isAttacked(rank,6,c,st))
          moves.push({row:rank,col:6,flags:["castleK"]});
        if(cRights[c+"Q"]&&!st[rank][3]&&!st[rank][2]&&!st[rank][1]&&st[rank][0]===c+"R"&&
           !isAttacked(rank,4,c,st)&&!isAttacked(rank,3,c,st)&&!isAttacked(rank,2,c,st))
          moves.push({row:rank,col:2,flags:["castleQ"]});
      }
    }
    return moves;
  }

  const dirs={R:[[-1,0],[1,0],[0,-1],[0,1]],B:[[-1,-1],[-1,1],[1,-1],[1,1]],Q:[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]};
  for(const [dr,dc] of(dirs[t]||[])){
    let nr=row+dr,nc=col+dc;
    while(inBounds(nr,nc)){
      if(isFriendly(st[nr][nc],c)) break;
      moves.push({row:nr,col:nc,flags:[]});
      if(st[nr][nc]) break;
      nr+=dr; nc+=dc;
    }
  }
  return moves;
}

function isAttacked(row,col,friendlyColor,st){
  const eClr=friendlyColor==="w"?"b":"w";
  for(let r=0;r<8;r++) for(let c=0;c<8;c++){
    if(clr(st[r][c])!==eClr) continue;
    if(pseudoMoves(r,c,st,null,{wK:false,wQ:false,bK:false,bQ:false},true)
       .some(m=>m.row===row&&m.col===col)) return true;
  }
  return false;
}

function isKingInCheck(color,st){
  const kp=getKingPos(color,st);
  return kp?isAttacked(kp.row,kp.col,color,st):false;
}

function applyMove(fromRow,fromCol,mv,st,color,cRights){
  const nst=cloneBoard(st);
  const pc=nst[fromRow][fromCol], t_=tp(pc);
  let newEp=null;
  const newR=cloneRights(cRights);

  nst[mv.row][mv.col]=pc;
  nst[fromRow][fromCol]="";

  if(mv.flags.includes("enPassant"))
    nst[color==="w"?mv.row+1:mv.row-1][mv.col]="";
  if(mv.flags.includes("doublePush"))
    newEp={row:color==="w"?mv.row+1:mv.row-1,col:mv.col};
  if(t_==="P"&&(mv.row===0||mv.row===7))
    nst[mv.row][mv.col]=color+"Q";
  if(mv.flags.includes("castleK")){const rank=color==="w"?7:0;nst[rank][5]=color+"R";nst[rank][7]="";}
  if(mv.flags.includes("castleQ")){const rank=color==="w"?7:0;nst[rank][3]=color+"R";nst[rank][0]="";}
  if(t_==="K"){newR[color+"K"]=false;newR[color+"Q"]=false;}
  if(t_==="R"){if(fromCol===7)newR[color+"K"]=false;if(fromCol===0)newR[color+"Q"]=false;}

  return[nst,newEp,newR];
}

function getLegalMoves(row,col,st,epTgt,cRights){
  const pc=st[row][col]; if(!pc) return[];
  const c=clr(pc);
  return pseudoMoves(row,col,st,epTgt,cRights).filter(mv=>{
    const[nst]=applyMove(row,col,mv,st,c,cRights);
    return!isKingInCheck(c,nst);
  });
}

function allLegalMoves(color,st,epTgt,cRights){
  const result=[];
  for(let r=0;r<8;r++) for(let c=0;c<8;c++){
    if(clr(st[r][c])!==color) continue;
    getLegalMoves(r,c,st,epTgt,cRights).forEach(mv=>result.push({from:{row:r,col:c},to:mv}));
  }
  return result;
}

// ══════════════════════════════════════════════
// EVALUATION
// ══════════════════════════════════════════════
function evaluate(st, aiColor){
  let score=0;
  for(let r=0;r<8;r++) for(let c=0;c<8;c++){
    const pc=st[r][c]; if(!pc) continue;
    const c_=clr(pc), t_=tp(pc);
    const val=PIECE_VALUE[t_]||0;
    const pstRow=c_==="w"?r:7-r;
    const bonus=PST[t_]?PST[t_][pstRow][c]:0;
    score+=c_===aiColor?(val+bonus):-(val+bonus);
  }
  return score;
}

// ══════════════════════════════════════════════
// MINIMAX + ALPHA-BETA
// ══════════════════════════════════════════════
function minimax(st, depth, alpha, beta, maximizing, epTgt, cRights, aiColor, playerColor){
  const color=maximizing?aiColor:playerColor;
  if(depth===0) return{score:evaluate(st,aiColor)};

  const moves=allLegalMoves(color,st,epTgt,cRights);
  if(moves.length===0){
    if(isKingInCheck(color,st)) return{score:maximizing?-20000-depth:20000+depth};
    return{score:0};
  }

  let bestMove=null;
  if(maximizing){
    let best=-Infinity;
    for(const mv of moves){
      const[nst,nep,nr]=applyMove(mv.from.row,mv.from.col,mv.to,st,color,cloneRights(cRights));
      const res=minimax(nst,depth-1,alpha,beta,false,nep,nr,aiColor,playerColor);
      if(res.score>best){best=res.score;bestMove=mv;}
      alpha=Math.max(alpha,best);
      if(beta<=alpha) break;
    }
    return{score:best,move:bestMove};
  } else {
    let best=Infinity;
    for(const mv of moves){
      const[nst,nep,nr]=applyMove(mv.from.row,mv.from.col,mv.to,st,color,cloneRights(cRights));
      const res=minimax(nst,depth-1,alpha,beta,true,nep,nr,aiColor,playerColor);
      if(res.score<best){best=res.score;bestMove=mv;}
      beta=Math.min(beta,best);
      if(beta<=alpha) break;
    }
    return{score:best,move:bestMove};
  }
}

// ══════════════════════════════════════════════
// WORKER ENTRY POINT
// ══════════════════════════════════════════════
self.onmessage = function(e) {
  const { board, depth, aiColor, playerColor, ep, rights } = e.data;
  const result = minimax(board, depth, -Infinity, Infinity, true, ep, rights, aiColor, playerColor);
  self.postMessage(result.move || null);
};