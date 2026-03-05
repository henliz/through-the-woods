let charSheet;
let player;

let spoonImg;

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

function preload() {
  tf1Preload();
  charSheet = loadImage("redridinghood.png");
  spoonImg = loadImage("assets/spoon-placeholder.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noSmooth();

  tf1Setup();

  player = new Player();
  player.px = 512; // centre of 8-tile-wide room
  player.py = 576; // mid-floor (wall=256px tall, then floor below)
  player.dir = DIR.down;

  npcs = [innkeeper]; //array of npcs we have
}

function draw() {
  background(22, 18, 20);

  updatePlayer();

  camX = lerp(camX, player.px - width / 2, 0.14);
  camY = lerp(camY, player.py - height / 2, 0.14);

  push();
  translate(-camX, -camY);

  tf1Draw(0, 0);
  drawPlayer();
  //npc drawing
  for (let npc of npcs) {
    npc.draw();
  }
  pop();

  drawDialogue();
  drawSpoonCounter();
  drawPrompt();
}

function updatePlayer() {
  if (dialoguePhase !== "closed") return; // freezes movement during dialogue
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

  if (playerHitsNPC(cx, cy, r)) return true;
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

function drawSpoonCounter() {
  let spoonSize = 36; // size of each spoon icon
  let gap = 8; // gap between spoons
  let startX = width * 0.75; // left padding from screen edge
  let startY = 20; // top padding from screen edge

  for (let i = 0; i < 7; i++) {
    let x = startX + i * (spoonSize + gap);

    if (i < spoonsRemaining) {
      // full colour spoon — still have this spoon
      tint(255, 255, 255);
    } else {
      // faded/greyed out — spoon has been spent
      tint(255, 255, 255, 80);
    }

    image(spoonImg, x, startY, spoonSize, spoonSize);
  }

  // always reset tint after so nothing else is affected
  noTint();
}

function drawPrompt() {
  if (dialoguePhase !== "closed") return; // hide during dialogue

  for (let npc of npcs) {
    if (npc.isPlayerNearby(player)) {
      // convert NPC world position to screen position
      let screenX = npc.x - camX;
      let screenY = npc.y - camY;

      // draw a small dark pill-shaped box above the NPC
      let msg = "Press E to talk";
      textSize(13);
      let msgW = textWidth(msg) + 20;
      let msgH = 24;
      let msgX = screenX - msgW / 2;
      let msgY = screenY - 50;

      fill(0, 0, 0, 180); // semi-transparent dark background
      noStroke();
      rect(msgX, msgY, msgW, msgH, 12); // 12 = rounded corners

      fill(255);
      textAlign(CENTER, CENTER);
      textSize(13);
      text(msg, screenX, msgY + msgH / 2);

      break; // only show prompt for one NPC at a time
    }
  }
}

function keyPressed() {
  if (key === "e" || key === "E") {
    if (dialoguePhase === "closed") {
      for (let npc of npcs) {
        if (npc.isPlayerNearby(player)) {
          openDialogue(npc);
          return;
        }
      }
    } else if (dialoguePhase === "opening") {
      dialoguePhase = "choosing"; // E advances from opening to choices
    } else if (dialoguePhase === "choosing") {
      confirmChoice(); // E confirms the highlighted option
    } else if (dialoguePhase === "response") {
      dialoguePhase = "monologue"; // E advances to internal monologue next
    } else if (dialoguePhase === "monologue") {
      closeDialogue(); // E closes dialogue after internal monologue
    } else if (dialoguePhase === "repeat") {
      closeDialogue(); // E just closes the one-liner
    }
  }

  // navigate buttons with W / S
  if (dialoguePhase === "choosing") {
    if (key === "w" || key === "W") {
      selectedOption = (selectedOption - 1 + 3) % 3; // wrap up
    }
    if (key === "s" || key === "S") {
      selectedOption = (selectedOption + 1) % 3; // wrap down
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
