// Through the Woods — Isometric Tavern with Red Riding Hood
// p5.js sketch
//
// Fixes in this version:
// 1) Wall pack quirk: only wall-ur-4 and wall-ur-5 are true “left wall” sprites.
//    All other wall-ur-* need to be mirrored when used on the LEFT wall.
//    → Implement per-object horizontal flip (flipX) in renderer.
// 2) Collision: table was blocking a fat 2x2 region that doesn't match the sprite footprint.
//    → Reduce table collision to a single tile (plus optional “soft” neighbor if you want).
// 3) Offsets: stop trying to globally shove walls; anchor bottom-center and only use small per-wall nudges.

// ---- Tile dimensions (native pixel art) ----
const TILE_W = 32;
const TILE_H = 16;
const HALF_W = 16;
const HALF_H = 8;

// ---- Display scale ----
let SCALE = 3;

// ---- Sprite frames ----
const FRAME_W = 32;
const FRAME_H = 32;
const CHAR_SCALE = 0.9;
const SPEED = 0.06;
const ANIM_SPEED = 7;
const DIR = { down: 0, left: 1, right: 2, up: 3 };

// ---- Room grid ----
const COLS = 12;
const ROWS = 10;

// ---- Floor tile map (0-5) ----
const FLOOR_MAP = [
  [ 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3],
  [ 3, 2, 1, 0, 3, 2, 0, 1, 3, 2, 1, 0],
  [ 1, 0, 3, 2, 1, 0, 3, 2, 1, 0, 3, 2],
  [ 2, 3, 0, 1, 2, 3, 1, 0, 2, 3, 0, 1],
  [ 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3],
  [ 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2],
  [ 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0],
  [ 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1],
  [ 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3],
  [ 3, 2, 1, 0, 3, 2, 1, 0, 3, 2, 1, 0],
];

// ---- Layout ----
const DOOR_COL = 10;         // top wall door
const BAR_ROW = 1;
const BAR_COL_START = 6;
const BAR_COL_END = 10;

// Micro nudges (native px) — these are safe, keep tiny.
// If something is still a pixel off, adjust these by +/-1 or +/-2.
const LEFT_WALL_NUDGE_X = -2;
const TOP_WALL_NUDGE_X  = +2;

// ---- Collision map ----
const COLLISION = [];

// ---- Assets ----
let floorTiles = [];
let charSheet;
const IMG = {};

// ---- Objects ----
// { img, col, row, offX, offY, anchor, flipX, depthBias }
const OBJECTS = [];

// ---- Player ----
let player;

// ---- Render origin ----
let originX, originY;

function preload() {
  charSheet = loadImage('redridinghood.png');

  for (let i = 1; i <= 6; i++) {
    floorTiles.push(loadImage(`assets/floor-${i}.png`));
  }

  const names = [
    'wall-ul-1', 'wall-ul-2', 'wall-ul-3', 'wall-ul-door', 'wall-ul-window',
    'wall-ur-1', 'wall-ur-2', 'wall-ur-3', 'wall-ur-4', 'wall-ur-5',
    'pillar-l-1', 'pillar-r-1', 'beam-l', 'beam-r',
    'counter-1', 'counter-2', 'counter-3', 'counter-4', 'counter-5',
    'table-1', 'table-2', 'table-3', 'table-4', 'table-5', 'table-6',
    'barrel-1', 'barrel-2', 'barrel-3',
    'crate-1', 'crate-2', 'crate-stack-1', 'crate-stack-2',
    'stool-1', 'stool-2',
    'sign-1', 'sign-2', 'torch-1', 'torch-2',
    'small-1', 'small-2', 'small-3', 'small-4', 'small-5',
    'small-6', 'small-7', 'small-8', 'small-9', 'small-10',
  ];

  for (const n of names) {
    IMG[n] = loadImage(`assets/${n}.png`);
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noSmooth();

  const roomPixelW = (COLS + ROWS) * HALF_W;
  const roomPixelH = (COLS + ROWS) * HALF_H + 84;

  const scaleX = windowWidth / (roomPixelW * 1.15);
  const scaleY = windowHeight / (roomPixelH * 1.15);
  SCALE = Math.max(1, Math.floor(Math.min(scaleX, scaleY)));

  computeOrigin();

  for (let r = 0; r < ROWS; r++) {
    COLLISION[r] = [];
    for (let c = 0; c < COLS; c++) COLLISION[r][c] = 0;
  }

  buildRoom();
  markBlocked();

  player = {
    col: 5.5,
    row: 7.5,
    dir: DIR.down,
    frame: 0,
    animTimer: 0,
    moving: false,
  };
}

function computeOrigin() {
  const roomH = (COLS + ROWS) * HALF_H * SCALE;
  originX = windowWidth / 2;
  originY = (windowHeight - roomH) / 2 + 54 * SCALE;
}

function gridToScreen(col, row) {
  return {
    x: (col - row) * HALF_W,
    y: (col + row) * HALF_H,
  };
}

function drawAnchored(img, x, y, {
  offX = 0,
  offY = 0,
  anchor = 'bottom',
  flipX = false,
} = {}) {
  if (!img) return;

  const px = x + offX;
  const py = y + offY;

  imageMode(CENTER);

  if (anchor === 'center') {
    push();
    translate(px, py);
    if (flipX) scale(-1, 1);
    image(img, 0, 0);
    pop();
    return;
  }

  // bottom-center anchor
  const by = py - img.height / 2;
  push();
  translate(px, by);
  if (flipX) scale(-1, 1);
  image(img, 0, 0);
  pop();
}

function addObj(imgName, col, row, {
  offX = 0,
  offY = 0,
  anchor = 'bottom',
  flipX = false,
  depthBias = 0,
} = {}) {
  OBJECTS.push({ img: imgName, col, row, offX, offY, anchor, flipX, depthBias });
}

function buildRoom() {
  OBJECTS.length = 0;

  // ---------------------------------------------------------------------------
  // WALLS
  // Top wall (row=0): UL set (no flipping)
  // Left wall (col=0): UR set, but UR-1..3 must be mirrored for left wall.
  // Only UR-4 and UR-5 are already correct-facing.
  // ---------------------------------------------------------------------------

  // LEFT WALL (col=0): UR sprites, flip UR-1..3
  const leftWallCycle = ['wall-ur-1', 'wall-ur-2', 'wall-ur-3', 'wall-ur-4', 'wall-ur-5'];

  for (let r = 0; r < ROWS; r++) {
    if (r % 3 === 0 && r !== 0 && r < ROWS - 1) {
      addObj('pillar-r-1', 0, r, { offX: LEFT_WALL_NUDGE_X, offY: 0, flipX: false });
    }

    const name = leftWallCycle[r % leftWallCycle.length];
    const needsFlip = (name === 'wall-ur-1' || name === 'wall-ur-2' || name === 'wall-ur-3');

    addObj(name, 0, r, {
      offX: LEFT_WALL_NUDGE_X,
      offY: 0,
      flipX: needsFlip,
    });
  }

  addObj('beam-r', 0, ROWS - 1, { offX: LEFT_WALL_NUDGE_X, offY: 0, flipX: false });

  // TOP WALL (row=0): UL sprites (no flipping)
  const topWallCycle = ['wall-ul-1', 'wall-ul-2', 'wall-ul-3', 'wall-ul-1', 'wall-ul-window'];

  for (let c = 0; c < COLS; c++) {
    if (c % 3 === 0 && c !== 0 && c < COLS - 1) {
      addObj('pillar-l-1', c, 0, { offX: TOP_WALL_NUDGE_X, offY: 0, flipX: false });
    }

    if (c === DOOR_COL) {
      addObj('wall-ul-door', c, 0, { offX: TOP_WALL_NUDGE_X, offY: 0, flipX: false });
    } else {
      addObj(topWallCycle[c % topWallCycle.length], c, 0, { offX: TOP_WALL_NUDGE_X, offY: 0, flipX: false });
    }
  }

  addObj('beam-l', COLS - 1, 0, { offX: TOP_WALL_NUDGE_X, offY: 0, flipX: false });

  // Corner pillar (match left wall)
  addObj('pillar-r-1', 0, 0, { offX: LEFT_WALL_NUDGE_X, offY: 0, flipX: false });

  // ---------------------------------------------------------------------------
  // MINIMAL INTERIOR (bar + 1 table)
  // ---------------------------------------------------------------------------

  const counters = ['counter-1', 'counter-2', 'counter-3', 'counter-4', 'counter-5'];
  let ci = 0;
  for (let c = BAR_COL_START; c <= BAR_COL_END; c++) {
    addObj(counters[Math.min(ci, counters.length - 1)], c, BAR_ROW, { offX: 0, offY: 0 });
    ci++;
  }

  addObj('barrel-2', BAR_COL_START + 1, BAR_ROW, { offX: -6, offY: 10 });
  addObj('barrel-1', BAR_COL_START + 2, BAR_ROW, { offX:  6, offY: 10 });

  // Table
  // IMPORTANT: collision is 1 tile only (set in markBlocked()).
  addObj('table-5', 6, 5, { offX: 0, offY: -6 });

  // Sort by depth (iso painter's algorithm)
  OBJECTS.sort((a, b) => {
    const da = a.col + a.row + (a.depthBias || 0);
    const db = b.col + b.row + (b.depthBias || 0);
    if (da !== db) return da - db;
    return a.row - b.row;
  });
}

function markBlocked() {
  // Reset collision
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) COLLISION[r][c] = 0;

  // Walls block
  for (let c = 0; c < COLS; c++) COLLISION[0][c] = 1;
  for (let r = 0; r < ROWS; r++) COLLISION[r][0] = 1;

  // Bar blocks (counter row)
  for (let c = BAR_COL_START; c <= BAR_COL_END; c++) {
    COLLISION[BAR_ROW][c] = 1;
  }

  // Barrels block (same cells they sit on)
  COLLISION[BAR_ROW][BAR_COL_START + 1] = 1;
  COLLISION[BAR_ROW][BAR_COL_START + 2] = 1;

  // Table collision: 1 tile only (matches the “feet” of the table, not the tabletop)
  COLLISION[5][6] = 1;

  // If you want a slightly fatter table footprint, uncomment ONE of these:
  // COLLISION[5][7] = 1;
  // COLLISION[6][6] = 1;
}

function draw() {
  background(82, 48, 40);

  // Input → screen direction
  let screenDX = 0, screenDY = 0;
  if (keyIsDown(65)) { screenDX -= 1; player.dir = DIR.left;  }
  if (keyIsDown(68)) { screenDX += 1; player.dir = DIR.right; }
  if (keyIsDown(87)) { screenDY -= 1; player.dir = DIR.up;    }
  if (keyIsDown(83)) { screenDY += 1; player.dir = DIR.down;  }

  player.moving = (screenDX !== 0 || screenDY !== 0);

  if (player.moving) {
    const len = Math.sqrt(screenDX * screenDX + screenDY * screenDY);
    screenDX /= len;
    screenDY /= len;

    const dCol = (screenDX / HALF_W + screenDY / HALF_H) / 2 * SPEED * HALF_W;
    const dRow = (screenDY / HALF_H - screenDX / HALF_W) / 2 * SPEED * HALF_W;

    const newCol = player.col + dCol;
    const newRow = player.row + dRow;

    if (canWalk(newCol, newRow)) {
      player.col = newCol;
      player.row = newRow;
    } else if (canWalk(newCol, player.row)) {
      player.col = newCol;
    } else if (canWalk(player.col, newRow)) {
      player.row = newRow;
    }
  }

  // Animation
  if (player.moving) {
    player.animTimer++;
    if (player.animTimer >= ANIM_SPEED) {
      player.animTimer = 0;
      player.frame = (player.frame + 1) % 4;
    }
  } else {
    player.frame = 0;
    player.animTimer = 0;
  }

  // Render
  push();
  translate(originX, originY);
  scale(SCALE);

  drawFloor();
  drawObjectsAndPlayer();

  pop();
}

function drawFloor() {
  imageMode(CENTER);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tileIdx = FLOOR_MAP[r][c];
      if (tileIdx < 0) continue;
      const pos = gridToScreen(c, r);
      image(floorTiles[tileIdx], pos.x, pos.y, TILE_W, TILE_H);
    }
  }
}

function drawObjectsAndPlayer() {
  const playerDepth = player.col + player.row;
  let playerDrawn = false;

  for (const obj of OBJECTS) {
    const objDepth = obj.col + obj.row + (obj.depthBias || 0);

    if (!playerDrawn && playerDepth < objDepth) {
      drawPlayer();
      playerDrawn = true;
    }

    const pos = gridToScreen(obj.col, obj.row);
    drawAnchored(IMG[obj.img], pos.x, pos.y, {
      offX: obj.offX,
      offY: obj.offY,
      anchor: obj.anchor,
      flipX: obj.flipX,
    });
  }

  if (!playerDrawn) drawPlayer();
}

function drawPlayer() {
  const pos = gridToScreen(player.col, player.row);

  const frameCol = [0, 1, 2, 1][player.frame];
  const sx = frameCol * FRAME_W;
  const sy = player.dir * FRAME_H;

  const dw = FRAME_W * CHAR_SCALE;
  const dh = FRAME_H * CHAR_SCALE;

  imageMode(CENTER);
  image(
    charSheet,
    pos.x,
    pos.y - dh / 2 + 4,
    dw, dh,
    sx, sy, FRAME_W, FRAME_H
  );
}

function canWalk(col, row) {
  const margin = 0.4;
  if (col < margin || col > COLS - 1 - margin) return false;
  if (row < margin || row > ROWS - 1 - margin) return false;

  const gc = Math.floor(col);
  const gr = Math.floor(row);

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const cc = gc + dc;
      const rr = gr + dr;
      if (cc < 0 || cc >= COLS || rr < 0 || rr >= ROWS) continue;
      if (COLLISION[rr][cc] === 0) continue;

      const cellCenterC = cc + 0.5;
      const cellCenterR = rr + 0.5;

      const distC = Math.abs(col - cellCenterC);
      const distR = Math.abs(row - cellCenterR);

      const pr = 0.35;
      if (distC < (0.5 + pr) && distR < (0.5 + pr)) return false;
    }
  }

  return true;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  const roomPixelW = (COLS + ROWS) * HALF_W;
  const roomPixelH = (COLS + ROWS) * HALF_H + 84;

  const scaleX = windowWidth / (roomPixelW * 1.15);
  const scaleY = windowHeight / (roomPixelH * 1.15);
  SCALE = Math.max(1, Math.floor(Math.min(scaleX, scaleY)));

  computeOrigin();
}