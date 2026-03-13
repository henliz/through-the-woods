// tavernFloor1.js
// Uses ONLY assets/walls/*
// Fixes: back walls too wide + too low, keeps corners perfect.

let floorImg;
let wallImgs = [];
let wallCorner;
let wallDoor; // optional (not used yet)
let insideSideWall;

const TF1_S = 32;
const TF1_SCALE = 3.2; // 80% of original — scales tile rendering & world size
const TF1_T = TF1_S * TF1_SCALE; // 102.4px per tile

// Back wall overlap into floor edge (how much the wall "sits" on the floor line)
const BACK_WALL_OVERLAP = Math.floor(TF1_T * 0.2);

// ✅ More overlap between segments to hide seams
const WALL_OVERLAP_PX = 6; // was 8

// ✅ Raise the back walls so they align with corners
const BACK_WALL_RAISE_PX = 51; // was 64

const BACK_WALL_SHIFT_X = 6; // was 8

const WALL_WIDTH_TRIM = 3; // was 4

// Side walls
const SIDE_EDGE_PAD = 2;
const SIDE_WALL_X_NUDGE = 6; // was 8
const SIDE_WALL_START_DROP = Math.floor(TF1_T * 0.55);

// Corners are perfect — keep this
const CORNER_Y_NUDGE = Math.floor(TF1_T * 0.35);

// ── MULTI-ROOM CONNECTED FLOORPLAN ─────────────────────────────────────────
const TF1_FLOOR_MASK = [
  "001111000111100",
  "001111000111100",
  "000011111110000",
  "000011111110000",
  "011111111111110",
  "011101111101110",
  "000001111100000", //
  "000001111100000", //
  "001111111111100", //
  "001111111111100", //
  "000001111100000",
  "000001111100000",
  "001111111111100", //
  "001111111111100", //
  "001111111111100", //
];

let TF1_W = 0;
let TF1_H = 0;
let TF1_SOLID = []; // 1 = solid, 0 = walkable

function tf1Preload() {
  floorImg = loadImage("assets/walls/floor_full.png");

  wallImgs = [
    loadImage("assets/walls/wall1.png"),
    loadImage("assets/walls/wall2.png"),
    loadImage("assets/walls/wall3.png"),
    loadImage("assets/walls/wall4.png"),
  ];

  wallCorner = loadImage("assets/walls/wall_corner.png");
  wallDoor = loadImage("assets/walls/wall_door.png"); // optional

  insideSideWall = loadImage("assets/walls/external_side_wall.png");
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

  // expose real numbers AFTER setup
  window.TF1_W = TF1_W;
  window.TF1_H = TF1_H;
  window.TF1_T = TF1_T;
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
function wallVariantForPixel(xPx, row) {
  const col = Math.floor(xPx / TF1_T);
  return wallVariantFor(col, row);
}

//Single baseline for BOTH corners and walls.

function wallBaselineY(yFloorTop, img) {
  const dh = img.height * TF1_SCALE;
  return (
    yFloorTop - dh + BACK_WALL_OVERLAP + CORNER_Y_NUDGE - BACK_WALL_RAISE_PX
  );
}

//Draw a back-wall segment as EXACTLY 1 tile wide
function drawBackWallTile(img, xLeft, yFloorTop, destW = TF1_T) {
  const dh = img.height * TF1_SCALE;
  const y = wallBaselineY(yFloorTop, img);

  // Take a 32px (TF1_S) slice from the center of the wall image.
  // If the source image is already 32px wide, this just uses the whole thing.
  const sliceW = Math.min(TF1_S, img.width);
  const sliceX = Math.max(0, Math.floor((img.width - sliceW) / 2));

  // If we’re drawing a cropped last piece, scale source slice width proportionally.
  const effectiveDestW = Math.max(0, destW - WALL_WIDTH_TRIM);
  const srcW = Math.max(1, Math.floor((effectiveDestW / TF1_T) * sliceW));

  image(
    img,
    xLeft,
    y,
    effectiveDestW,
    dh, // dest
    sliceX,
    0,
    srcW,
    img.height, // src
  );

  return effectiveDestW;
}

// Corner: unchanged behavior, just uses the unified baseline
function drawCorner(img, xTileLeft, yFloorTop, flipX) {
  const dw = img.width * TF1_SCALE;
  const dh = img.height * TF1_SCALE;
  const y = wallBaselineY(yFloorTop, img) + BACK_WALL_RAISE_PX;
  // ^ corners were already correct; undo the wall-raise for corners only

  push();
  translate(xTileLeft, y);
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

function hasTopOuterCorner(col, row, side) {
  if (!isFloor(col, row) || isFloor(col, row - 1)) return false;

  if (side === "left") {
    return !isFloor(col - 1, row);
  }
  if (side === "right") {
    return !isFloor(col + 1, row);
  }
  return false;
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

  // 2) SIDE WALLS (before back walls + corners so corners win)
  for (let c = 0; c < TF1_W; c++) {
    // LEFT segments
    let segStart = null;
    for (let r = 0; r <= TF1_H; r++) {
      const edgeHere = r < TF1_H && isFloor(c, r) && !isFloor(c - 1, r);
      if (edgeHere && segStart === null) segStart = r;

      if ((!edgeHere || r === TF1_H) && segStart !== null) {
        const segRows = r - segStart;
        const x = worldX + c * TF1_T - SIDE_EDGE_PAD + SIDE_WALL_X_NUDGE;
        const yTop = worldY + segStart * TF1_T + SIDE_WALL_START_DROP;
        const h = segRows * TF1_T - SIDE_WALL_START_DROP;
        if (h > 0) drawSideWallStrip(insideSideWall, x, yTop, h, true);
        segStart = null;
      }
    }

    // RIGHT segments
    segStart = null;
    for (let r = 0; r <= TF1_H; r++) {
      const edgeHere = r < TF1_H && isFloor(c, r) && !isFloor(c + 1, r);
      if (edgeHere && segStart === null) segStart = r;

      if ((!edgeHere || r === TF1_H) && segStart !== null) {
        const segRows = r - segStart;
        const sw = insideSideWall.width * TF1_SCALE;
        const x =
          worldX + (c + 1) * TF1_T - sw + SIDE_EDGE_PAD + SIDE_WALL_X_NUDGE;
        const yTop = worldY + segStart * TF1_T + SIDE_WALL_START_DROP;
        const h = segRows * TF1_T - SIDE_WALL_START_DROP;
        if (h > 0) drawSideWallStrip(insideSideWall, x, yTop, h, false);
        segStart = null;
      }
    }
  }

  // 3) BACK WALLS — tile-wide, reserved ends for corners, no "one short"
  const cornerW = wallCorner.width * TF1_SCALE;

  for (let r = 0; r < TF1_H; r++) {
    let c = 0;
    while (c < TF1_W) {
      const startsRun = isFloor(c, r) && !isFloor(c, r - 1);
      if (!startsRun) {
        c++;
        continue;
      }

      let c0 = c;
      let c1 = c;
      while (c1 + 1 < TF1_W && isFloor(c1 + 1, r) && !isFloor(c1 + 1, r - 1))
        c1++;

      const yFloorTop = worldY + r * TF1_T;
      const runX0 = worldX + c0 * TF1_T;
      const runX1 = worldX + (c1 + 1) * TF1_T;

      const reserveLeft = hasTopOuterCorner(c0, r, "left") ? cornerW : 0;
      const reserveRight = hasTopOuterCorner(c1, r, "right") ? cornerW : 0;

      let x = runX0 + reserveLeft;
      const xStop = runX1 - reserveRight;

      while (x < xStop - 1) {
        const seg = wallVariantForPixel(x - worldX, r);

        // draw a normal tile segment, but overlap a bit to kill seams
        const drawX = x - WALL_OVERLAP_PX + BACK_WALL_SHIFT_X;
        const remaining = xStop - x;

        // If last piece doesn't fit a full tile, draw a cropped tile-width piece.
        const want = Math.min(TF1_T, remaining + WALL_OVERLAP_PX);

        drawBackWallTile(seg, drawX, yFloorTop, want);

        // advance by tile width (minus overlap so seams stay hidden)
        x += TF1_T - WALL_OVERLAP_PX;
      }

      c = c1 + 1;
    }
  }

  // 4) CORNERS on top
  for (let r = 0; r < TF1_H; r++) {
    for (let c = 0; c < TF1_W; c++) {
      if (!isFloor(c, r)) continue;
      if (isFloor(c, r - 1)) continue;

      const leftVoid = !isFloor(c - 1, r);
      const rightVoid = !isFloor(c + 1, r);

      const x = worldX + c * TF1_T;
      const y = worldY + r * TF1_T;

      if (leftVoid) drawCorner(wallCorner, x, y, true);
      if (rightVoid) drawCorner(wallCorner, x, y, false);
    }
  }
}

// allow other files (clutter.js) to mark collision tiles
window.tf1MarkSolidRect = function (tileX, tileY, wTiles, hTiles) {
  for (let r = tileY; r < tileY + hTiles; r++) {
    for (let c = tileX; c < tileX + wTiles; c++) {
      if (r >= 0 && r < TF1_H && c >= 0 && c < TF1_W) {
        TF1_SOLID[r][c] = 1;
      }
    }
  }
};

// Expose globally
window.tf1Preload = tf1Preload;
window.tf1Setup = tf1Setup;
window.tf1Draw = tf1Draw;
window.tf1IsSolidAtPixel = tf1IsSolidAtPixel;

window.TF1_T = TF1_T;
// TF1_W / TF1_H assigned after setup()
