const SIZE = 4;
const STORAGE_BEST = '2048-best-score';

let board = [];
let score = 0;
let best = Number(localStorage.getItem(STORAGE_BEST)) || 0;
let won = false;
let over = false;

const tilesEl = document.getElementById('tiles');
const gridEl = document.getElementById('grid');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const overlayEl = document.getElementById('overlay');
const overlayMsgEl = document.getElementById('overlay-msg');
const overlayBtn = document.getElementById('overlay-btn');
const newGameBtn = document.getElementById('new-game');

function init() {
  for (let i = 0; i < SIZE * SIZE; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell-bg';
    gridEl.appendChild(cell);
  }
  bestEl.textContent = best;
  startGame();

  document.addEventListener('keydown', handleKey);
  newGameBtn.addEventListener('click', startGame);
  overlayBtn.addEventListener('click', startGame);

  setupTouch();
}

function startGame() {
  board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  score = 0;
  won = false;
  over = false;
  overlayEl.classList.add('hidden');
  addRandomTile();
  addRandomTile();
  render();
}

function addRandomTile() {
  const empty = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  board[r][c] = Math.random() < 0.9 ? 2 : 4;
}

function render() {
  tilesEl.innerHTML = '';
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const value = board[r][c];
      if (value === 0) continue;
      const tile = document.createElement('div');
      tile.className = `tile tile-${value > 2048 ? 'super' : value}`;
      if (value > 2048) {
        tile.style.background = '#3c3a32';
        tile.style.color = '#f9f6f2';
        tile.style.fontSize = '20px';
      }
      tile.textContent = value;
      tile.style.gridRowStart = r + 1;
      tile.style.gridColumnStart = c + 1;
      tilesEl.appendChild(tile);
    }
  }
  scoreEl.textContent = score;
  if (score > best) {
    best = score;
    localStorage.setItem(STORAGE_BEST, best);
  }
  bestEl.textContent = best;
}

function handleKey(e) {
  if (over) return;
  let moved = false;
  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault();
      moved = move('up');
      break;
    case 'ArrowDown':
      e.preventDefault();
      moved = move('down');
      break;
    case 'ArrowLeft':
      e.preventDefault();
      moved = move('left');
      break;
    case 'ArrowRight':
      e.preventDefault();
      moved = move('right');
      break;
    default:
      return;
  }
  if (moved) afterMove();
}

function afterMove() {
  addRandomTile();
  render();
  if (!won && hasTile(2048)) {
    won = true;
    showOverlay('You win! 🎉');
  } else if (!canMove()) {
    over = true;
    showOverlay('Game over');
  }
}

function showOverlay(msg) {
  overlayMsgEl.textContent = msg;
  overlayBtn.textContent = msg.startsWith('You win') ? 'Keep Going / Restart' : 'Try Again';
  overlayEl.classList.remove('hidden');
  if (msg.startsWith('You win')) {
    overlayBtn.onclick = () => {
      overlayEl.classList.add('hidden');
    };
  } else {
    overlayBtn.onclick = startGame;
  }
}

function hasTile(value) {
  return board.some(row => row.some(cell => cell === value));
}

function canMove() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) return true;
      if (c < SIZE - 1 && board[r][c] === board[r][c + 1]) return true;
      if (r < SIZE - 1 && board[r][c] === board[r + 1][c]) return true;
    }
  }
  return false;
}

// Move logic: collapse a line towards the front, merging equal values once.
function collapseLine(line) {
  const filtered = line.filter(v => v !== 0);
  const result = [];
  let mergedScore = 0;
  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] === filtered[i + 1]) {
      const merged = filtered[i] * 2;
      result.push(merged);
      mergedScore += merged;
      i++;
    } else {
      result.push(filtered[i]);
    }
  }
  while (result.length < SIZE) result.push(0);
  return { result, mergedScore };
}

function move(direction) {
  let moved = false;

  for (let i = 0; i < SIZE; i++) {
    let line;
    if (direction === 'left') {
      line = board[i];
    } else if (direction === 'right') {
      line = [...board[i]].reverse();
    } else if (direction === 'up') {
      line = board.map(row => row[i]);
    } else { // down
      line = board.map(row => row[i]).reverse();
    }

    const { result, mergedScore } = collapseLine(line);
    score += mergedScore;

    let finalLine = result;
    if (direction === 'right' || direction === 'down') {
      finalLine = [...result].reverse();
    }

    for (let j = 0; j < SIZE; j++) {
      let oldVal;
      if (direction === 'left' || direction === 'right') {
        oldVal = board[i][j];
        if (board[i][j] !== finalLine[j]) moved = true;
        board[i][j] = finalLine[j];
      } else {
        oldVal = board[j][i];
        if (board[j][i] !== finalLine[j]) moved = true;
        board[j][i] = finalLine[j];
      }
    }
  }

  return moved;
}

// Touch / swipe support
function setupTouch() {
  let startX = 0, startY = 0;
  const wrap = document.getElementById('board-wrap');

  wrap.addEventListener('touchstart', e => {
    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
  }, { passive: true });

  wrap.addEventListener('touchend', e => {
    if (over) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const threshold = 24;
    if (Math.max(absX, absY) < threshold) return;

    let direction;
    if (absX > absY) {
      direction = dx > 0 ? 'right' : 'left';
    } else {
      direction = dy > 0 ? 'down' : 'up';
    }
    if (move(direction)) afterMove();
  }, { passive: true });
}

init();
