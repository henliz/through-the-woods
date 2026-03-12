let charSheet;
let player;

let spoonImg;
let innkeeperImg;
let nunImg;
let runawayManImg;

let camX = 0;
let camY = 0;

const TILE = 32;

const FRAME_W = 32;
const FRAME_H = 32;
const ANIM_SPEED = 7;
const CHAR_SCALE = 2.0;
const NPC_CHAR_SCALE = 1.7;  // NPCs drawn slightly smaller than the player
const CAM_ZOOM = 1.4;        // world-space zoom (1.0 = no zoom)

const DIR = { down: 0, left: 1, right: 2, up: 3 };

const P_SPEED = 4.5;
const P_RADIUS = 10;

let journal;

let doctorPg;
let rmPg;
let innkeeperPg;
let fdlPg;
let evidencePg;

let portraits = {}; // for dialogue portraits

//dialogue ui
let uiMainBox, uiMonologueBox;
let uiBtnRegular, uiBtnHover, uiBtnDisabled;

let currentScene = "HOME";
let journalicon;

let jersey10Font;
let journalFont;

let primaryTextC;
let monologueTextC;
let dialogueHoverButtonTextC;
let dialogueDisabledButtonTextC;
let journalTextC;

let prologueVideo;

function preload() {
  tf1Preload();
  clutterPreload();
  charSheet = loadImage("redridinghood.png");
  loadHomeAssets();
  spoonImg = loadImage("assets/cookies.png");
  innkeeperImg = loadImage("assets/innkeeper_sprite.png");
  nunImg = loadImage("nuns.png");
  runawayManImg = loadImage("assets/Jerome_spirtesheet.png");

  // journal pages
  doctorPg = loadImage("assets/journal/Krisia_journal.png");
  rmPg = loadImage("assets/journal/Jerome_journal.png");
  innkeeperPg = loadImage("assets/journal/Mrs.Gustall_journal.png");
  fdlPg = loadImage("assets/journal/Helen_journal.png");
  evidencePg = loadImage("assets/journal/Evidence_journal.png");

  // character portraits
  portraits = {
    innkeeper: {
      idle: loadImage("assets/portraits/IK_Idle.png"),
      angry: loadImage("assets/portraits/IK_angry.png"),
      nervous: loadImage("assets/portraits/IK_Nervous.png"),
      sus: loadImage("assets/portraits/IK_Sus.png"),
      happy: loadImage("assets/portraits/IK_happy.png"),
    },
    littleRed: {
      idle: loadImage("assets/portraits/LR_Idle.png"),
      nervous: loadImage("assets/portraits/LR_Nervous.png"),
      happy: loadImage("assets/portraits/LR_Happy.png"),
      determined: loadImage("assets/portraits/LR_Determined.png"),
    },
    doctor: {
      idle: loadImage("assets/portraits/Doctor_idle.png"),
      nervous: loadImage("assets/portraits/Doctor_nervous.png"),
      happy: loadImage("assets/portraits/Doctor_happy.png"),
      sus: loadImage("assets/portraits/Doctor_sus.png"),
      angry: loadImage("assets/portraits/Doctor_angry.png"),
    },
    runawayMan: {
      idle: loadImage("assets/portraits/RM_idle.png"),
      nervous: loadImage("assets/portraits/RM_nervous.png"),
      happy: loadImage("assets/portraits/RM_happy.png"),
      sus: loadImage("assets/portraits/RM_sus.png"),
      angry: loadImage("assets/portraits/RM_angry.png"),
    },
  };
  journalicon = loadImage("assets/bookicon.png");
  // ui dialogue elements
  uiMainBox = loadImage("assets/ui elements/Main Dialogue Box.png");
  uiMonologueBox = loadImage("assets/ui elements/Inner Monologue Box.png");
  uiBtnRegular = loadImage("assets/ui elements/Dialogue choice regular.png");
  uiBtnHover = loadImage("assets/ui elements/Dialogue choice hover.png");
  uiBtnDisabled = loadImage("assets/ui elements/Dialogue choice disabled.png");

  jersey10Font = loadFont("assets/Jersey10-Regular.ttf");
  journalFont = loadFont("assets/ReenieBeanie-Regular.ttf");

  prologueVideo = createVideo("assets/Prologue.mp4");
  prologueVideo.hide(); // hide the default HTML video element
}

// ─────────────────────────────────────────────────────────────
// SPAWN HELPERS (guaranteed inside walkable area)
// ─────────────────────────────────────────────────────────────

function isCircleInOpenSpace(cx, cy, r) {
  // Use the same style of checks as movement collision
  const pts = [
    [cx, cy],
    [cx, cy + r],
    [cx, cy - r],
    [cx + r, cy],
    [cx - r, cy],
    [cx + r * 0.7, cy + r * 0.7],
    [cx - r * 0.7, cy + r * 0.7],
    [cx + r * 0.7, cy - r * 0.7],
    [cx - r * 0.7, cy - r * 0.7],
  ];
  for (const [px, py] of pts) {
    if (tf1IsSolidAtPixel(px, py)) return false;
  }
  return true;
}

function tooCloseToOthers(cx, cy, others, minDist) {
  for (const o of others) {
    const dx = cx - o.x;
    const dy = cy - o.y;
    if (dx * dx + dy * dy < minDist * minDist) return true;
  }
  return false;
}

/**
 * Find a safe spawn pixel.
 * - region: optional { x0, y0, x1, y1 } to bias search
 * - r: radius for collision
 * - avoid: array of {x,y} to keep spacing between spawns
 */
function findSpawnPoint({ r, region = null, avoid = [], minDist = 120 }) {
  const floorTopY = 0; // ✅ new tavern origin

  const worldW = TF1_W * TF1_T;
  const worldH = TF1_H * TF1_T;

  const x0 = region?.x0 ?? 0;
  const y0 = region?.y0 ?? floorTopY;
  const x1 = region?.x1 ?? worldW;
  const y1 = region?.y1 ?? floorTopY + worldH;

  // 1) random samples
  for (let i = 0; i < 600; i++) {
    const cx = random(x0 + r + 2, x1 - r - 2);
    const cy = random(y0 + r + 2, y1 - r - 2);

    if (!isCircleInOpenSpace(cx, cy, r)) continue;
    if (tooCloseToOthers(cx, cy, avoid, minDist)) continue;

    return { x: cx, y: cy };
  }

  // 2) fallback scan
  const step = Math.max(16, Math.floor(TF1_T / 2));
  for (let cy = y0 + r + 2; cy <= y1 - r - 2; cy += step) {
    for (let cx = x0 + r + 2; cx <= x1 - r - 2; cx += step) {
      if (!isCircleInOpenSpace(cx, cy, r)) continue;
      if (tooCloseToOthers(cx, cy, avoid, minDist)) continue;
      return { x: cx, y: cy };
    }
  }

  console.warn("No valid spawn found — check mask/collision.");
  return { x: TF1_T * 2, y: TF1_T * 2 };
}

// Convenience: define some “zones” to bias spawns (adjust if you want)
function getInnZones() {
  const W = TF1_W * TF1_T;
  const H = TF1_H * TF1_T;

  return {
    main: { x0: W * 0.2, x1: W * 0.8, y0: H * 0.25, y1: H * 0.7 },
    left: { x0: W * 0.05, x1: W * 0.45, y0: H * 0.15, y1: H * 0.9 },
    right: { x0: W * 0.55, x1: W * 0.95, y0: H * 0.15, y1: H * 0.9 },
  };
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noSmooth();
  textFont(jersey10Font);

  //text colours
  primaryTextC = color(168, 86, 21);
  monologueTextC = color(255);
  dialogueHoverButtonTextC = color(255);
  dialogueDisabledButtonTextC = color(168, 86, 21);
  journalTextC = color(255);

  tf1Setup();
  // once the floor/tile system exists we can place our furniture
  clutterSetup();
  lightingSetup();

  player = new Player();
  player.dir = DIR.down;

  // after tf1Setup() so TF1_W/TF1_H/TF1_T exist:
  const zones = getInnZones();
  const used = [];

  // Player spawn (main area)
  let p = findSpawnPoint({
    r: P_RADIUS,
    region: zones.main,
    avoid: used,
    minDist: 160,
  });
  player.px = p.x;
  player.py = p.y;
  used.push({ x: player.px, y: player.py });

  // NPC spawns (spread out)
  let n;

  // innkeeper in main (near player but not on top)
  n = findSpawnPoint({ r: 14, region: zones.main, avoid: used, minDist: 140 });
  innkeeper.x = n.x;
  innkeeper.y = n.y;
  used.push({ x: innkeeper.x, y: innkeeper.y });

  // doctor in left side
  n = findSpawnPoint({ r: 14, region: zones.left, avoid: used, minDist: 140 });
  doctor.x = n.x;
  doctor.y = n.y;
  used.push({ x: doctor.x, y: doctor.y });

  // runawayMan in right side
  n = findSpawnPoint({ r: 14, region: zones.right, avoid: used, minDist: 140 });
  runawayMan.x = n.x;
  runawayMan.y = n.y;
  used.push({ x: runawayMan.x, y: runawayMan.y });

  journal = new Journal();
  npcs = [innkeeper, doctor, runawayMan]; //array of npcs we have

  // set NPC colours here, after p5.js is ready
  innkeeper.sprite = innkeeperImg;
  innkeeper.spriteFrameW = 48;
  innkeeper.spriteFrameH = 48;
  doctor.sprite = nunImg;
  doctor.spriteFrameW = 48;
  doctor.spriteFrameH = 48;
  runawayMan.colour = color(100, 220, 130); // green
  runawayMan.sprite = runawayManImg;
  runawayMan.spriteFrameW = 48;
  runawayMan.spriteFrameH = 64; // measured from pixel data: rows are 64px tall, not 56
}

function draw() {
  background(22, 18, 20);

  //Home Page
  if (currentScene === "HOME") {
    drawHomePage();
    return;
  } else if (currentScene === "END") {
    drawEndPage();
    setTimeout(() => {
      currentScene = "GAME";
    }, 2000);
    return;
  }
  // Prologue video
  if (currentScene === "PROLOGUE") {
    background(0);
    imageMode(CENTER);
    image(prologueVideo, width / 2, height / 2, width - 200, height);
    imageMode(CORNER);
    return;
  }

  if (!journal.isOpen) {
    updatePlayer();
    camX = lerp(camX, player.px - width  / (2 * CAM_ZOOM), 0.14);
    camY = lerp(camY, player.py - height / (2 * CAM_ZOOM), 0.14);
  }

  push();
  scale(CAM_ZOOM);
  translate(-camX, -camY);

  tf1Draw(0, 0);
  clutterDraw(0, 0);
  drawPlayer();
  for (let npc of npcs) {
    npc.update();
    npc.draw();
  }
  pop();

  drawLighting(); // screen-space overlay — after world, before all UI

  drawDialogue();
  drawSpoonCounter();
  drawPrompt();
  drawJournalIcon();
  journal.display();
  bedtime();
}

function updatePlayer() {
  if (dialoguePhase !== "closed") return; // freezes movement during dialogue
  let vx = 0,
    vy = 0;

  if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) {
    vx -= 1;
    player.dir = DIR.left;
  } // A or Left Arrow
  if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) {
    vx += 1;
    player.dir = DIR.right;
  } // D or Right Arrow
  if (keyIsDown(87) || keyIsDown(UP_ARROW)) {
    vy -= 1;
    player.dir = DIR.up;
  } // W or Up Arrow
  if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) {
    vy += 1;
    player.dir = DIR.down;
  } // S or Down Arrow

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
  if (checkCollision(cx, cy, r)) return true;

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
  lightingResized();
}

function drawSpoonCounter() {
  let spoonSize = 70; // size of each spoon icon
  let gap = 0.5; // gap between spoons
  let startX = width * 0.65; // left padding from screen edge
  let startY = 10; // top padding from screen edge

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
      // convert NPC world position to screen position (account for zoom)
      let screenX = (npc.x - camX) * CAM_ZOOM;
      let screenY = (npc.y - camY) * CAM_ZOOM;

      // draw a small dark pill-shaped box above the NPC
      let msg = "Press Enter to talk";
      textSize(13);
      let msgW = textWidth(msg) + 20;
      let msgH = 24;
      let msgX = screenX - msgW / 2;
      let msgY = screenY - 90;

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

  // Check for door1 interaction
  if (isPlayerNearDoor1(player)) {
    // convert door world position to screen position
    let doorPos = getPropPosition(door1Layout);
    if (doorPos) {
      let screenX = (doorPos.actualX - camX) * CAM_ZOOM;
      let screenY = (doorPos.actualY - camY) * CAM_ZOOM;
      // draw a small dark pill-shaped box above the door
      let msg = "Press 'G' to go to bed";
      textSize(16);
      let msgW = textWidth(msg) + 20;
      let msgH = 24;
      let msgX = screenX - msgW / 4;
      let msgY = screenY - 50;
      fill(255); // semi-transparent dark background
      noStroke();
      rect(msgX, msgY, msgW, msgH, 12); // 12 = rounded corners
      fill(0);
      textAlign(CENTER, CENTER);
      textSize(16);
      text(msg, screenX + msgW / 4, msgY + msgH / 2);
    }
  }
}

//journal icon
function drawJournalIcon() {
  const ix = width - 60,
    iy = 80,
    iw = 44,
    ih = 44;

  image(journalicon, ix, iy, iw, ih);

  if (journal.hasUnread) {
    noStroke();
    fill(210, 50, 50);
    ellipse(ix + 5, iy + 5, 14, 14);
  }
}

function keyPressed() {
  if (currentScene === "HOME") {
    if (keyCode === ENTER) {
      currentScene = "PROLOGUE";
      prologueVideo.play();
      // when video ends, automatically go to GAME
      prologueVideo.elt.onended = () => {
        currentScene = "GAME";
        prologueVideo.hide();
      };
    }
    return;
  }

  // silent skip — no text hint shown to player
  if (currentScene === "PROLOGUE") {
    if (keyCode === ENTER) {
      prologueVideo.stop();
      currentScene = "GAME";
      prologueVideo.hide();
    }
    return;
  }

  if (isPlayerNearDoor1(player) && (key === "g" || key === "G")) {
    currentScene = "END";
    return;
  }

  if (key === "j" || key === "J") {
    journal.toggle();
  }

  if (journal.isOpen) {
    if (keyCode === LEFT_ARROW || key === "a" || key === "A") {
      journal.prevPage();
      return;
    }
    if (keyCode === RIGHT_ARROW || key === "d" || key === "D") {
      journal.nextPage();
      return;
    }
  }

  if (keyCode === ENTER) {
    // If text is still animating, skip to full text instead of advancing
    const choosingPhase = dialoguePhase === "choosing" || dialoguePhase === "repeat-choosing";
    if (!typewriterDone && dialoguePhase !== "closed" && !choosingPhase) {
      skipTypewriter();
      return;
    }

    if (dialoguePhase === "closed") {
      for (let npc of npcs) {
        if (npc.isPlayerNearby(player)) {
          openDialogue(npc);
          return;
        }
      }
    } else if (dialoguePhase === "opening") {
      dialoguePhase = "choosing";
    } else if (dialoguePhase === "choosing") {
      confirmChoice();
    } else if (dialoguePhase === "repeat") {
      if (spoonsRemaining === 0) {
        closeDialogue();
      } else {
        dialoguePhase = "repeat-choosing";
      }
    } else if (dialoguePhase === "repeat-choosing") {
      confirmChoice();
    } else if (dialoguePhase === "response") {
      dialoguePhase = "monologue";
      startTypewriter(chosenOption.monologue);
    } else if (dialoguePhase === "monologue") {
      if (!chosenOption) {
        closeDialogue();
      } else if (
        spoonsRemaining === 0 ||
        chosenOption.cost === 0 ||
        chosenOption.cost === -1
      ) {
        closeDialogue();
      } else {
        dialoguePhase = "repeat";
        startTypewriter(activeNPC.dialogue.repeatLine);
      }
    } else if (dialoguePhase === "hesitation") {
      closeDialogue();
    }
  }

  // navigate buttons with W / S
  if (dialoguePhase === "choosing" || dialoguePhase === "repeat-choosing") {
    let visibleIndices = getVisibleOptionIndices();
    if (visibleIndices.length === 0) return;

    let currentPos = visibleIndices.indexOf(selectedOption);
    if (currentPos === -1) currentPos = 0;

    if (key === "w" || key === "W") {
      let newPos =
        (currentPos - 1 + visibleIndices.length) % visibleIndices.length;
      selectedOption = visibleIndices[newPos];
    }
    if (key === "s" || key === "S") {
      let newPos = (currentPos + 1) % visibleIndices.length;
      selectedOption = visibleIndices[newPos];
    }
  }
}

function mousePressed() {
  if (
    mouseX > width - 60 &&
    mouseX < width - 20 &&
    mouseY > 80 &&
    mouseY < 120
  ) {
    journal.toggle();
    return;
  }

  if (journal.isOpen) {
    journal.handleClick(mouseX, mouseY);
    return;
  }

  // handle dialogue option clicks
  if (dialoguePhase === "choosing" || dialoguePhase === "repeat-choosing") {
    let btnW = width * 0.28;
    let btnH = height * 0.07;
    let btnX = width * 0.6;
    let startY = height * 0.4;
    let gap = btnH + 10;

    for (let i = 0; i < 3; i++) {
      let btnY = startY + i * gap;
      if (isMouseOver(btnX, btnY, btnW, btnH)) {
        selectedOption = i;
        confirmChoice(); // works for both affordable and unaffordable
        return;
      }
    }
  }
}
