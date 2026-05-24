"use strict";

// ══════════════════════════════════════════════
// BOT NAMES
// ══════════════════════════════════════════════
const BOT_NAMES = [
  "Kasparov","Fischer","Carlsen","Tal","Karpov","Anand","Morphy","Capablanca",
  "Kramnik","Spassky","Bronstein","Botvinnik","Euwe","Alekhine",
  "Napoleon","Sezar","Atilla","Makedoniyalı İskəndər","Salahaddin","Əmir Teymur","Çingiz Xan",
  "Sun Tzu","Hannibal","Spartakus","Julius Caesar",
  "Messi","Ronaldo","Maradona","Pelé","Zidane","Ronaldinho","Neymar","Mbappé",
  "Eminem","Jay-Z","Kendrick","Tupac","Biggie","Drake","Nas","Rakim",
  "Geralt","Kratos","Ezio","Arthur Morgan","Joel","V","Agent 47","Master Chief",
  "Walter White","Tony Soprano","Tyrion Lannister","Jon Snow","Hannibal Lecter",
  "Don Corleone","El Profesor","Sherlock Holmes","Magneto","Batman",
  "Freddie Mercury","David Bowie","Elvis","Michael Jackson","Kurt Cobain","Bravodaki kassir qız","Fəhlə baba","Çöplədən işçi","Fatih Sultan Mehmed","Yavuz Sultan Selim","Şah İsmayıl Xətai","Gus Fring","Jesse Pinkman","Polat Alemdar","Mehmet Karahanlı","Aslan Akbey","Memati","Süleyman Çakır","Donald Trump","RTE","İ. Əliyev","Şəhriyar Məmmədyarov","Teymur Rəcəbov","Hümbətəli Qurbanov","Scorpion","Sub-Zero","Johnny Cage","Raiden","Liu Kang","Kung Lao","Ermac","Noob Saibot","Quan Chi","Shang Tsung","Shao Kahn","Conor McGregor","Putin","Cəmil Heydərov","Murad Rüstəmov","Boris Zaharyas","Shinnok","Zeus","RA","Amon","Super Mario","Big Mario",
];
function randomBotName() {
  return BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
}

// ══════════════════════════════════════════════
// PIECE SYMBOLS
// ══════════════════════════════════════════════
const PIECE_SYMBOLS = {
  wK:"./icons/a-sah.svg",   wQ:"./icons/a-vezir.svg",
  wR:"./icons/a-top.svg",   wB:"./icons/a-fil.svg",
  wN:"./icons/a-at.svg",    wP:"./icons/a-piyada.svg",
  bK:"./icons/b-sah.svg",   bQ:"./icons/b-vezir.svg",
  bR:"./icons/b-top.svg",   bB:"./icons/b-fil.svg",
  bN:"./icons/b-at.svg",    bP:"./icons/b-piyada.svg",
};

// ══════════════════════════════════════════════
// SOUNDS
// ══════════════════════════════════════════════
const SOUNDS = {
  move:      new Audio("./sounds/move.mp3"),
  capture:   new Audio("./sounds/capture.mp3"),
  check:     new Audio("./sounds/check.mp3"),
  checkmate: new Audio("./sounds/checkmate.mp3"),
  castle:    new Audio("./sounds/castle.mp3"),
};
function playSound(name) {
  const s = SOUNDS[name];
  if (!s) return;
  s.currentTime = 0;
  s.play().catch(() => {});
}

// ══════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════
const FILE_CHARS  = ["a","b","c","d","e","f","g","h"];
const PIECE_CHARS = { K:"K", Q:"Q", R:"R", B:"B", N:"N", P:"" };

// ══════════════════════════════════════════════
// GAME STATE
// ══════════════════════════════════════════════
let board           = [];
let currentPlayer   = "w";
let gameOver        = false;
let playerColor     = "w";
let aiColor         = "b";
let aiDepth         = 2;
let gameMode        = "friendly";
let botName         = "Bot";

let selectedSq       = null;
let highlightedMoves = [];

let enPassantTarget = null;
let castlingRights  = { wK:true, wQ:true, bK:true, bQ:true };

let history   = [];
let redoStack = [];

let lastFrom = null;
let lastTo   = null;

let mateLoserPos  = null;
let mateWinnerPos = null;

let savedGame = null;

let moveNotation  = [];
let halfMoveCount = 0;

let activeWorker = null; // cari bot worker

// ══════════════════════════════════════════════
// DOM
// ══════════════════════════════════════════════
const screenMenu   = document.getElementById("screen-menu");
const screenGame   = document.getElementById("screen-game");
const boardEl      = document.getElementById("board");
const msgEl        = document.getElementById("game-message");
const badgeTop     = document.getElementById("badge-top");
const badgeBot     = document.getElementById("badge-bottom");
const labelTop     = document.getElementById("label-top");
const labelBotEl   = document.getElementById("label-bottom");
const btnUndo      = document.getElementById("btn-undo");
const btnRedo      = document.getElementById("btn-redo");
const btnResign    = document.getElementById("btn-resign");
const btnMenuBtn   = document.getElementById("btn-menu");
const modalOverlay = document.getElementById("modal-overlay");
const modalText    = document.getElementById("modal-text");
const modalBtns    = document.getElementById("modal-btns");
const movesList    = document.getElementById("moves-list");
const movesPanel   = document.getElementById("moves-panel");

// ══════════════════════════════════════════════
// SEGMENTED CONTROLS
// ══════════════════════════════════════════════
function initSeg(id, cb) {
  const wrap = document.getElementById(id);
  if (!wrap) return;
  wrap.querySelectorAll(".seg-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      wrap.querySelectorAll(".seg-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      cb(btn.dataset.value);
    });
  });
}

let chosenLevel = "2";
let chosenColor = "w";
let chosenMode  = "friendly";

initSeg("seg-level", v => { chosenLevel = v; });
initSeg("seg-color", v => { chosenColor = v; });
initSeg("seg-mode",  v => {
  chosenMode = v;
  const hint = document.getElementById("mode-hint");
  if (hint) hint.textContent = v === "friendly"
    ? "Gedişləri geri/irəli almaq mümkündür."
    : "Klassik oyun. Geri alma yoxdur.";
});

// ══════════════════════════════════════════════
// MODAL
// ══════════════════════════════════════════════
function showModal(text, buttons) {
  modalText.textContent = text;
  modalBtns.innerHTML = "";
  buttons.forEach(b => {
    const btn = document.createElement("button");
    btn.className = "modal-btn " + (b.cls || "secondary");
    btn.textContent = b.label;
    btn.addEventListener("click", () => { hideModal(); b.action(); });
    modalBtns.appendChild(btn);
  });
  modalOverlay.classList.remove("hidden");
}
function hideModal() { modalOverlay.classList.add("hidden"); }
modalOverlay.addEventListener("click", e => { if (e.target === modalOverlay) hideModal(); });

// ══════════════════════════════════════════════
// SCREEN
// ══════════════════════════════════════════════
function showScreen(name) {
  screenMenu.classList.toggle("active", name === "menu");
  screenGame.classList.toggle("active", name === "game");
}

btnMenuBtn.addEventListener("click", () => {
  if (gameOver || !board.length) { showScreen("menu"); return; }
  // Aktiv worker varsa dayandır
  if (activeWorker) { activeWorker.terminate(); activeWorker = null; }
  savedGame = snapshotState();
  showScreen("menu");
  ensureContinueButton();
});

function ensureContinueButton() {
  if (document.getElementById("btn-continue")) return;
  const card = document.querySelector(".menu-card");
  const btn  = document.createElement("button");
  btn.id = "btn-continue";
  btn.className = "btn-primary";
  btn.style.cssText = "background:rgba(201,168,76,.15);color:var(--accent);border:1px solid var(--accent-border);margin-top:-4px;";
  btn.textContent = "▶ Davam et";
  btn.addEventListener("click", continueGame);
  card.appendChild(btn);
}

function continueGame() {
  if (!savedGame) return;
  restoreState(savedGame);
  savedGame = null;
  removeContinueButton();
  showScreen("game");
  renderBoard();
  updateBadges();
  renderMoveHistory();
  if (!gameOver && currentPlayer === aiColor) scheduleBot();
}
function removeContinueButton() {
  const b = document.getElementById("btn-continue");
  if (b) b.remove();
}

// ══════════════════════════════════════════════
// SNAPSHOT
// ══════════════════════════════════════════════
function makeSnap() {
  return {
    board:         board.map(r => [...r]),
    ep:            enPassantTarget ? {...enPassantTarget} : null,
    rights:        {...castlingRights},
    currentPlayer,
    lastFrom:      lastFrom ? {...lastFrom} : null,
    lastTo:        lastTo   ? {...lastTo}   : null,
    moveNotation:  moveNotation.map(p => ({...p})),
    halfMoveCount,
  };
}
function applySnap(s) {
  board           = s.board.map(r => [...r]);
  enPassantTarget = s.ep     ? {...s.ep}     : null;
  castlingRights  = {...s.rights};
  currentPlayer   = s.currentPlayer;
  lastFrom        = s.lastFrom ? {...s.lastFrom} : null;
  lastTo          = s.lastTo   ? {...s.lastTo}   : null;
  moveNotation    = s.moveNotation.map(p => ({...p}));
  halfMoveCount   = s.halfMoveCount;
}
function copySnap(s) {
  return {
    board:         s.board.map(r => [...r]),
    ep:            s.ep     ? {...s.ep}     : null,
    rights:        {...s.rights},
    currentPlayer: s.currentPlayer,
    lastFrom:      s.lastFrom ? {...s.lastFrom} : null,
    lastTo:        s.lastTo   ? {...s.lastTo}   : null,
    moveNotation:  s.moveNotation.map(p => ({...p})),
    halfMoveCount: s.halfMoveCount,
  };
}
function snapshotState() {
  return {
    ...makeSnap(),
    history:   history.map(copySnap),
    redoStack: redoStack.map(copySnap),
    gameOver, playerColor, aiColor, aiDepth, gameMode, botName,
    mateLoserPos:  mateLoserPos  ? {...mateLoserPos}  : null,
    mateWinnerPos: mateWinnerPos ? {...mateWinnerPos} : null,
  };
}
function restoreState(s) {
  applySnap(s);
  history    = s.history.map(copySnap);
  redoStack  = s.redoStack.map(copySnap);
  gameOver      = s.gameOver;
  playerColor   = s.playerColor;
  aiColor       = s.aiColor;
  aiDepth       = s.aiDepth;
  gameMode      = s.gameMode;
  botName       = s.botName;
  mateLoserPos  = s.mateLoserPos  ? {...s.mateLoserPos}  : null;
  mateWinnerPos = s.mateWinnerPos ? {...s.mateWinnerPos} : null;
  selectedSq       = null;
  highlightedMoves = [];
  updateLabels();
  updateBadges();
}

// ══════════════════════════════════════════════
// START
// ══════════════════════════════════════════════
document.getElementById("btn-start").addEventListener("click", startGame);

function startGame() {
  // Aktiv worker varsa dayandır
  if (activeWorker) { activeWorker.terminate(); activeWorker = null; }

  aiDepth  = parseInt(chosenLevel, 10);
  gameMode = chosenMode;
  botName  = randomBotName();

  let pc = chosenColor;
  if (pc === "r") pc = Math.random() < .5 ? "w" : "b";
  playerColor = pc;
  aiColor     = pc === "w" ? "b" : "w";

  board           = createInitialBoard();
  currentPlayer   = "w";
  gameOver        = false;
  selectedSq      = null;
  highlightedMoves= [];
  enPassantTarget = null;
  castlingRights  = { wK:true, wQ:true, bK:true, bQ:true };
  history         = [];
  redoStack       = [];
  lastFrom        = null;
  lastTo          = null;
  mateLoserPos    = null;
  mateWinnerPos   = null;
  savedGame       = null;
  moveNotation    = [];
  halfMoveCount   = 0;

  removeContinueButton();
  updateLabels();
  updateBadges();
  showScreen("game");
  renderBoard();
  renderMoveHistory();

  if (aiColor === "w") scheduleBot();
}

function updateLabels() {
  labelTop.textContent   = playerColor === "w" ? `${botName}` : `${botName}`;
  labelBotEl.textContent = playerColor === "w" ? "Sən" : "Sən";
}

function createInitialBoard() {
  return [
    ["bR","bN","bB","bQ","bK","bB","bN","bR"],
    ["bP","bP","bP","bP","bP","bP","bP","bP"],
    ["","","","","","","",""],["","","","","","","",""],
    ["","","","","","","",""],["","","","","","","",""],
    ["wP","wP","wP","wP","wP","wP","wP","wP"],
    ["wR","wN","wB","wQ","wK","wB","wN","wR"],
  ];
}

// ══════════════════════════════════════════════
// RENDER BOARD
// ══════════════════════════════════════════════
function renderBoard() {
  boardEl.innerHTML = "";
  const flip = playerColor === "b";

  for (let ri = 0; ri < 8; ri++) {
    for (let ci = 0; ci < 8; ci++) {
      const row = flip ? 7-ri : ri;
      const col = flip ? 7-ci : ci;

      const sq = document.createElement("div");
      sq.className = `square ${(row+col)%2===0 ? "light":"dark"}`;
      sq.dataset.row = row;
      sq.dataset.col = col;

      // Rank label — sol sütun
      if (ci === 0) {
        const span = document.createElement("span");
        span.className = "coord-rank";
        span.textContent = String(8 - row);
        sq.appendChild(span);
      }
      // File label — alt sətir
      if (ri === 7) {
        const span = document.createElement("span");
        span.className = "coord-file";
        span.textContent = FILE_CHARS[col];
        sq.appendChild(span);
      }

      const piece = board[row][col];
      if (piece) {
        sq.classList.add("has-piece");
        const img = document.createElement("img");
        img.src = PIECE_SYMBOLS[piece] || "";
        img.alt = piece; img.draggable = false;
        sq.appendChild(img);
      }

      if ((lastFrom&&lastFrom.row===row&&lastFrom.col===col)||
          (lastTo  &&lastTo.row===row  &&lastTo.col===col))
        sq.classList.add("last-move");

      if (selectedSq&&selectedSq.row===row&&selectedSq.col===col)
        sq.classList.add("selected");

      if (highlightedMoves.some(m=>m.row===row&&m.col===col))
        sq.classList.add("highlight");

      if (isKingSquareInCheck(row,col)) sq.classList.add("in-check");

      if (mateLoserPos &&mateLoserPos.row===row &&mateLoserPos.col===col)  sq.classList.add("mate-loser");
      if (mateWinnerPos&&mateWinnerPos.row===row&&mateWinnerPos.col===col) sq.classList.add("mate-winner");

      sq.addEventListener("click", onSquareClick);
      boardEl.appendChild(sq);
    }
  }
}

function getSquareEl(row, col) {
  return boardEl.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
}

// ══════════════════════════════════════════════
// SMOOTH ANIMATION
// ══════════════════════════════════════════════
function animateMove(fromRow, fromCol, toRow, toCol, piece, callback) {
  const sqSize = boardEl.offsetWidth / 8;
  const flip   = playerColor === "b";
  const vPos   = (r,c) => ({
    x: (flip ? 7-c : c) * sqSize,
    y: (flip ? 7-r : r) * sqSize,
  });
  const from = vPos(fromRow, fromCol);
  const to   = vPos(toRow,   toCol);

  const srcImg  = getSquareEl(fromRow, fromCol)?.querySelector("img");
  const destImg = getSquareEl(toRow,   toCol)  ?.querySelector("img");
  if (srcImg)  srcImg.style.opacity  = "0";
  if (destImg) destImg.style.opacity = "0";

  const flyer = document.createElement("div");
  flyer.className = "moving-piece";
  flyer.style.transform = `translate(${from.x}px,${from.y}px)`;
  const img = document.createElement("img");
  img.src = PIECE_SYMBOLS[piece] || "";
  img.draggable = false;
  flyer.appendChild(img);
  boardEl.appendChild(flyer);

  requestAnimationFrame(() => requestAnimationFrame(() => {
    flyer.style.transform = `translate(${to.x}px,${to.y}px)`;
  }));

  flyer.addEventListener("transitionend", () => {
    flyer.remove();
    if (srcImg) srcImg.style.opacity = "";
    callback();
  }, { once: true });
}

// ══════════════════════════════════════════════
// MOVE HISTORY
// ══════════════════════════════════════════════
function renderMoveHistory() {
  movesList.innerHTML = "";
  moveNotation.forEach((pair, i) => {
    const wrap = document.createElement("div");
    wrap.className = "move-pair";

    const num = document.createElement("span");
    num.className = "move-num";
    num.textContent = `${i+1}.`;
    wrap.appendChild(num);

    if (pair.white) {
      const w = document.createElement("span");
      w.className = "move-token" + getNotationClass(pair.white);
      w.textContent = pair.white;
      wrap.appendChild(w);
    }
    if (pair.black) {
      const b = document.createElement("span");
      b.className = "move-token" + getNotationClass(pair.black);
      b.textContent = pair.black;
      wrap.appendChild(b);
    }

    movesList.appendChild(wrap);
  });

  // Sağa scroll
  if (movesPanel) movesPanel.scrollLeft = movesPanel.scrollWidth;
}

function getNotationClass(n) {
  if (n.endsWith("#")) return " mate-move";
  if (n.endsWith("+")) return " check-move";
  return "";
}

// ══════════════════════════════════════════════
// ALGEBRAIC NOTATION
// ══════════════════════════════════════════════
function toAlgebraic(fromRow, fromCol, mv, boardBefore, mover, isCheckmate, isCheck) {
  const piece     = boardBefore[fromRow][fromCol];
  const t         = piece[1];
  const toFile    = FILE_CHARS[mv.col];
  const toRank    = String(8 - mv.row);
  const isCapture = !!boardBefore[mv.row][mv.col] || mv.flags.includes("enPassant");
  const isPromo   = t === "P" && (mv.row === 0 || mv.row === 7);

  let notation = "";

  if (mv.flags.includes("castleK"))       notation = "O-O";
  else if (mv.flags.includes("castleQ")) notation = "O-O-O";
  else {
    const pieceChar = PIECE_CHARS[t];
    let disambig = "";
    if (t !== "P") {
      const sameType = [];
      for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
        if (r===fromRow&&c===fromCol) continue;
        if (boardBefore[r][c]===piece) {
          const lms = getLegalMoves(r,c,boardBefore,enPassantTarget,castlingRights);
          if (lms.some(m=>m.row===mv.row&&m.col===mv.col)) sameType.push({r,c});
        }
      }
      if (sameType.length > 0) {
        const sameFile = sameType.some(p=>p.c===fromCol);
        const sameRank = sameType.some(p=>p.r===fromRow);
        if (!sameFile)      disambig = FILE_CHARS[fromCol];
        else if (!sameRank) disambig = String(8-fromRow);
        else                disambig = FILE_CHARS[fromCol]+String(8-fromRow);
      }
    }
    const capStr   = isCapture ? "x" : "";
    const fromFile = t==="P"&&isCapture ? FILE_CHARS[fromCol] : "";
    const promoStr = isPromo ? "=Q" : "";
    notation = `${pieceChar}${disambig}${fromFile}${capStr}${toFile}${toRank}${promoStr}`;
  }

  if (isCheckmate)  notation += "#";
  else if (isCheck) notation += "+";
  return notation;
}

function addMoveToHistory(notation, mover) {
  if (mover === "w") {
    moveNotation.push({ white: notation, black: "" });
  } else {
    if (moveNotation.length === 0) moveNotation.push({ white: "...", black: notation });
    else moveNotation[moveNotation.length-1].black = notation;
  }
  halfMoveCount++;
  renderMoveHistory();
}

// ══════════════════════════════════════════════
// BADGES + BUTTONS
// ══════════════════════════════════════════════
function updateBadges() {
  badgeTop.classList.toggle("active-turn", currentPlayer===aiColor);
  badgeBot.classList.toggle("active-turn", currentPlayer===playerColor);
  if (btnUndo) btnUndo.disabled = gameMode==="challenge" || history.length===0;
  if (btnRedo) btnRedo.disabled = gameMode==="challenge" || redoStack.length===0;
}

// ══════════════════════════════════════════════
// CHESS HELPERS (script.js-də də lazımdır —
// notation, legal move highlight, check göstərişi üçün)
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

function hasAnyLegalMoves(color,st,epTgt,cRights){
  for(let r=0;r<8;r++) for(let c=0;c<8;c++){
    if(clr(st[r][c])!==color) continue;
    if(getLegalMoves(r,c,st,epTgt,cRights).length>0) return true;
  }
  return false;
}

// ══════════════════════════════════════════════
// CLICK
// ══════════════════════════════════════════════
function onSquareClick(e){
  if(gameOver||currentPlayer!==playerColor) return;
  const row=+e.currentTarget.dataset.row;
  const col=+e.currentTarget.dataset.col;
  const piece=board[row][col];

  if(selectedSq&&highlightedMoves.some(m=>m.row===row&&m.col===col)){
    const mv=highlightedMoves.find(m=>m.row===row&&m.col===col);
    executeMove(selectedSq.row,selectedSq.col,mv,playerColor,true);
    return;
  }

  if(piece&&clr(piece)===playerColor){
    selectedSq=       {row,col};
    highlightedMoves= getLegalMoves(row,col,board,enPassantTarget,castlingRights);
    setMsg("Hərəkət seçin.");
  } else {
    selectedSq=null; highlightedMoves=[];
  }
  renderBoard();
}

// ══════════════════════════════════════════════
// EXECUTE + COMMIT MOVE
// ══════════════════════════════════════════════
function executeMove(fromRow,fromCol,mv,mover,animate){
  const piece=board[fromRow][fromCol];
  if(animate){
    animateMove(fromRow,fromCol,mv.row,mv.col,piece,()=>commitMove(fromRow,fromCol,mv,mover));
  } else {
    commitMove(fromRow,fromCol,mv,mover);
  }
}

function commitMove(fromRow,fromCol,mv,mover){
  const boardBefore=cloneBoard(board);

  history.push(makeSnap());
  redoStack=[];

  const isCapture=!!board[mv.row][mv.col]||mv.flags.includes("enPassant");
  const isCastle =mv.flags.includes("castleK")||mv.flags.includes("castleQ");

  const[nst,newEp,newR]=applyMove(fromRow,fromCol,mv,board,mover,castlingRights);
  board=nst; enPassantTarget=newEp; castlingRights=newR;
  lastFrom={row:fromRow,col:fromCol};
  lastTo=  {row:mv.row, col:mv.col};
  selectedSq=null; highlightedMoves=[];

  const next       = mover==="w"?"b":"w";
  const inCheck    = isKingInCheck(next,board);
  const hasMoves   = hasAnyLegalMoves(next,board,enPassantTarget,castlingRights);
  const isCheckmate= !hasMoves&&inCheck;

  const notation=toAlgebraic(fromRow,fromCol,mv,boardBefore,mover,isCheckmate,inCheck);
  addMoveToHistory(notation,mover);

  if(isCheckmate)    playSound("checkmate");
  else if(inCheck)   playSound("check");
  else if(isCastle)  playSound("castle");
  else if(isCapture) playSound("capture");
  else               playSound("move");

  if(!hasMoves){
    gameOver=true;
    if(inCheck){
      mateLoserPos =getKingPos(next, board);
      mateWinnerPos=getKingPos(mover,board);
      const winner=mover===playerColor?"Sən":botName;
      setMsg(`Mat! Qalib: ${winner} 🏆`);
      renderBoard();
      setTimeout(()=>launchConfetti(),350);
    } else {
      setMsg("Pat: Bərabərlik!");
      renderBoard();
    }
    showGameOverModal(mover);
    return;
  }

  currentPlayer=next;
  updateBadges();
  if(inCheck) setMsg(`${next===playerColor?"Sən":botName} Şah!`);
  else        setMsg(next===playerColor?"Hərəkət seçin.":`${botName} düşünür...`);

  renderBoard();
  if(!gameOver&&currentPlayer===aiColor) scheduleBot();
}

// ══════════════════════════════════════════════
// GAME OVER MODAL
// ══════════════════════════════════════════════
function showGameOverModal(winner){
  setTimeout(()=>{
    const msg=winner===playerColor
      ?`Təbriklər! ${botName}-ı məğlub etdin! 🏆`
      :`${botName} səni mat etdi. Növbəti dəfə daha yaxşı olarsan!`;
    showModal(msg,[
      {label:"Yenidən oyna",cls:"primary",  action:startGame},
      {label:"Ana səhifə",  cls:"secondary",action:()=>showScreen("menu")},
    ]);
  },1400);
}

// ══════════════════════════════════════════════
// UNDO
// ══════════════════════════════════════════════
btnUndo.addEventListener("click",()=>{
  if(gameMode==="challenge"||history.length===0) return;
  if(activeWorker){activeWorker.terminate();activeWorker=null;}
  redoStack.push(makeSnap());
  const prev=history.pop();
  applySnap(prev);
  gameOver=false; mateLoserPos=null; mateWinnerPos=null;
  selectedSq=null; highlightedMoves=[];
  updateBadges();
  setMsg("Hərəkət seçin.");
  renderBoard();
  renderMoveHistory();
});

// ══════════════════════════════════════════════
// REDO
// ══════════════════════════════════════════════
btnRedo.addEventListener("click",()=>{
  if(gameMode==="challenge"||redoStack.length===0) return;
  if(activeWorker){activeWorker.terminate();activeWorker=null;}
  history.push(makeSnap());
  const next=redoStack.pop();
  applySnap(next);
  selectedSq=null; highlightedMoves=[];
  updateBadges();
  if(!gameOver&&currentPlayer===aiColor) scheduleBot();
  else setMsg("Hərəkət seçin.");
  renderBoard();
  renderMoveHistory();
});

// ══════════════════════════════════════════════
// RESIGN
// ══════════════════════════════════════════════
btnResign.addEventListener("click",()=>{
  if(gameOver) return;
  showModal("Təslim olmaq istədiyinə əminsən?",[
    {label:"Bəli, təslim ol",cls:"danger",   action:doResign},
    {label:"Xeyr, davam et", cls:"secondary",action:()=>{}},
  ]);
});

function doResign(){
  if(activeWorker){activeWorker.terminate();activeWorker=null;}
  gameOver=true;
  mateWinnerPos=getKingPos(aiColor,    board);
  mateLoserPos =getKingPos(playerColor,board);
  setMsg(`Təslim oldun. Qalib: ${botName}`);
  renderBoard();
  showModal(`Təslim oldun. ${botName} qalib gəldi!`,[
    {label:"Yenidən oyna",cls:"primary",  action:startGame},
    {label:"Ana səhifə",  cls:"secondary",action:()=>showScreen("menu")},
  ]);
}

// ══════════════════════════════════════════════
// BOT — Web Worker ilə
// ══════════════════════════════════════════════
function scheduleBot(){
  setMsg(`düşünür...`);
  setTimeout(doBotMove, 100);
}

function doBotMove(){
  if(gameOver||currentPlayer!==aiColor) return;

  // Əvvəlki worker varsa dayandır
  if(activeWorker){activeWorker.terminate();activeWorker=null;}

  const worker = new Worker("./bot.js");
  activeWorker = worker;

  worker.postMessage({
    board:       board.map(r=>[...r]),
    depth:       aiDepth,
    aiColor,
    playerColor,
    ep:          enPassantTarget ? {...enPassantTarget} : null,
    rights:      {...castlingRights},
  });

  worker.onmessage = (e) => {
    worker.terminate();
    if(activeWorker===worker) activeWorker=null;
    const move = e.data;
    if(move && !gameOver && currentPlayer===aiColor){
      executeMove(move.from.row, move.from.col, move.to, aiColor, true);
    }
  };

  worker.onerror = (err) => {
    console.error("Bot worker xətası:", err);
    worker.terminate();
    if(activeWorker===worker) activeWorker=null;
  };
}

// ══════════════════════════════════════════════
// MISC
// ══════════════════════════════════════════════
function isKingSquareInCheck(row,col){
  const pc=board[row][col];
  return pc&&tp(pc)==="K"?isKingInCheck(clr(pc),board):false;
}
function setMsg(text){ msgEl.textContent=text; }

// ══════════════════════════════════════════════
// CONFETTI
// ══════════════════════════════════════════════
function launchConfetti(){
  const canvas=document.createElement("canvas");
  Object.assign(canvas.style,{position:"fixed",top:"0",left:"0",width:"100%",height:"100%",pointerEvents:"none",zIndex:"999"});
  document.body.appendChild(canvas);
  canvas.width=window.innerWidth; canvas.height=window.innerHeight;
  const ctx=canvas.getContext("2d");
  const colors=["#ff2244","#00ff88","#c9a84c","#4fc3f7","#ff80ab","#b39ddb","#fff176","#ffab40"];
  const pieces=Array.from({length:180},()=>({
    x:Math.random()*canvas.width, y:-20-Math.random()*200,
    w:8+Math.random()*10, h:4+Math.random()*6,
    color:colors[Math.floor(Math.random()*colors.length)],
    rot:Math.random()*Math.PI*2, rotS:(Math.random()-.5)*.2,
    vx:(Math.random()-.5)*4, vy:2.5+Math.random()*4, op:1,
  }));
  let frame=0; const MAX=230;
  (function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(const p of pieces){
      p.x+=p.vx; p.y+=p.vy; p.vy+=.07; p.rot+=p.rotS;
      if(frame>MAX*.6) p.op=Math.max(0,p.op-.016);
      ctx.save(); ctx.globalAlpha=p.op;
      ctx.translate(p.x,p.y); ctx.rotate(p.rot);
      ctx.fillStyle=p.color; ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
      ctx.restore();
    }
    if(++frame<MAX) requestAnimationFrame(draw); else canvas.remove();
  })();
}