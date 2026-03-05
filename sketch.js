let charSheet;
let player;

let camX = 0;
let camY = 0;

const TILE = 32;

const FRAME_W = 32;
const FRAME_H = 32;
const ANIM_SPEED = 7;
const CHAR_SCALE = 2.0;

const DIR = { down: 0, left: 1, right: 2, up: 3 };

const P_SPEED = 4.5;
const P_RADIUS = 10;

let journal;

let npc1_pg1;
let npc1_pg2;

function preload() {
  tf1Preload();
  charSheet = loadImage("redridinghood.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noSmooth();

  tf1Setup();

  player = new Player();
  player.px = 512; // centre of 8-tile-wide room
  player.py = 576; // mid-floor (wall=256px tall, then floor below)
  player.dir = DIR.down;

  journal = new Journal();
}

function draw() {
  background(22, 18, 20);

  if (!journal.isOpen) {
    updatePlayer();
    camX = lerp(camX, player.px - width / 2, 0.14);
    camY = lerp(camY, player.py - height / 2, 0.14);
  }

  push();
  translate(-camX, -camY);

  tf1Draw(0, 0);
  drawPlayer();

  pop();

  drawJournalIcon();
  journal.display();
}

function updatePlayer() {
  let vx = 0,
    vy = 0;

  if (keyIsDown(65)) {
    vx -= 1;
    player.dir = DIR.left;
  } // A
  if (keyIsDown(68)) {
    vx += 1;
    player.dir = DIR.right;
  } // D
  if (keyIsDown(87)) {
    vy -= 1;
    player.dir = DIR.up;
  } // W
  if (keyIsDown(83)) {
    vy += 1;
    player.dir = DIR.down;
  } // S

  player.moving = vx !== 0 || vy !== 0;

  if (player.moving) {
    const len = Math.sqrt(vx * vx + vy * vy);
    vx /= len;
    vy /= len;

    const nx = player.px + vx * P_SPEED;
    const ny = player.py + vy * P_SPEED;

    if (!circleHitsSolid(nx, player.py, P_RADIUS)) player.px = nx;
    if (!circleHitsSolid(player.px, ny, P_RADIUS)) player.py = ny;
  }

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
}

function circleHitsSolid(cx, cy, r) {
  const pts = [
    [cx, cy + r],
    [cx, cy - r],
    [cx + r, cy],
    [cx - r, cy],
  ];
  for (const [px, py] of pts) {
    if (tf1IsSolidAtPixel(px, py)) return true;
  }
  return false;
}

function drawPlayer() {
  const animCol = [0, 1, 2, 1][player.frame];
  const sx = animCol * FRAME_W;
  const sy = player.dir * FRAME_H;

  const dw = FRAME_W * CHAR_SCALE;
  const dh = FRAME_H * CHAR_SCALE;

  imageMode(CENTER);
  image(charSheet, player.px, player.py - 8, dw, dh, sx, sy, FRAME_W, FRAME_H);
  imageMode(CORNER);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

//journal icon
function drawJournalIcon() {
  fill(255);
  rect(width - 60, 20, 40, 40);
  fill(0);
  textSize(14);
  textAlign(CENTER, CENTER);
  text("J", width - 40, 40);
}

function keyPressed() {
  if (key === "j" || key === "J") {
    journal.toggle();
  }
}

function mousePressed() {
  if (
    mouseX > width - 60 &&
    mouseX < width - 20 &&
    mouseY > 20 &&
    mouseY < 60
  ) {
    journal.toggle();
    return;
  }

  if (journal.isOpen) {
    journal.handleClick(mouseX, mouseY);
    return;
  }
}
