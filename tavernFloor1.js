// tavernFloor1.js
// Uses ONLY assets/walls/* (your sliced PNGs).
// Auto back walls for every room, auto side walls, nice corners, no squished walls.

let floorImg;
let wallImgs = [];
let wallEndL, wallEndR;
let wallCorner;
let wallDoor;
let insideSideWall;

const TF1_S = 32;
const TF1_SCALE = 4;
const TF1_T = TF1_S * TF1_SCALE; // 128px per tile

// Back wall: slight overlap into floor so it "sits" on top edge nicely
const BACK_WALL_OVERLAP = Math.floor(TF1_T * 0.20); // tweak 0.10..0.30

// Side walls: skinny strips + start lower so they don't overlap corners
const SIDE_EDGE_PAD = 2; // "2 pixels" to the edge
const SIDE_WALL_START_DROP = Math.floor(TF1_T * 0.55); // tweak 0.45..0.70

// Corner alignment tweak (visual): push corners DOWN a bit
const CORNER_Y_NUDGE = Math.floor(TF1_T * 0.35); // tweak 0.20..0.45

// ── MULTI-ROOM CONNECTED FLOORPLAN ─────────────────────────────────────────
const TF1_FLOOR_MASK = [
  "000011111110000", // 0  top room
  "000011111110000", // 1
  "000011111110000", // 2
  "000000011000000", // 3  hallway down
  "001111111111100", // 4  main hall
  "001111111111100", // 5
  "001111111111100", // 6
  "000000011000000", // 7  central spine
  "000111011011100", // 8  left room + spine + right room
  "000111011011100", // 9
  "000111011011100", // 10
  "000000011110000", // 11 connected to right
  "000001111110000", // 12 bottom nook
];

let TF1_W = 0;
let TF1_H = 0;

// SOLID: 1 = solid, 0 = walkable
let TF1_SOLID = [];

function tf1Preload() {
  floorImg = loadImage("assets/walls/floor_full.png");

  wallImgs = [
    loadImage("assets/walls/wall1.png"),
    loadImage("assets/walls/wall2.png"),
    loadImage("assets/walls/wall3.png"),
    loadImage("assets/walls/wall4.png"),
  ];

  wallEndL = loadImage("assets/walls/wall_end_left.png");
  wallEndR = loadImage("assets/walls/wall_end_right.png");

  wallCorner = loadImage("assets/walls/wall_corner.png");
  wallDoor   = loadImage("assets/walls/wall_door.png"); // optional (not used yet)

  insideSideWall = loadImage("assets/walls/inside_side_wall.png");
}

function tf1Setup() {
  TF1_H = TF1_FLOOR_MASK.length;
  TF1_W = TF1_FLOOR_MASK[0].length;

  TF1_SOLID = Array.from({ length: TF1_H }, () => new Array(TF1_W).fill(1));

  for (let r = 0; r < TF1_H; r++) {
    for (let c = 0; c < TF1_W; c++) {
      TF1_SOLID[r][c] = isFloor(c, r) ? 0 : 1;
    }
  }
}

function isFloor(col, row) {
  if (row < 0 || row >= TF1_H || col < 0 || col >= TF1_W) return false;
  return TF1_FLOOR_MASK[row][col] === "1";
}

function tf1IsSolidAtPixel(px, py, worldX = 0, worldY = 0) {
  const tx = Math.floor((px - worldX) / TF1_T);
  const ty = Math.floor((py - worldY) / TF1_T);
  if (tx < 0 || ty < 0 || tx >= TF1_W || ty >= TF1_H) return true;
  return TF1_SOLID[ty][tx] === 1;
}

// stable wall variety
function wallVariantFor(col, row) {
  const idx = (col * 7 + row * 13) % wallImgs.length;
  return wallImgs[idx];
}

// Draw back wall tile WITHOUT squishing: preserve image height
function drawBackWallSprite(img, xLeft, yFloorTop) {
  const dw = img.width * TF1_SCALE;
  const dh = img.height * TF1_SCALE;
  const y = yFloorTop - dh + BACK_WALL_OVERLAP;
  image(img, xLeft, y, dw, dh);
  return dw; // how much we advanced
}

// Draw corner WITHOUT squishing: preserve image height, and nudge down to merge
function drawCorner(img, x, yFloorTop, flipX) {
  const dw = TF1_T;
  const dh = img.height * TF1_SCALE;
  const y = yFloorTop - dh + BACK_WALL_OVERLAP + CORNER_Y_NUDGE;

  push();
  translate(x, y);
  if (flipX) {
    translate(dw, 0);
    scale(-1, 1);
  }
  image(img, 0, 0, dw, dh);
  pop();
}

// Continuous skinny side wall strip (tiled vertically)
function drawSideWallStrip(img, x, yTop, height, flipX) {
  const sw = img.width * TF1_SCALE;
  const sh = img.height * TF1_SCALE;

  push();
  translate(x, yTop);

  if (flipX) {
    translate(sw, 0);
    scale(-1, 1);
  }

  let y = 0;
  while (y < height) {
    const remaining = height - y;
    const dh = Math.min(sh, remaining);
    const srcH = (dh / sh) * img.height;

    image(img, 0, y, sw, dh, 0, 0, img.width, srcH);
    y += dh;
  }

  pop();
}

function tf1Draw(worldX = 0, worldY = 0) {
  // 1) FLOOR
  for (let r = 0; r < TF1_H; r++) {
    for (let c = 0; c < TF1_W; c++) {
      if (!isFloor(c, r)) continue;
      const x = worldX + c * TF1_T;
      const y = worldY + r * TF1_T;
      image(floorImg, x, y, TF1_T, TF1_T);
    }
  }

  // 2) SIDE WALLS (draw BEFORE back wall + corners so corners win)
  for (let c = 0; c < TF1_W; c++) {
    // LEFT segments
    let segStart = null;
    for (let r = 0; r <= TF1_H; r++) {
      const edgeHere = (r < TF1_H) && isFloor(c, r) && !isFloor(c - 1, r);
      if (edgeHere && segStart === null) segStart = r;

      if ((!edgeHere || r === TF1_H) && segStart !== null) {
        const segRows = r - segStart;

        const x = worldX + c * TF1_T - SIDE_EDGE_PAD; // hug left edge
        const yTop = worldY + segStart * TF1_T + SIDE_WALL_START_DROP;
        const h = segRows * TF1_T - SIDE_WALL_START_DROP;

        if (h > 0) drawSideWallStrip(insideSideWall, x, yTop, h, true);
        segStart = null;
      }
    }

    // RIGHT segments
    segStart = null;
    for (let r = 0; r <= TF1_H; r++) {
      const edgeHere = (r < TF1_H) && isFloor(c, r) && !isFloor(c + 1, r);
      if (edgeHere && segStart === null) segStart = r;

      if ((!edgeHere || r === TF1_H) && segStart !== null) {
        const segRows = r - segStart;

        const sw = insideSideWall.width * TF1_SCALE;
        const x = worldX + (c + 1) * TF1_T - sw + SIDE_EDGE_PAD; // hug right edge
        const yTop = worldY + segStart * TF1_T + SIDE_WALL_START_DROP;
        const h = segRows * TF1_T - SIDE_WALL_START_DROP;

        if (h > 0) drawSideWallStrip(insideSideWall, x, yTop, h, false);
        segStart = null;
      }
    }
  }

  // 3) BACK WALLS (draw per contiguous run, using native sprite widths)
for (let r = 0; r < TF1_H; r++) {
  let c = 0;
  while (c < TF1_W) {
    const startsRun = isFloor(c, r) && !isFloor(c, r - 1);
    if (!startsRun) { c++; continue; }

    // find run [c0..c1]
    let c0 = c;
    let c1 = c;
    while (c1 + 1 < TF1_W && isFloor(c1 + 1, r) && !isFloor(c1 + 1, r - 1)) c1++;

    const y = worldY + r * TF1_T;
    let x = worldX + c0 * TF1_T;

    // left end
    x += drawBackWallSprite(wallEndL, x, y);

    // middle fill until we reach the right end cap zone
    const runPixelWidth = (c1 - c0 + 1) * TF1_T;
    const xRunEnd = worldX + c0 * TF1_T + runPixelWidth;

    // reserve space for right end cap
    const rightCapW = wallEndR.width * TF1_SCALE;
    const xStop = xRunEnd - rightCapW;

    let safety = 0;
    while (x < xStop - 1 && safety++ < 2000) {
      const w = wallVariantFor(Math.floor((x - worldX) / TF1_T), r);
      const dw = w.width * TF1_SCALE;

      // if next piece would overrun, break and let right cap handle edge
      if (x + dw > xStop) break;

      x += drawBackWallSprite(w, x, y);
    }

    // right end (flush to end)
    drawBackWallSprite(wallEndR, xRunEnd - rightCapW, y);

    c = c1 + 1;
  }
}

  // 4) CORNERS (on top of back wall)
  for (let r = 0; r < TF1_H; r++) {
    for (let c = 0; c < TF1_W; c++) {
      if (!isFloor(c, r)) continue;
      if (isFloor(c, r - 1)) continue;

      const leftVoid  = !isFloor(c - 1, r);
      const rightVoid = !isFloor(c + 1, r);

      const x = worldX + c * TF1_T;
      const y = worldY + r * TF1_T;

      if (leftVoid)  drawCorner(wallCorner, x, y, true);
      if (rightVoid) drawCorner(wallCorner, x, y, false);
    }
  }
}

// Expose globally (p5 global mode)
window.tf1Preload = tf1Preload;
window.tf1Setup   = tf1Setup;
window.tf1Draw    = tf1Draw;
window.tf1IsSolidAtPixel = tf1IsSolidAtPixel;

// Expose dimensions (as numbers)
window.TF1_T = TF1_T;
window.TF1_W = TF1_W;
window.TF1_H = TF1_H;