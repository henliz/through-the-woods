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
const NPC_CHAR_SCALE = 1.7; // NPCs drawn slightly smaller than the player
const CAM_ZOOM = 1.4; // world-space zoom (1.0 = no zoom)

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
let npcPromptBounds = null; // set each frame by drawPrompt()

let currentDay = 1;
const TOTAL_DAYS = 3;
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
  charSheet = loadImage("redridinghood.png"); //reference [15]
  loadHomeAssets();
  spoonImg = loadImage("assets/cookies.png"); //reference [7]
  innkeeperImg = loadImage("assets/innkeeper_sprite.png"); //reference [4]
  nunImg = loadImage("nuns.png"); //reference [15]
  runawayManImg = loadImage("assets/Jerome_spirtesheet.png"); //reference [2]

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

  prologueVideo = createVideo("assets/Prologue.mp4"); //reference [4], [5]
  prologueVideo.hide();
  // auto-skip to game if the video can't load or play (codec/browser issue)
  prologueVideo.elt.onerror = () => {
    currentScene = "GAME";
  };
  prologueVideo.elt.onstalled = () => {
    setTimeout(() => {
      if (currentScene === "PROLOGUE") currentScene = "GAME";
    }, 3000);
  };
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

  // Player spawns just inside the door
  const doorPos = getPropPosition(door1Layout);
  if (doorPos) {
    player.px = doorPos.actualX + doorPos.dw / 2;
    player.py = doorPos.actualY + doorPos.dh + 60;
  } else {
    player.px = 7.3 * TF1_T;
    player.py = 3 * TF1_T;
  }
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
    // skip hint
    fill(255, 255, 255, 140);
    textAlign(RIGHT, BOTTOM);
    textSize(14);
    text("Press any key or click to skip", width - 20, height - 16);
    return;
  }

  if (!journal.isOpen) {
    updatePlayer();
    camX = lerp(camX, player.px - width / (2 * CAM_ZOOM), 0.14);
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
  drawDayCounter();
  journal.display();
  bedtime();
  updateHoverCursor();
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
  const spoonSize = 70;
  const gap = 0.5;
  const startX = 20;
  const startY = 10;

  // How many spoons will the hovered option cost?
  let previewCost = 0;
  if (
    (dialoguePhase === "choosing" || dialoguePhase === "repeat-choosing") &&
    selectedOption !== -1 &&
    activeNPC
  ) {
    const opt = activeNPC.dialogue.options[selectedOption];
    if (opt) previewCost = opt.cost;
  }

  for (let i = 0; i < 7; i++) {
    const x = startX + i * (spoonSize + gap);
    // spoons in the range [spoonsRemaining - previewCost, spoonsRemaining) will be spent
    const willBeSpent =
      previewCost > 0 &&
      i >= spoonsRemaining - previewCost &&
      i < spoonsRemaining;

    if (willBeSpent) {
      // all cost spoons bob together, slowly
      const bobY = sin(frameCount * 0.05) * 5;
      // pass 1: tight red outline
      drawingContext.shadowColor = "rgba(220, 35, 35, 1)";
      drawingContext.shadowBlur = 3;
      image(spoonImg, x, startY + bobY, spoonSize, spoonSize);
      // pass 2: wider red glow outlining the outline
      drawingContext.shadowBlur = 16;
      image(spoonImg, x, startY + bobY, spoonSize, spoonSize);
      // pass 3: clean cookie on top
      drawingContext.shadowColor = "transparent";
      drawingContext.shadowBlur = 0;
      image(spoonImg, x, startY + bobY, spoonSize, spoonSize);
    } else if (i < spoonsRemaining) {
      tint(255);
      image(spoonImg, x, startY, spoonSize, spoonSize);
    } else {
      tint(255, 255, 255, 80);
      image(spoonImg, x, startY, spoonSize, spoonSize);
    }
  }

  noTint();
}

function drawPrompt() {
  if (dialoguePhase !== "closed") {
    npcPromptBounds = null;
    return; // hide during dialogue
  }

  npcPromptBounds = null;
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

      npcPromptBounds = { x: msgX, y: msgY, w: msgW, h: msgH, npc };

      const hoveringPrompt =
        mouseX > msgX &&
        mouseX < msgX + msgW &&
        mouseY > msgY &&
        mouseY < msgY + msgH;

      fill(hoveringPrompt ? 40 : 0, 0, 0, 180);
      noStroke();
      rect(msgX, msgY, msgW, msgH, 12);

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
  const iw = 60;
  const ih = 60;
  const ix = width - iw - 16;
  const iy = 50;

  const hoveringJournal =
    mouseX > ix && mouseX < ix + iw && mouseY > iy && mouseY < iy + ih;
  const bobY =
    journal.hasUnread || hoveringJournal ? sin(frameCount * 0.06) * 3 : 0;

  // journal image: always a slight black outline, then gold glow when unread
  drawingContext.shadowColor = "rgba(0, 0, 0, 0.85)";
  drawingContext.shadowBlur = 4;
  image(journalicon, ix, iy + bobY, iw, ih);
  if (journal.hasUnread) {
    drawingContext.shadowColor = "rgba(255, 195, 40, 0.9)";
    drawingContext.shadowBlur = 20;
    image(journalicon, ix, iy + bobY, iw, ih);
  }
  drawingContext.shadowColor = "transparent";
  drawingContext.shadowBlur = 0;
  image(journalicon, ix, iy + bobY, iw, ih);

  // 'J' — gold with gold tight outline then gold glow
  textAlign(CENTER, CENTER);
  textSize(38);
  drawingContext.shadowColor = "rgba(255, 195, 40, 1)";
  drawingContext.shadowBlur = 3;
  fill(255, 210, 50);
  text("J", ix + iw / 2, iy + ih / 2 + bobY);
  drawingContext.shadowBlur = 12;
  text("J", ix + iw / 2, iy + ih / 2 + bobY);
  drawingContext.shadowColor = "transparent";
  drawingContext.shadowBlur = 0;
  text("J", ix + iw / 2, iy + ih / 2 + bobY);

  // unread dot
  if (journal.hasUnread) {
    noStroke();
    fill(210, 50, 50);
    ellipse(ix + 8, iy + 8 + bobY, 14, 14);
  }
}

function drawDayCounter() {
  textAlign(RIGHT, TOP);
  textSize(24);
  drawingContext.shadowColor = "rgba(0, 0, 0, 0.95)";
  drawingContext.shadowBlur = 4;
  fill(255, 210, 50);
  text(`Day ${currentDay}/${TOTAL_DAYS}`, width - 14, 12);
  drawingContext.shadowColor = "transparent";
  drawingContext.shadowBlur = 0;
}

function isMouseOverNPC(npc) {
  const wx = mouseX / CAM_ZOOM + camX;
  const wy = mouseY / CAM_ZOOM + camY;
  const hw = ((npc.spriteFrameW || 48) * NPC_CHAR_SCALE) / 2;
  const hh = ((npc.spriteFrameH || 48) * NPC_CHAR_SCALE) / 2;
  return (
    wx > npc.x - hw &&
    wx < npc.x + hw &&
    wy > npc.y - 8 - hh &&
    wy < npc.y - 8 + hh
  );
}

function updateHoverCursor() {
  let hovering = false;

  // Home screen "Press ENTER to start"
  if (currentScene === "HOME") {
    const ty = height * 0.5 - 20;
    if (mouseY > ty - 16 && mouseY < ty + 16) hovering = true;
  }

  // NPC talk prompt pill
  if (npcPromptBounds) {
    const b = npcPromptBounds;
    if (
      mouseX > b.x &&
      mouseX < b.x + b.w &&
      mouseY > b.y &&
      mouseY < b.y + b.h
    )
      hovering = true;
  }

  // Dialogue box (advance / typewriter-skip click target)
  if (
    dialogueBoxBounds &&
    dialoguePhase !== "choosing" &&
    dialoguePhase !== "repeat-choosing"
  ) {
    const b = dialogueBoxBounds;
    if (
      mouseX > b.x &&
      mouseX < b.x + b.w &&
      mouseY > b.y &&
      mouseY < b.y + b.h
    )
      hovering = true;
  }

  // Dialogue choice buttons — reset each frame, set on hover
  if (dialoguePhase === "choosing" || dialoguePhase === "repeat-choosing") {
    selectedOption = -1;
    const btnW = 1080 / 3;
    const btnH = 241 / 3;
    const btnX = width * 0.6;
    const startY = height * 0.4;
    const gap = btnH + 10;
    const visibleIndices = getVisibleOptionIndices();
    for (let i = 0; i < visibleIndices.length; i++) {
      const btnY = startY + i * gap;
      if (
        mouseX > btnX &&
        mouseX < btnX + btnW &&
        mouseY > btnY &&
        mouseY < btnY + btnH
      ) {
        hovering = true;
        selectedOption = visibleIndices[i];
        break;
      }
    }
  }

  // NPC sprites (world-space hit test)
  if (dialoguePhase === "closed" && currentScene === "GAME") {
    for (const npc of npcs) {
      if (isMouseOverNPC(npc)) {
        hovering = true;
        break;
      }
    }
  }

  const clickCursor = "url('assets/cursor-click.png') 4 4, auto";
  const defaultCursor = "url('assets/cursor-default.png') 4 4, auto";
  document.body.style.cursor =
    hovering || mouseIsPressed ? clickCursor : defaultCursor;
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

  if (currentScene === "PROLOGUE") {
    prologueVideo.stop();
    currentScene = "GAME";
    prologueVideo.hide();
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
    const choosingPhase =
      dialoguePhase === "choosing" || dialoguePhase === "repeat-choosing";
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
    } else if (dialoguePhase === "repeat") {
      if (spoonsRemaining === 0) {
        closeDialogue();
      } else {
        dialoguePhase = "repeat-choosing";
      }
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
}

function mousePressed() {
  if (currentScene === "PROLOGUE") {
    prologueVideo.stop();
    currentScene = "GAME";
    prologueVideo.hide();
    return;
  }

  // Home screen — click "Press ENTER to start" row
  if (currentScene === "HOME") {
    const ty = height * 0.5 - 20;
    if (mouseY > ty - 16 && mouseY < ty + 16) {
      currentScene = "PROLOGUE";
      prologueVideo.play();
      prologueVideo.elt.onended = () => {
        currentScene = "GAME";
        prologueVideo.hide();
      };
      return;
    }
  }

  if (
    mouseX > width - 76 &&
    mouseX < width - 16 &&
    mouseY > 50 &&
    mouseY < 110
  ) {
    journal.toggle();
    return;
  }

  if (journal.isOpen) {
    journal.handleClick(mouseX, mouseY);
    return;
  }

  // NPC talk prompt click
  if (npcPromptBounds) {
    const b = npcPromptBounds;
    if (
      mouseX > b.x &&
      mouseX < b.x + b.w &&
      mouseY > b.y &&
      mouseY < b.y + b.h
    ) {
      openDialogue(b.npc);
      return;
    }
  }

  // NPC sprite click (only when player is nearby)
  if (dialoguePhase === "closed" && currentScene === "GAME") {
    for (const npc of npcs) {
      if (isMouseOverNPC(npc) && npc.isPlayerNearby(player)) {
        openDialogue(npc);
        return;
      }
    }
  }

  // Dialogue box click — same logic as pressing Enter (skips typewriter first)
  if (
    dialogueBoxBounds &&
    dialoguePhase !== "choosing" &&
    dialoguePhase !== "repeat-choosing"
  ) {
    const b = dialogueBoxBounds;
    if (
      mouseX > b.x &&
      mouseX < b.x + b.w &&
      mouseY > b.y &&
      mouseY < b.y + b.h
    ) {
      if (!typewriterDone) {
        skipTypewriter();
        return;
      }
      // advance phase (mirror Enter key logic for non-choosing phases)
      if (dialoguePhase === "opening") {
        dialoguePhase = "choosing";
      } else if (dialoguePhase === "repeat") {
        if (spoonsRemaining === 0) closeDialogue();
        else dialoguePhase = "repeat-choosing";
      } else if (dialoguePhase === "response") {
        dialoguePhase = "monologue";
        startTypewriter(chosenOption.monologue);
      } else if (dialoguePhase === "monologue") {
        if (
          !chosenOption ||
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
      return;
    }
  }

  // Dialogue choice button clicks
  if (dialoguePhase === "choosing" || dialoguePhase === "repeat-choosing") {
    const btnW = 1080 / 3;
    const btnH = 241 / 3;
    const btnX = width * 0.6;
    const startY = height * 0.4;
    const gap = btnH + 10;
    const visibleIndices = getVisibleOptionIndices();

    for (let i = 0; i < visibleIndices.length; i++) {
      const btnY = startY + i * gap;
      if (isMouseOver(btnX, btnY, btnW, btnH)) {
        selectedOption = visibleIndices[i];
        confirmChoice();
        return;
      }
    }
  }
}
