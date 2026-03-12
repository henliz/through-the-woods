let dialoguePhase = "closed";
let activeNPC = null;
let selectedOption = 0; // which button is highlighted (0, 1, 2)
let spoonsRemaining = 7; // spoon budget for the day
let chosenOption = null; // stores the option the player picked
const tooTiredLine = "Gosh… I couldn't bring myself to ask them that."; // dialogue for when you don't have enough spoons to choose a dialogue option

// Exposed dialogue box bounds so sketch.js can hit-test clicks/hover
let dialogueBoxBounds = null;

// Typewriter effect state
let typewriterTarget = "";
let typewriterIndex = 0;
let typewriterDone = true;
let typewriterFrame = 0;
const TYPEWRITER_SPEED = 2; // frames per character (~30 chars/sec at 60fps)

function startTypewriter(text) {
  typewriterTarget = text || "";
  typewriterIndex = 0;
  typewriterFrame = 0;
  typewriterDone = typewriterTarget.length === 0;
}

function skipTypewriter() {
  typewriterIndex = typewriterTarget.length;
  typewriterDone = true;
}

function tickTypewriter() {
  if (typewriterDone) return;
  typewriterFrame++;
  if (typewriterFrame >= TYPEWRITER_SPEED) {
    typewriterFrame = 0;
    typewriterIndex++;
    if (typewriterIndex >= typewriterTarget.length) {
      typewriterIndex = typewriterTarget.length;
      typewriterDone = true;
    }
  }
}

function openDialogue(npc) {
  activeNPC = npc;

  // reset to first visible option, not just index 0
  let visible = getVisibleOptionIndices();
  selectedOption = visible.length > 0 ? visible[0] : 0;

  if (spoonsRemaining === 0) {
    dialoguePhase = "hesitation"; // too tired to talk to anyone
    startTypewriter(npc.dialogue.hesitationLine);
    return;
  }

  if (npc.firstVisit) {
    dialoguePhase = "opening";
    startTypewriter(npc.dialogue.opening);
  } else {
    dialoguePhase = "repeat";
    startTypewriter(npc.dialogue.repeatLine);
  }
}

function closeDialogue() {
  if (activeNPC) {
    activeNPC.firstVisit = false; // flip after first full conversation
  }
  activeNPC = null;
  chosenOption = null;
  dialoguePhase = "closed";
}

function drawDialogue() {
  if (dialoguePhase === "closed") {
    dialogueBoxBounds = null;
    return;
  }
  tickTypewriter();

  let boxW = 1857 / 3; // control width only
  let boxH = 681 / 3; // height follows aspect ratio
  let boxX = width * 0.12; // left-aligned with small margin
  let boxY = height - boxH - 20; // pinned to bottom with padding

  dialogueBoxBounds = { x: boxX, y: boxY, w: boxW, h: boxH };

  drawPortrait(boxX, boxY, boxW);
  drawDialogueBox(boxX, boxY, boxW, boxH);
  drawNameTag(boxX, boxY, boxW);
  drawDialogueText(boxX, boxY, boxW, boxH);
  drawEnterHint(boxX, boxY, boxW, boxH);

  if (dialoguePhase === "choosing" || dialoguePhase === "repeat-choosing") {
    drawOptions();
  }
}

//helper functions for drawDialogue
function drawDialogueBox(boxX, boxY, boxW, boxH) {
  if (dialoguePhase === "monologue" || dialoguePhase === "hesitation") {
    image(uiMonologueBox, boxX, boxY, boxW, boxH);
  } else {
    image(uiMainBox, boxX, boxY, boxW, boxH);
  }
}

function drawPortrait(boxX, boxY, boxW) {
  let pW = 300;
  let pH = 420;
  let pY = boxY - pH * 0.9; // floats above the box

  if (dialoguePhase === "monologue" || dialoguePhase === "hesitation") {
    // Little Red on the RIGHT during monologue
    let pX = boxX + boxW - pW - 20;
    if (portraits.littleRed) {
      image(portraits.littleRed.idle, pX, pY, pW, pH);
    } else {
      // placeholder if image not loaded
      fill(200, 150, 150);
      noStroke();
      rect(pX, pY, pW, pH, 8);
      fill(80);
      textSize(12);
      textAlign(CENTER, CENTER);
      text("Little Red", pX + pW / 2, pY + pH / 2);
    }
  } else {
    // NPC portrait on the LEFT
    let pX = boxX + 20;
    let portraitImg = getActivePortrait();
    if (portraitImg) {
      image(portraitImg, pX, pY, pW, pH);
    } else {
      // placeholder if portrait not ready yet
      fill(150, 150, 200);
      noStroke();
      rect(pX, pY, pW, pH, 8);
      fill(80);
      textSize(12);
      textAlign(CENTER, CENTER);
      text(activeNPC.dialogue.name || "NPC", pX + pW / 2, pY + pH / 2);
    }
  }
}

function getActivePortrait() {
  if (!activeNPC || !activeNPC.portraitKey) return null;
  let npcPortraits = portraits[activeNPC.portraitKey];
  if (!npcPortraits) return null;
  let emotion = activeNPC.currentEmotion || "idle";
  return npcPortraits[emotion] || npcPortraits.idle || null;
}

function drawNameTag(boxX, boxY, boxW) {
  let tagH = 70;
  let tagY = boxY - tagH;

  if (dialoguePhase === "monologue" || dialoguePhase === "hesitation") {
    // Little Red name tag on the RIGHT
    let tagW = 180;
    let tagX = boxX + boxW - tagW - 20;
    fill(168, 86, 21);
    noStroke();
    rect(tagX, tagY, tagW, tagH, 4);
    fill(255);
    textSize(38);
    textAlign(CENTER, CENTER);
    text("Little Red", tagX + tagW / 2, tagY + tagH / 2.5);
  } else if (activeNPC && activeNPC.dialogue.name) {
    // NPC name tag on the LEFT
    textSize(38); // set size first so textWidth measures correctly
    let tagW = textWidth(activeNPC.dialogue.name) + 60;
    let tagX = boxX + 20;
    fill(168, 86, 21);
    noStroke();
    rect(tagX, tagY, tagW, tagH, 4);
    fill(255);
    textAlign(CENTER, CENTER);
    text(activeNPC.dialogue.name, tagX + tagW / 2, tagY + tagH / 2.5);
  }
}

function drawDialogueText(boxX, boxY, boxW, boxH) {
  // text starts after the portrait width so it doesn't overlap
  let textX = boxX + 50;
  let textW = boxW - 75;
  let revealed = typewriterTarget.substring(0, typewriterIndex);

  if (dialoguePhase === "hesitation") {
    fill(255);
    textStyle(ITALIC);
    textSize(30);
    textAlign(LEFT, TOP);
    text(revealed, textX, boxY + 40, textW, boxH - 80);
    textStyle(NORMAL);
    return;
  }

  if (dialoguePhase === "monologue" && chosenOption) {
    fill(255);
    textStyle(ITALIC);
    textSize(30);
    textAlign(LEFT, TOP);
    text(revealed, textX, boxY + 40, textW, boxH - 80);
    textStyle(NORMAL);
    return;
  }

  fill(255);
  textSize(30);
  textAlign(LEFT, TOP);

  if (dialoguePhase === "opening" || dialoguePhase === "choosing") {
    text(revealed, textX, boxY + 40, textW, boxH - 80);
  }
  if (dialoguePhase === "repeat" || dialoguePhase === "repeat-choosing") {
    text(revealed, textX, boxY + 40, textW, boxH - 80);
  }
  if (dialoguePhase === "response" && chosenOption) {
    text(revealed, textX, boxY + 40, textW, boxH - 80);
  }
}

function drawEnterHint(boxX, boxY, boxW, boxH) {
  // don't show during choosing — player knows to use W/S/Enter
  if (dialoguePhase === "choosing" || dialoguePhase === "repeat-choosing")
    return;
  // don't show until text has fully revealed
  if (!typewriterDone) return;

  const hintX = boxX + boxW - 60;
  const hintY = boxY + boxH - 25;

  // brighten on hover
  const hinting = dialogueBoxBounds &&
    mouseX > dialogueBoxBounds.x && mouseX < dialogueBoxBounds.x + dialogueBoxBounds.w &&
    mouseY > dialogueBoxBounds.y && mouseY < dialogueBoxBounds.y + dialogueBoxBounds.h;

  fill(255, 255, 255, hinting ? 255 : 200);
  textSize(18);
  textAlign(RIGHT, BOTTOM);
  text("Press ENTER to continue", hintX, hintY);
}

function isMouseOver(x, y, w, h) {
  //detects when the mouswe is over a dialogue option box
  return mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;
}

function drawOptions() {
  if (!activeNPC) return;

  let btnW = 1080 / 3;
  let btnH = 241 / 3;
  let btnX = width * 0.6;
  let startY = height * 0.4;
  let gap = btnH + 10;

  let visibleIndices = getVisibleOptionIndices(); // single source of truth

  for (let drawnIndex = 0; drawnIndex < visibleIndices.length; drawnIndex++) {
    let i = visibleIndices[drawnIndex]; // real option index
    let option = activeNPC.dialogue.options[i];
    let btnY = startY + drawnIndex * gap;
    let canAfford = spoonsRemaining >= option.cost;

    // draw button image based on state
    if (!canAfford && option.id !== "C") {
      image(uiBtnDisabled, btnX, btnY, btnW, btnH);
    } else if (i === selectedOption) {
      image(uiBtnHover, btnX, btnY, btnW, btnH);
    } else {
      image(uiBtnRegular, btnX, btnY, btnW, btnH + 18);
    }

    // text colour — white on dark red hover, dark on light buttons
    if (i === selectedOption && (canAfford || option.id === "C")) {
      fill(255); // white text on dark red hover button
    } else if (!canAfford && option.id !== "C") {
      fill(100, 100, 100); // grey text on disabled button
    } else {
      fill(30, 30, 30); // dark text on regular button
    }

    textSize(18);
    textAlign(LEFT, CENTER);
    text(option.playerLine, btnX + 13, btnY - 7, btnW - 60, btnH);

    // cookie cost badge
    let iconSize = 25;
    let iconX = btnX + btnW - iconSize - 8;
    let iconY = btnY + btnH / 2 - iconSize / 2;
    image(spoonImg, iconX, iconY, iconSize, iconSize);

    // cost number next to the cookie
    fill(255);
    textAlign(RIGHT, CENTER);
    textSize(18);
    text(option.cost, btnX + btnW - iconSize - 12, btnY + btnH / 2);
  }
}

function confirmChoice() {
  let option = activeNPC.dialogue.options[selectedOption];

  // can't afford and not the exit option → show tooTired monologue
  if (spoonsRemaining < option.cost && option.id !== "C") {
    chosenOption = {
      monologue: tooTiredLine,
      cost: -1, // special value so it doesn't trigger exit
      npcResponse: null,
    };
    dialoguePhase = "monologue";
    startTypewriter(tooTiredLine);
    return;
  }

  spoonsRemaining -= option.cost;
  chosenOption = option;

  // reset highlight to first visible option for next time buttons appear
  let visible = getVisibleOptionIndices();
  // filter out the option just chosen since it'll be gone next round
  visible = visible.filter(
    (i) => activeNPC.dialogue.options[i].id !== option.id,
  );
  selectedOption = visible.length > 0 ? visible[0] : 0;

  // mark this option as used (skip C — it's always the exit)
  if (option.id !== "C") {
    activeNPC.usedOptions.push(option.id);
  }

  // add notebook entry if this option has one
  if (option.notebookEntry && activeNPC.journalPageIndex !== undefined) {
    journal.addTextEntry(activeNPC.journalPageIndex, option.notebookEntry);
  }

  dialoguePhase = "response";
  startTypewriter(option.npcResponse);
}

function bedtime() {
  if (
    spoonsRemaining === 0 &&
    dialoguePhase === "closed" //||
    //(spoonsRemaining === 1 && dialoguePhase === "closed")
  ) {
    fill("black");
    rect(0, 0, width, height);

    fill("white");
    textSize(13);
    text(
      "With no more spoons left to give, little Red went off to bed. A restless slumber waiting just ahead.",
      width / 2,
      height / 2,
    );

    textSize(20);
    text("DAY 1 OVER", width / 2, height / 2 + 40);
  }
}

function getVisibleOptionIndices() {
  if (!activeNPC) return [];
  let visible = [];
  let options = activeNPC.dialogue.options;

  for (let i = 0; i < options.length; i++) {
    let option = options[i];
    // skip used options (except C which is always visible)
    if (option.id !== "C" && activeNPC.usedOptions.includes(option.id)) {
      continue;
    }
    visible.push(i);
  }
  return visible;
}

window.openDialogue = openDialogue;
window.closeDialogue = closeDialogue;
window.drawDialogue = drawDialogue;
window.dialoguePhase = dialoguePhase;
window.bedtime = bedtime;
window.startTypewriter = startTypewriter;
window.skipTypewriter = skipTypewriter;
