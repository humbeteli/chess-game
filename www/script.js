"use strict";

// ══════════════════════════════════════════════
// BOT NAMES
// ══════════════════════════════════════════════
const BOT_NAMES = [
  "Şəhriyar Məmmədyarov",
  "Teymur Rəcəbov",
  "Garry Kasparov",
  "Bobby Fischer",
  "Magnus Carlsen",
  "Mikhail Tal",
  "Anatoly Karpov",
  "Viswanathan Anand",
  "Paul Morphy",
  "Capablanca",
  "Vladimir Kramnik",
  "Boris Spassky",
  "David Bronstein",
  "Mikhail Botvinnik",
  "Max Euwe",
  "Alekhine",
  "Napoleon Bonaparte",
  "Julius Caesar",
  "Makedoniyalı İskəndər",
  "Əmir Teymur",
  "Çingiz Xan",
  "Hümbətəli Qurbanov",
  "Scorpion",
  "Sub-Zero",
  "Cəmil Heydərov",
  "Murad Rüstəmov",
  "Sun Tzu",
  "Hannibal",
  "Spartacus",
  "Leo Messi",
  "CR7",
  "Zidane",
  "Eminem",
  "Snoop Dogg",
  "Jay-Z",
  "Kendrick Lamar",
  "Tupac Shakur",
  "Biggie",
  "Drake",
  "Nas",
  "Rakim",
  "Geralt",
  "Kratos",
  "Ezio",
  "Arthur Morgan",
  "Joel",
  "V",
  "Agent 47",
  "Master Chief",
  "Walter White",
  "Tony Soprano",
  "Tyrion Lannister",
  "Jon Snow",
  "Hannibal Lecter",
  "Don Corleone",
  "El Profesor",
  "Sherlock Holmes",
  "Magneto",
  "Batman",
  "Freddie Mercury",
  "David Bowie",
  "Elvis",
  "Michael Jackson",
  "Kurt Cobain",
  "Bravodaki kassir qız",
  "Fəhlə baba",
  "Çöplədən işçi",
  "Fatih Sultan Mehmed",
  "Yavuz Sultan Selim",
  "Şah İsmayıl Xətai",
  "Gus Fring",
  "Jesse Pinkman",
  "Polat Alemdar",
  "Mehmet Karahanlı",
  "Aslan Akbey",
  "Donald Trump",
  "RTE",
  "İ. Əliyev",
  "Boris Zaharyas",
  "Zeus",
  "RA",
  "Amon",
  "Super Mario",
  "Big Mario",
];
let botNamePool = [];
function randomBotName() {
  if (botNamePool.length === 0) {
    botNamePool = [...BOT_NAMES].sort(() => Math.random() - 0.5);
  }
  return botNamePool.pop();
}

// ══════════════════════════════════════════════
// PIECE SYMBOLS
// ══════════════════════════════════════════════
const PIECE_SYMBOLS = {
  wK: "./icons/a-sah.svg",
  wQ: "./icons/a-vezir.svg",
  wR: "./icons/a-top.svg",
  wB: "./icons/a-fil.svg",
  wN: "./icons/a-at.svg",
  wP: "./icons/a-piyada.svg",
  bK: "./icons/b-sah.svg",
  bQ: "./icons/b-vezir.svg",
  bR: "./icons/b-top.svg",
  bB: "./icons/b-fil.svg",
  bN: "./icons/b-at.svg",
  bP: "./icons/b-piyada.svg",
};

// ══════════════════════════════════════════════
// SOUNDS
// ══════════════════════════════════════════════
const SOUNDS = {
  move: new Audio("./sounds/move.mp3"),
  capture: new Audio("./sounds/capture.mp3"),
  check: new Audio("./sounds/check.mp3"),
  checkmate: new Audio("./sounds/checkmate.mp3"),
  castle: new Audio("./sounds/castle.mp3"),
};
function playSound(name) {
  if (!settings.sound) return;
  const s = SOUNDS[name];
  if (!s) return;
  s.currentTime = 0;
  s.play().catch(() => {});
}

// ══════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════
const settings = {
  confirmMove: false,
  showMoves: true,
  sound: true,
  autoQueen: false,
};

// ══════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════
const FILE_CHARS = ["a", "b", "c", "d", "e", "f", "g", "h"];
const PIECE_CHARS = { K: "K", Q: "Q", R: "R", B: "B", N: "N", P: "" };

// ══════════════════════════════════════════════
// GAME STATE
// ══════════════════════════════════════════════
let board = [];
let currentPlayer = "w";
let gameOver = false;
let playerColor = "w";
let aiColor = "b";
let aiDepth = 2;
let gameMode = "friendly";
let botName = "Bot";

let selectedSq = null;
let highlightedMoves = [];

let enPassantTarget = null;
let castlingRights = { wK: true, wQ: true, bK: true, bQ: true };

let history = [];
let redoStack = [];

let lastFrom = null;
let lastTo = null;

let mateLoserPos = null;
let mateWinnerPos = null;

let savedGame = null;

let moveNotation = [];
let halfMoveCount = 0;

let activeWorker = null;

// Pending move confirmation state
let pendingMove = null; // { fromRow, fromCol, mv, mover }

// Pending promotion state
let pendingPromotion = null; // { fromRow, fromCol, mv, mover }

// ══════════════════════════════════════════════
// DOM
// ══════════════════════════════════════════════
const screenMenu = document.getElementById("screen-menu");
const screenGame = document.getElementById("screen-game");
const boardEl = document.getElementById("board");
const msgEl = document.getElementById("game-message");
const badgeTop = document.getElementById("badge-top");
const badgeBot = document.getElementById("badge-bottom");
const labelTop = document.getElementById("label-top");
const labelBotEl = document.getElementById("label-bottom");
const btnUndo = document.getElementById("btn-undo");
const btnRedo = document.getElementById("btn-redo");
const btnResign = document.getElementById("btn-resign");
const btnMenuBtn = document.getElementById("btn-menu");
const modalOverlay = document.getElementById("modal-overlay");
const modalText = document.getElementById("modal-text");
const modalBtns = document.getElementById("modal-btns");
const movesList = document.getElementById("moves-list");
const movesPanel = document.getElementById("moves-panel");

// Confirm bar DOM (injected into bottom-bar)
let confirmBar = null;

// ══════════════════════════════════════════════
// SEGMENTED CONTROLS
// ══════════════════════════════════════════════
function initSeg(id, cb) {
  const wrap = document.getElementById(id);
  if (!wrap) return;
  wrap.querySelectorAll(".seg-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      wrap
        .querySelectorAll(".seg-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      cb(btn.dataset.value);
    });
  });
}

let chosenLevel = "2";
let chosenColor = "w";
let chosenMode = "friendly";

initSeg("seg-level", (v) => {
  chosenLevel = v;
});
initSeg("seg-color", (v) => {
  chosenColor = v;
});
initSeg("seg-mode", (v) => {
  chosenMode = v;
  const hint = document.getElementById("mode-hint");
  if (hint)
    hint.textContent =
      v === "friendly"
        ? "Gedişləri geri/irəli almaq mümkündür."
        : "Klassik oyun. Geri alma yoxdur.";
});

// ══════════════════════════════════════════════
// MODAL
// ══════════════════════════════════════════════
function showModal(text, buttons) {
  modalText.textContent = text;
  modalBtns.innerHTML = "";
  buttons.forEach((b) => {
    const btn = document.createElement("button");
    btn.className = "modal-btn " + (b.cls || "secondary");
    btn.textContent = b.label;
    btn.addEventListener("click", () => {
      hideModal();
      b.action();
    });
    modalBtns.appendChild(btn);
  });
  modalOverlay.classList.remove("hidden");
}
function hideModal() {
  modalOverlay.classList.add("hidden");
}
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) hideModal();
});

// ══════════════════════════════════════════════
// SCREEN
// ══════════════════════════════════════════════
function showScreen(name) {
  screenMenu.classList.toggle("active", name === "menu");
  screenGame.classList.toggle("active", name === "game");
}

btnMenuBtn.addEventListener("click", () => {
  if (gameOver || !board.length) {
    showScreen("menu");
    return;
  }
  if (activeWorker) {
    activeWorker.terminate();
    activeWorker = null;
  }
  savedGame = snapshotState();
  showScreen("menu");
  ensureContinueButton();
});

function ensureContinueButton() {
  if (document.getElementById("btn-continue")) return;
  const card = document.querySelector(".menu-card");
  const btn = document.createElement("button");
  btn.id = "btn-continue";
  btn.className = "btn-primary";
  btn.style.cssText =
    "background:rgba(201,168,76,.15);color:var(--accent);border:1px solid var(--accent-border);margin-top:-4px;";
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
    board: board.map((r) => [...r]),
    ep: enPassantTarget ? { ...enPassantTarget } : null,
    rights: { ...castlingRights },
    currentPlayer,
    lastFrom: lastFrom ? { ...lastFrom } : null,
    lastTo: lastTo ? { ...lastTo } : null,
    moveNotation: moveNotation.map((p) => ({ ...p })),
    halfMoveCount,
  };
}
function applySnap(s) {
  board = s.board.map((r) => [...r]);
  enPassantTarget = s.ep ? { ...s.ep } : null;
  castlingRights = { ...s.rights };
  currentPlayer = s.currentPlayer;
  lastFrom = s.lastFrom ? { ...s.lastFrom } : null;
  lastTo = s.lastTo ? { ...s.lastTo } : null;
  moveNotation = s.moveNotation.map((p) => ({ ...p }));
  halfMoveCount = s.halfMoveCount;
}
function copySnap(s) {
  return {
    board: s.board.map((r) => [...r]),
    ep: s.ep ? { ...s.ep } : null,
    rights: { ...s.rights },
    currentPlayer: s.currentPlayer,
    lastFrom: s.lastFrom ? { ...s.lastFrom } : null,
    lastTo: s.lastTo ? { ...s.lastTo } : null,
    moveNotation: s.moveNotation.map((p) => ({ ...p })),
    halfMoveCount: s.halfMoveCount,
  };
}
function snapshotState() {
  return {
    ...makeSnap(),
    history: history.map(copySnap),
    redoStack: redoStack.map(copySnap),
    gameOver,
    playerColor,
    aiColor,
    aiDepth,
    gameMode,
    botName,
    mateLoserPos: mateLoserPos ? { ...mateLoserPos } : null,
    mateWinnerPos: mateWinnerPos ? { ...mateWinnerPos } : null,
  };
}
function restoreState(s) {
  applySnap(s);
  history = s.history.map(copySnap);
  redoStack = s.redoStack.map(copySnap);
  gameOver = s.gameOver;
  playerColor = s.playerColor;
  aiColor = s.aiColor;
  aiDepth = s.aiDepth;
  gameMode = s.gameMode;
  botName = s.botName;
  mateLoserPos = s.mateLoserPos ? { ...s.mateLoserPos } : null;
  mateWinnerPos = s.mateWinnerPos ? { ...s.mateWinnerPos } : null;
  selectedSq = null;
  highlightedMoves = [];
  pendingMove = null;
  pendingPromotion = null;
  hideConfirmBar();
  updateLabels();
  updateBadges();
}

// ══════════════════════════════════════════════
// START
// ══════════════════════════════════════════════
document.getElementById("btn-start").addEventListener("click", () => {
  // If there's a live saved game, confirm before discarding
  if (savedGame) {
    showModal("Cari oyun ləğv edilsin?", [
      { label: "Bəli, yeni oyun", cls: "danger", action: doStartGame },
      { label: "Xeyr, davam et", cls: "secondary", action: continueGame },
    ]);
  } else {
    doStartGame();
  }
});

function doStartGame() {
  if (activeWorker) {
    activeWorker.terminate();
    activeWorker = null;
  }

  aiDepth = parseInt(chosenLevel, 10);
  gameMode = chosenMode;
  botName = randomBotName();

  let pc = chosenColor;
  if (pc === "r") pc = Math.random() < 0.5 ? "w" : "b";
  playerColor = pc;
  aiColor = pc === "w" ? "b" : "w";

  board = createInitialBoard();
  currentPlayer = "w";
  gameOver = false;
  selectedSq = null;
  highlightedMoves = [];
  enPassantTarget = null;
  castlingRights = { wK: true, wQ: true, bK: true, bQ: true };
  history = [];
  redoStack = [];
  lastFrom = null;
  lastTo = null;
  mateLoserPos = null;
  mateWinnerPos = null;
  savedGame = null;
  moveNotation = [];
  halfMoveCount = 0;
  pendingMove = null;
  pendingPromotion = null;

  removeContinueButton();
  hideConfirmBar();
  updateLabels();
  updateBadges();
  showScreen("game");
  renderBoard();
  renderMoveHistory();

  if (aiColor === "w") scheduleBot();
}

// keep old alias
function startGame() {
  doStartGame();
}

function updateLabels() {
  labelTop.textContent = playerColor === "w" ? `${botName}` : `${botName}`;
  labelBotEl.textContent = playerColor === "w" ? "Sən" : "Sən";
}

function createInitialBoard() {
  return [
    ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"],
    ["bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP"],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP"],
    ["wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"],
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
      const row = flip ? 7 - ri : ri;
      const col = flip ? 7 - ci : ci;

      const sq = document.createElement("div");
      sq.className = `square ${(row + col) % 2 === 0 ? "light" : "dark"}`;
      sq.dataset.row = row;
      sq.dataset.col = col;

      if (ci === 0) {
        const span = document.createElement("span");
        span.className = "coord-rank";
        span.textContent = String(8 - row);
        sq.appendChild(span);
      }
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
        img.alt = piece;
        img.draggable = false;
        sq.appendChild(img);
      }

      if (
        (lastFrom && lastFrom.row === row && lastFrom.col === col) ||
        (lastTo && lastTo.row === row && lastTo.col === col)
      )
        sq.classList.add("last-move");

      if (selectedSq && selectedSq.row === row && selectedSq.col === col)
        sq.classList.add("selected");

      // Respect showMoves setting
      if (
        settings.showMoves &&
        highlightedMoves.some((m) => m.row === row && m.col === col)
      )
        sq.classList.add("highlight");

      if (isKingSquareInCheck(row, col)) sq.classList.add("in-check");

      if (mateLoserPos && mateLoserPos.row === row && mateLoserPos.col === col)
        sq.classList.add("mate-loser");
      if (
        mateWinnerPos &&
        mateWinnerPos.row === row &&
        mateWinnerPos.col === col
      )
        sq.classList.add("mate-winner");

      // Dim pending move source square
      if (
        pendingMove &&
        pendingMove.fromRow === row &&
        pendingMove.fromCol === col
      )
        sq.classList.add("selected");
      if (
        pendingMove &&
        pendingMove.mv.row === row &&
        pendingMove.mv.col === col
      )
        sq.classList.add("last-move");

      sq.addEventListener("click", onSquareClick);
      boardEl.appendChild(sq);
    }
  }
}

function getSquareEl(row, col) {
  return boardEl.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
}

// ══════════════════════════════════════════════
// SMOOTH ANIMATION — Web Animations API (mobile-safe)
// ══════════════════════════════════════════════
function animateMove(fromRow, fromCol, toRow, toCol, piece, callback) {
  const sqSize = boardEl.offsetWidth / 8;

  // Board not visible or zero-size — skip animation entirely
  if (sqSize <= 0) {
    callback();
    return;
  }

  const flip = playerColor === "b";
  const posX = (c) => (flip ? 7 - c : c) * sqSize;
  const posY = (r) => (flip ? 7 - r : r) * sqSize;

  const fx = posX(fromCol),
    fy = posY(fromRow);
  const tx = posX(toCol),
    ty = posY(toRow);

  // Hide source and destination images during flight
  const srcImg = getSquareEl(fromRow, fromCol)?.querySelector("img");
  const destImg = getSquareEl(toRow, toCol)?.querySelector("img");
  if (srcImg) srcImg.style.visibility = "hidden";
  if (destImg) destImg.style.visibility = "hidden";

  // Create flying piece — positioned absolutely inside board
  const flyer = document.createElement("div");
  flyer.style.cssText =
    [
      "position:absolute",
      "left:0",
      "top:0",
      "width:" + sqSize + "px",
      "height:" + sqSize + "px",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "pointer-events:none",
      "z-index:50",
      "will-change:transform",
    ].join(";") + ";";
  const img = document.createElement("img");
  img.src = PIECE_SYMBOLS[piece] || "";
  img.draggable = false;
  img.style.cssText = "width:90%;height:90%;object-fit:contain;";
  flyer.appendChild(img);
  boardEl.appendChild(flyer);

  // Cleanup function — called exactly once
  let called = false;
  const done = () => {
    if (called) return;
    called = true;
    flyer.remove();
    if (srcImg) srcImg.style.visibility = "";
    if (destImg) destImg.style.visibility = "";
    callback();
  };

  // Web Animations API — more reliable on mobile than CSS transitions
  const anim = flyer.animate(
    [
      { transform: "translate(" + fx + "px," + fy + "px)" },
      { transform: "translate(" + tx + "px," + ty + "px)" },
    ],
    { duration: 180, easing: "ease-in-out", fill: "forwards" },
  );

  anim.finished.then(done).catch(done);
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
    num.textContent = `${i + 1}.`;
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
function toAlgebraic(
  fromRow,
  fromCol,
  mv,
  boardBefore,
  mover,
  isCheckmate,
  isCheck,
  promoType,
) {
  const piece = boardBefore[fromRow][fromCol];
  const t = piece[1];
  const toFile = FILE_CHARS[mv.col];
  const toRank = String(8 - mv.row);
  const isCapture =
    !!boardBefore[mv.row][mv.col] || mv.flags.includes("enPassant");
  const isPromo = t === "P" && (mv.row === 0 || mv.row === 7);

  let notation = "";

  if (mv.flags.includes("castleK")) notation = "O-O";
  else if (mv.flags.includes("castleQ")) notation = "O-O-O";
  else {
    const pieceChar = PIECE_CHARS[t];
    let disambig = "";
    if (t !== "P") {
      const sameType = [];
      for (let r = 0; r < 8; r++)
        for (let c = 0; c < 8; c++) {
          if (r === fromRow && c === fromCol) continue;
          if (boardBefore[r][c] === piece) {
            const lms = getLegalMoves(
              r,
              c,
              boardBefore,
              enPassantTarget,
              castlingRights,
            );
            if (lms.some((m) => m.row === mv.row && m.col === mv.col))
              sameType.push({ r, c });
          }
        }
      if (sameType.length > 0) {
        const sameFile = sameType.some((p) => p.c === fromCol);
        const sameRank = sameType.some((p) => p.r === fromRow);
        if (!sameFile) disambig = FILE_CHARS[fromCol];
        else if (!sameRank) disambig = String(8 - fromRow);
        else disambig = FILE_CHARS[fromCol] + String(8 - fromRow);
      }
    }
    const capStr = isCapture ? "x" : "";
    const fromFile = t === "P" && isCapture ? FILE_CHARS[fromCol] : "";
    const promoStr = isPromo ? "=" + (promoType || "Q") : "";
    notation = `${pieceChar}${disambig}${fromFile}${capStr}${toFile}${toRank}${promoStr}`;
  }

  if (isCheckmate) notation += "#";
  else if (isCheck) notation += "+";
  return notation;
}

function addMoveToHistory(notation, mover) {
  if (mover === "w") {
    moveNotation.push({ white: notation, black: "" });
  } else {
    if (moveNotation.length === 0)
      moveNotation.push({ white: "...", black: notation });
    else moveNotation[moveNotation.length - 1].black = notation;
  }
  halfMoveCount++;
  renderMoveHistory();
}

// ══════════════════════════════════════════════
// BADGES + BUTTONS
// ══════════════════════════════════════════════
function updateBadges() {
  badgeTop.classList.toggle("active-turn", currentPlayer === aiColor);
  badgeBot.classList.toggle("active-turn", currentPlayer === playerColor);
  if (btnUndo)
    btnUndo.disabled = gameMode === "challenge" || history.length === 0;
  if (btnRedo)
    btnRedo.disabled = gameMode === "challenge" || redoStack.length === 0;
}

// ══════════════════════════════════════════════
// CHESS HELPERS
// ══════════════════════════════════════════════
const inBounds = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
const clr = (p) => (p ? p[0] : "");
const tp = (p) => (p ? p[1] : "");
const isEnemy = (p, c) => p && clr(p) !== c;
const isFriendly = (p, c) => p && clr(p) === c;
const cloneBoard = (st) => st.map((r) => [...r]);
const cloneRights = (r) => ({ ...r });

function getKingPos(color, st) {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (st[r][c] === color + "K") return { row: r, col: c };
  return null;
}

function pseudoMoves(row, col, st, epTgt, cRights, attackOnly = false) {
  const moves = [];
  const pc = st[row][col];
  if (!pc) return moves;
  const c = clr(pc),
    t = tp(pc);

  if (t === "P") {
    const fwd = c === "w" ? -1 : 1,
      startRow = c === "w" ? 6 : 1;
    if (!attackOnly) {
      const one = row + fwd;
      if (inBounds(one, col) && !st[one][col]) {
        moves.push({ row: one, col, flags: [] });
        const two = row + fwd * 2;
        if (row === startRow && !st[two][col])
          moves.push({ row: two, col, flags: ["doublePush"] });
      }
    }
    for (const dc of [-1, 1]) {
      const cr = row + fwd,
        cc = col + dc;
      if (!inBounds(cr, cc)) continue;
      if (isEnemy(st[cr][cc], c)) moves.push({ row: cr, col: cc, flags: [] });
      else if (attackOnly) moves.push({ row: cr, col: cc, flags: [] });
      if (!attackOnly && epTgt && epTgt.row === cr && epTgt.col === cc)
        moves.push({ row: cr, col: cc, flags: ["enPassant"] });
    }
    return moves;
  }
  if (t === "N") {
    for (const [dr, dc] of [
      [-2, -1],
      [-2, 1],
      [-1, -2],
      [-1, 2],
      [1, -2],
      [1, 2],
      [2, -1],
      [2, 1],
    ]) {
      const nr = row + dr,
        nc = col + dc;
      if (inBounds(nr, nc) && !isFriendly(st[nr][nc], c))
        moves.push({ row: nr, col: nc, flags: [] });
    }
    return moves;
  }
  if (t === "K") {
    for (const [dr, dc] of [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ]) {
      const nr = row + dr,
        nc = col + dc;
      if (inBounds(nr, nc) && !isFriendly(st[nr][nc], c))
        moves.push({ row: nr, col: nc, flags: [] });
    }
    if (!attackOnly) {
      const rank = c === "w" ? 7 : 0;
      if (row === rank && col === 4) {
        if (
          cRights[c + "K"] &&
          !st[rank][5] &&
          !st[rank][6] &&
          st[rank][7] === c + "R" &&
          !isAttacked(rank, 4, c, st) &&
          !isAttacked(rank, 5, c, st) &&
          !isAttacked(rank, 6, c, st)
        )
          moves.push({ row: rank, col: 6, flags: ["castleK"] });
        if (
          cRights[c + "Q"] &&
          !st[rank][3] &&
          !st[rank][2] &&
          !st[rank][1] &&
          st[rank][0] === c + "R" &&
          !isAttacked(rank, 4, c, st) &&
          !isAttacked(rank, 3, c, st) &&
          !isAttacked(rank, 2, c, st)
        )
          moves.push({ row: rank, col: 2, flags: ["castleQ"] });
      }
    }
    return moves;
  }
  const dirs = {
    R: [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ],
    B: [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ],
    Q: [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ],
  };
  for (const [dr, dc] of dirs[t] || []) {
    let nr = row + dr,
      nc = col + dc;
    while (inBounds(nr, nc)) {
      if (isFriendly(st[nr][nc], c)) break;
      moves.push({ row: nr, col: nc, flags: [] });
      if (st[nr][nc]) break;
      nr += dr;
      nc += dc;
    }
  }
  return moves;
}

function isAttacked(row, col, friendlyColor, st) {
  const eClr = friendlyColor === "w" ? "b" : "w";
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      if (clr(st[r][c]) !== eClr) continue;
      if (
        pseudoMoves(
          r,
          c,
          st,
          null,
          { wK: false, wQ: false, bK: false, bQ: false },
          true,
        ).some((m) => m.row === row && m.col === col)
      )
        return true;
    }
  return false;
}

function isKingInCheck(color, st) {
  const kp = getKingPos(color, st);
  return kp ? isAttacked(kp.row, kp.col, color, st) : false;
}

function applyMove(fromRow, fromCol, mv, st, color, cRights, promoType) {
  const nst = cloneBoard(st);
  const pc = nst[fromRow][fromCol],
    t_ = tp(pc);
  let newEp = null;
  const newR = cloneRights(cRights);
  nst[mv.row][mv.col] = pc;
  nst[fromRow][fromCol] = "";
  if (mv.flags.includes("enPassant"))
    nst[color === "w" ? mv.row + 1 : mv.row - 1][mv.col] = "";
  if (mv.flags.includes("doublePush"))
    newEp = { row: color === "w" ? mv.row + 1 : mv.row - 1, col: mv.col };
  if (t_ === "P" && (mv.row === 0 || mv.row === 7))
    nst[mv.row][mv.col] = color + (promoType || "Q");
  if (mv.flags.includes("castleK")) {
    const rank = color === "w" ? 7 : 0;
    nst[rank][5] = color + "R";
    nst[rank][7] = "";
  }
  if (mv.flags.includes("castleQ")) {
    const rank = color === "w" ? 7 : 0;
    nst[rank][3] = color + "R";
    nst[rank][0] = "";
  }
  if (t_ === "K") {
    newR[color + "K"] = false;
    newR[color + "Q"] = false;
  }
  if (t_ === "R") {
    if (fromCol === 7) newR[color + "K"] = false;
    if (fromCol === 0) newR[color + "Q"] = false;
  }
  return [nst, newEp, newR];
}

function getLegalMoves(row, col, st, epTgt, cRights) {
  const pc = st[row][col];
  if (!pc) return [];
  const c = clr(pc);
  return pseudoMoves(row, col, st, epTgt, cRights).filter((mv) => {
    const [nst] = applyMove(row, col, mv, st, c, cRights);
    return !isKingInCheck(c, nst);
  });
}

function hasAnyLegalMoves(color, st, epTgt, cRights) {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      if (clr(st[r][c]) !== color) continue;
      if (getLegalMoves(r, c, st, epTgt, cRights).length > 0) return true;
    }
  return false;
}

// ══════════════════════════════════════════════
// CLICK
// ══════════════════════════════════════════════
function onSquareClick(e) {
  if (gameOver || currentPlayer !== playerColor) return;
  if (pendingMove || pendingPromotion) return; // block clicks during confirm/promo
  const row = +e.currentTarget.dataset.row;
  const col = +e.currentTarget.dataset.col;
  const piece = board[row][col];

  if (
    selectedSq &&
    highlightedMoves.some((m) => m.row === row && m.col === col)
  ) {
    const mv = highlightedMoves.find((m) => m.row === row && m.col === col);
    handlePlayerMove(selectedSq.row, selectedSq.col, mv);
    return;
  }

  if (piece && clr(piece) === playerColor) {
    selectedSq = { row, col };
    highlightedMoves = getLegalMoves(
      row,
      col,
      board,
      enPassantTarget,
      castlingRights,
    );
    setMsg("Hərəkət seçin.");
  } else {
    selectedSq = null;
    highlightedMoves = [];
  }
  renderBoard();
}

// ══════════════════════════════════════════════
// PLAYER MOVE PIPELINE
// player move → (confirm?) → (promote?) → execute
// ══════════════════════════════════════════════
function handlePlayerMove(fromRow, fromCol, mv) {
  const piece = board[fromRow][fromCol];
  const isPromoMove = tp(piece) === "P" && (mv.row === 0 || mv.row === 7);

  if (settings.confirmMove) {
    // Show confirm bar first, then promotion if needed
    pendingMove = {
      fromRow,
      fromCol,
      mv,
      mover: playerColor,
      isPromo: isPromoMove,
    };
    selectedSq = null;
    highlightedMoves = [];
    renderBoard();
    showConfirmBar();
  } else if (isPromoMove && !settings.autoQueen) {
    // Ask promotion directly
    selectedSq = null;
    highlightedMoves = [];
    renderBoard();
    showPromotionDialog(fromRow, fromCol, mv, playerColor);
  } else {
    selectedSq = null;
    highlightedMoves = [];
    executeMove(fromRow, fromCol, mv, playerColor, true, null);
  }
}

// ── Confirm Bar ──────────────────────────────
function showConfirmBar() {
  if (confirmBar) return;
  const bottomBar = document.querySelector(".bottom-bar");

  Array.from(bottomBar.children).forEach(
    (ch) => (ch.style.visibility = "hidden"),
  );

  confirmBar = document.createElement("div");
  confirmBar.id = "confirm-bar";

  const label = document.createElement("span");
  label.style.cssText = "font-size:.82rem;color:var(--text-muted);flex:1;";
  label.textContent = "Gedişi təsdiq et?";

  const btnYes = document.createElement("button");
  btnYes.className = "confirm-yes";
  btnYes.innerHTML = '<img src="icons/tesdiq1.svg"> Təsdiq';
  btnYes.addEventListener("click", onConfirmYes);

  const btnNo = document.createElement("button");
  btnNo.className = "confirm-no";
  btnNo.innerHTML = '<img src="icons/legv.svg"> Ləğv';
  btnNo.addEventListener("click", onConfirmNo);

  confirmBar.appendChild(label);
  confirmBar.appendChild(btnNo);
  confirmBar.appendChild(btnYes);

  bottomBar.style.position = "relative";
  bottomBar.appendChild(confirmBar);
}
function hideConfirmBar() {
  if (!confirmBar) return;
  confirmBar.remove();
  confirmBar = null;
  const bottomBar = document.querySelector(".bottom-bar");
  bottomBar.style.position = "";
  Array.from(bottomBar.children).forEach((ch) => (ch.style.visibility = ""));
}

function onConfirmYes() {
  hideConfirmBar();
  const pm = pendingMove;
  pendingMove = null;
  if (!pm) return;
  if (pm.isPromo && !settings.autoQueen) {
    showPromotionDialog(pm.fromRow, pm.fromCol, pm.mv, pm.mover);
  } else {
    executeMove(pm.fromRow, pm.fromCol, pm.mv, pm.mover, true, null);
  }
}

function onConfirmNo() {
  hideConfirmBar();
  pendingMove = null;
  selectedSq = null;
  highlightedMoves = [];
  renderBoard();
  setMsg("Hərəkət seçin.");
}

// ── Promotion Dialog ──────────────────────────
function showPromotionDialog(fromRow, fromCol, mv, mover) {
  pendingPromotion = { fromRow, fromCol, mv, mover };

  const color = mover;
  const pieces = ["Q", "R", "B", "N"];
  const icons = {
    Q: PIECE_SYMBOLS[color + "Q"],
    R: PIECE_SYMBOLS[color + "R"],
    B: PIECE_SYMBOLS[color + "B"],
    N: PIECE_SYMBOLS[color + "N"],
  };
  const names = { Q: "Vəzir", R: "Top", B: "Fil", N: "At" };

  modalText.textContent = "Hansı fiqura çevrilsin?";
  modalBtns.innerHTML = "";

  pieces.forEach((p) => {
    const btn = document.createElement("button");
    btn.className = "modal-btn secondary";
    btn.style.cssText =
      "display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 14px;";
    btn.innerHTML = `<img src="${icons[p]}" style="width:36px;height:36px;object-fit:contain" draggable="false"><span style="font-size:.75rem">${names[p]}</span>`;
    btn.addEventListener("click", () => {
      hideModal();
      const pp = pendingPromotion;
      pendingPromotion = null;
      executeMove(pp.fromRow, pp.fromCol, pp.mv, pp.mover, true, p);
    });
    modalBtns.appendChild(btn);
  });

  modalOverlay.classList.remove("hidden");
}

// ══════════════════════════════════════════════
// EXECUTE + COMMIT MOVE
// ══════════════════════════════════════════════
function executeMove(fromRow, fromCol, mv, mover, animate, promoType) {
  const piece = board[fromRow][fromCol];
  if (animate) {
    animateMove(fromRow, fromCol, mv.row, mv.col, piece, () =>
      commitMove(fromRow, fromCol, mv, mover, promoType),
    );
  } else {
    commitMove(fromRow, fromCol, mv, mover, promoType);
  }
}

function commitMove(fromRow, fromCol, mv, mover, promoType) {
  const boardBefore = cloneBoard(board);

  history.push(makeSnap());
  redoStack = [];

  const isCapture = !!board[mv.row][mv.col] || mv.flags.includes("enPassant");
  const isCastle = mv.flags.includes("castleK") || mv.flags.includes("castleQ");

  const [nst, newEp, newR] = applyMove(
    fromRow,
    fromCol,
    mv,
    board,
    mover,
    castlingRights,
    promoType,
  );
  board = nst;
  enPassantTarget = newEp;
  castlingRights = newR;
  lastFrom = { row: fromRow, col: fromCol };
  lastTo = { row: mv.row, col: mv.col };
  selectedSq = null;
  highlightedMoves = [];

  const next = mover === "w" ? "b" : "w";
  const inCheck = isKingInCheck(next, board);
  const hasMoves = hasAnyLegalMoves(
    next,
    board,
    enPassantTarget,
    castlingRights,
  );
  const isCheckmate = !hasMoves && inCheck;

  const notation = toAlgebraic(
    fromRow,
    fromCol,
    mv,
    boardBefore,
    mover,
    isCheckmate,
    inCheck,
    promoType,
  );
  addMoveToHistory(notation, mover);

  if (isCheckmate) playSound("checkmate");
  else if (inCheck) playSound("check");
  else if (isCastle) playSound("castle");
  else if (isCapture) playSound("capture");
  else playSound("move");

  if (!hasMoves) {
    gameOver = true;
    if (inCheck) {
      mateLoserPos = getKingPos(next, board);
      mateWinnerPos = getKingPos(mover, board);
      const winner = mover === playerColor ? "Sən" : botName;
      setMsg(`Mat! Qalib: ${winner} 🏆`);
      renderBoard();
      // Only confetti if PLAYER wins
      if (mover === playerColor) setTimeout(() => launchConfetti(), 350);
    } else {
      setMsg("Pat: Bərabərlik!");
      renderBoard();
    }
    showGameOverModal(mover);
    return;
  }

  currentPlayer = next;
  updateBadges();
  if (inCheck) setMsg(`${next === playerColor ? "Sən" : botName} Şah!`);
  else
    setMsg(next === playerColor ? "Hərəkət seçin." : `${botName} düşünür...`);

  renderBoard();
  if (!gameOver && currentPlayer === aiColor) scheduleBot();
}

// ══════════════════════════════════════════════
// GAME OVER MODAL
// ══════════════════════════════════════════════
function showGameOverModal(winner) {
  setTimeout(() => {
    const msg =
      winner === playerColor
        ? `Təbriklər! ${botName}-ı məğlub etdin! 🏆`
        : `${botName} səni mat etdi. Növbəti dəfə daha yaxşı olarsan!`;
    showModal(msg, [
      { label: "Yenidən oyna", cls: "primary", action: doStartGame },
      {
        label: "Ana səhifə",
        cls: "secondary",
        action: () => showScreen("menu"),
      },
    ]);
  }, 1400);
}

// ══════════════════════════════════════════════
// UNDO
// ══════════════════════════════════════════════
btnUndo.addEventListener("click", () => {
  if (gameMode === "challenge" || history.length === 0) return;
  if (activeWorker) {
    activeWorker.terminate();
    activeWorker = null;
  }
  hideConfirmBar();
  pendingMove = null;
  pendingPromotion = null;
  redoStack.push(makeSnap());
  const prev = history.pop();
  applySnap(prev);
  gameOver = false;
  mateLoserPos = null;
  mateWinnerPos = null;
  selectedSq = null;
  highlightedMoves = [];
  updateBadges();
  setMsg("Hərəkət seçin.");
  renderBoard();
  renderMoveHistory();
});

// ══════════════════════════════════════════════
// REDO
// ══════════════════════════════════════════════
btnRedo.addEventListener("click", () => {
  if (gameMode === "challenge" || redoStack.length === 0) return;
  if (activeWorker) {
    activeWorker.terminate();
    activeWorker = null;
  }
  hideConfirmBar();
  pendingMove = null;
  pendingPromotion = null;
  history.push(makeSnap());
  const next = redoStack.pop();
  applySnap(next);
  selectedSq = null;
  highlightedMoves = [];
  updateBadges();
  if (!gameOver && currentPlayer === aiColor) scheduleBot();
  else setMsg("Hərəkət seçin.");
  renderBoard();
  renderMoveHistory();
});

// ══════════════════════════════════════════════
// RESIGN
// ══════════════════════════════════════════════
btnResign.addEventListener("click", () => {
  if (gameOver) return;
  showModal("Təslim olmaq istədiyinə əminsən?", [
    { label: "Bəli, təslim ol", cls: "danger", action: doResign },
    { label: "Xeyr, davam et", cls: "secondary", action: () => {} },
  ]);
});

function doResign() {
  if (activeWorker) {
    activeWorker.terminate();
    activeWorker = null;
  }
  gameOver = true;
  mateWinnerPos = getKingPos(aiColor, board);
  mateLoserPos = getKingPos(playerColor, board);
  setMsg(`Təslim oldun. Qalib: ${botName}`);
  renderBoard();
  showModal(`Təslim oldun. ${botName} qalib gəldi!`, [
    { label: "Yenidən oyna", cls: "primary", action: doStartGame },
    { label: "Ana səhifə", cls: "secondary", action: () => showScreen("menu") },
  ]);
}

// ══════════════════════════════════════════════
// SETTINGS PANEL
// ══════════════════════════════════════════════
document.getElementById("btn-settings").addEventListener("click", openSettingsPanel);

function openSettingsPanel() {
  // Build overlay (not fixed — use in-flow faux viewport trick for iframe compat)
  const overlay = document.createElement("div");
  overlay.id = "settings-overlay";
  overlay.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,.72);
    display:flex;align-items:flex-end;justify-content:center;
    z-index:300;animation:fade-in .18s ease;
  `;

  const panel = document.createElement("div");
  panel.style.cssText = `
    background:#1a1a1a;border:1px solid rgba(255,255,255,.1);
    border-radius:16px 16px 0 0;width:100%;max-width:520px;
    padding:20px 20px 32px;display:flex;flex-direction:column;gap:0;
    animation:modal-in .22s cubic-bezier(.34,1.56,.64,1);
  `;

  // Header
  const header = document.createElement("div");
  header.style.cssText = "display:flex;align-items:center;margin-bottom:20px;";
  header.innerHTML = `
    <span style="font-family:'Playfair Display',serif;font-size:1.1rem;color:var(--accent);flex:1;">Ayarlar</span>
    <button id="settings-close" style="width:32px;height:32px;border:1px solid rgba(255,255,255,.15);border-radius:8px;background:rgba(255,255,255,.06);color:var(--text);font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>
  `;
  panel.appendChild(header);

  // Settings items
  const items = [
    {
      key: "confirmMove",
      label: "Hər gedişi təsdiq et",
      desc: null,
    },
    {
      key: "showMoves",
      label: "Mümkün gedişləri göstər",
      desc: null,
    },
    {
      key: "sound",
      label: "Səs effektləri",
      desc: null,
    },
    {
      key: "autoQueen",
      label: "Avto-Vəzir",
      desc: "Piyada sonuncu xanaya çatdıqda avtomatik Vəzirə çevir.",
    },
  ];

  items.forEach((item, idx) => {
    const row = document.createElement("div");
    row.style.cssText = `
      display:flex;align-items:center;gap:12px;
      padding:14px 0;
      ${idx < items.length - 1 ? "border-bottom:1px solid rgba(255,255,255,.07);" : ""}
    `;

    const textWrap = document.createElement("div");
    textWrap.style.cssText =
      "flex:1;display:flex;flex-direction:column;gap:3px;";
    textWrap.innerHTML = `<span style="font-size:.88rem;font-weight:600;color:var(--text);">${item.label}</span>`;
    if (item.desc) {
      const d = document.createElement("span");
      d.style.cssText =
        "font-size:.74rem;color:var(--text-muted);line-height:1.4;";
      d.textContent = item.desc;
      textWrap.appendChild(d);
    }

    const toggle = buildToggle(settings[item.key], (val) => {
      settings[item.key] = val;
    });

    row.appendChild(textWrap);
    row.appendChild(toggle);
    panel.appendChild(row);
  });

  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  document
    .getElementById("settings-close")
    .addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

function buildToggle(initialValue, onChange) {
  const wrap = document.createElement("label");
  wrap.style.cssText =
    "position:relative;display:inline-block;width:48px;height:26px;flex-shrink:0;cursor:pointer;";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = initialValue;
  input.style.cssText = "opacity:0;width:0;height:0;position:absolute;";

  const slider = document.createElement("span");
  slider.style.cssText = `
    position:absolute;inset:0;border-radius:26px;
    background:${initialValue ? "var(--accent)" : "rgba(255,255,255,.15)"};
    transition:background .2s;
  `;
  const thumb = document.createElement("span");
  thumb.style.cssText = `
    position:absolute;top:3px;left:${initialValue ? "25px" : "3px"};
    width:20px;height:20px;border-radius:50%;background:#fff;
    transition:left .2s;
  `;
  slider.appendChild(thumb);

  input.addEventListener("change", () => {
    const val = input.checked;
    slider.style.background = val ? "var(--accent)" : "rgba(255,255,255,.15)";
    thumb.style.left = val ? "25px" : "3px";
    onChange(val);
  });

  wrap.appendChild(input);
  wrap.appendChild(slider);
  return wrap;
}

// ══════════════════════════════════════════════
// BOT — Web Worker
// ══════════════════════════════════════════════
function scheduleBot() {
  setMsg(`düşünür...`);
  setTimeout(doBotMove, 100);
}

function doBotMove() {
  if (gameOver || currentPlayer !== aiColor) return;

  if (activeWorker) {
    activeWorker.terminate();
    activeWorker = null;
  }

  const worker = new Worker("./bot.js");
  activeWorker = worker;

  worker.postMessage({
    board: board.map((r) => [...r]),
    depth: aiDepth,
    aiColor,
    playerColor,
    ep: enPassantTarget ? { ...enPassantTarget } : null,
    rights: { ...castlingRights },
  });

  worker.onmessage = (e) => {
    worker.terminate();
    if (activeWorker === worker) activeWorker = null;
    const move = e.data;
    if (move && !gameOver && currentPlayer === aiColor) {
      executeMove(move.from.row, move.from.col, move.to, aiColor, true, null);
    }
  };

  worker.onerror = (err) => {
    console.error("Bot worker xətası:", err);
    worker.terminate();
    if (activeWorker === worker) activeWorker = null;
  };
}

// ══════════════════════════════════════════════
// MISC
// ══════════════════════════════════════════════
function isKingSquareInCheck(row, col) {
  const pc = board[row][col];
  return pc && tp(pc) === "K" ? isKingInCheck(clr(pc), board) : false;
}
function setMsg(text) {
  msgEl.textContent = text;
}

// ══════════════════════════════════════════════
// CONFETTI  — only when player wins
// ══════════════════════════════════════════════
function launchConfetti() {
  const canvas = document.createElement("canvas");
  Object.assign(canvas.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "999",
  });
  document.body.appendChild(canvas);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext("2d");
  const colors = [
    "#ff2244",
    "#00ff88",
    "#c9a84c",
    "#4fc3f7",
    "#ff80ab",
    "#b39ddb",
    "#fff176",
    "#ffab40",
  ];
  const pieces = Array.from({ length: 180 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * 200,
    w: 8 + Math.random() * 10,
    h: 4 + Math.random() * 6,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * Math.PI * 2,
    rotS: (Math.random() - 0.5) * 0.2,
    vx: (Math.random() - 0.5) * 4,
    vy: 2.5 + Math.random() * 4,
    op: 1,
  }));
  let frame = 0;
  const MAX = 230;
  (function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of pieces) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.07;
      p.rot += p.rotS;
      if (frame > MAX * 0.6) p.op = Math.max(0, p.op - 0.016);
      ctx.save();
      ctx.globalAlpha = p.op;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (++frame < MAX) requestAnimationFrame(draw);
    else canvas.remove();
  })();
}

// ══════════════════════════════════════════════
// BACK BUTTON — Capacitor (no import)
// ══════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  if (
    window.Capacitor &&
    window.Capacitor.Plugins &&
    window.Capacitor.Plugins.App
  ) {
    window.Capacitor.Plugins.App.addListener("backButton", () => {
      if (screenGame.classList.contains("active")) {
        btnMenuBtn.click();
      } else {
        window.Capacitor.Plugins.App.exitApp();
      }
    });
  }
});
