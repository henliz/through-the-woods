let tf1WallsSheet;

const TF1_S     = 32;
const TF1_SCALE = 4;
const TF1_T     = TF1_S * TF1_SCALE;  // 128px per tile

const TF1_COLS  = 8;
const TF1_ROWS  = 5;

// ── WALL ROW: full bottom block (srcY=64, h=64 → displays 256px tall)
const WALL_Y = 64, WALL_H_SRC = 64;
const WALL_DISPLAY_H = WALL_H_SRC * TF1_SCALE; // 256px

// How far down to push the wall so it overlaps the floor slightly
const WALL_Y_OFFSET = 48;

// Floor starts at wall height (fixed — independent of offset so wall can overlap it)
const TOTAL_WALL_H = WALL_DISPLAY_H; // 256px

// Wall source x-coords (bottom block)
const WALL = {
  EDGE_L:  0,
  PLAIN_A: 32,
  WIN_L:   64,
  WIN_R:   96,
  PLAIN_B: 128,
  DOOR_L:  192,
  DOOR_R:  224,
  EDGE_R:  256,
};

// Each column: wall srcX (cap row removed)
const COLUMNS = [
  WALL.EDGE_L,
  WALL.PLAIN_A,
  WALL.WIN_L,
  WALL.WIN_R,
  WALL.PLAIN_B,
  WALL.DOOR_L,
  WALL.DOOR_R,
  WALL.EDGE_R,
];

// Solid tile grid — 2 wall rows solid, floor rows open
const SOLID_WALL_ROWS = Math.ceil(WALL_DISPLAY_H / TF1_T); // 2
let TF1_SOLID = [];

function tf1Preload() {
  tf1WallsSheet = loadImage("assets/Walls_interior.png");
}

function tf1Setup() {
  const totalRows = SOLID_WALL_ROWS + TF1_ROWS;
  TF1_SOLID = Array.from({ length: totalRows }, (_, r) =>
    new Array(TF1_COLS).fill(r < SOLID_WALL_ROWS ? 1 : 0)
  );
}

function tf1Draw(worldX = 0, worldY = 0) {
  const floorTopY = worldY + TOTAL_WALL_H;

  // ── FLOOR (drawn first so wall overlaps it) ────────────────────────────────
  for (let row = 0; row < TF1_ROWS; row++) {
    for (let col = 0; col < TF1_COLS; col++) {
      image(tf1WallsSheet,
            worldX + col * TF1_T,
            floorTopY + row * TF1_T,
            TF1_T, TF1_T,
            288, 96, TF1_S, TF1_S);
    }
  }

  // ── WALL (nudged down by WALL_Y_OFFSET, drawn on top so it overlaps floor) ─
  for (let col = 0; col < TF1_COLS; col++) {
    const wallX = COLUMNS[col];
    const dx = worldX + col * TF1_T;

    image(tf1WallsSheet,
          dx, worldY + WALL_Y_OFFSET,
          TF1_T, WALL_DISPLAY_H,
          wallX, WALL_Y, TF1_S, WALL_H_SRC);
  }
}

function tf1IsSolidAtPixel(px, py) {
  const tx = Math.floor((px - 0) / TF1_T);
  const ty = Math.floor((py - 0) / TF1_T);
  if (tx < 0 || ty < 0 || tx >= TF1_COLS || ty >= TF1_SOLID.length) return true;
  return TF1_SOLID[ty][tx] === 1;
}

window.tf1Preload        = tf1Preload;
window.tf1Setup          = tf1Setup;
window.tf1Draw           = tf1Draw;
window.tf1IsSolidAtPixel = tf1IsSolidAtPixel;
