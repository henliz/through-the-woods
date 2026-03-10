let dialoguePhase = "closed";
let activeNPC = null;
let selectedOption = 0; // which button is highlighted (0, 1, 2)
let spoonsRemaining = 7; // spoon budget for the day
let chosenOption = null; // stores the option the player picked
const tooTiredLine = "Gosh… I couldn't bring myself to ask them that."; // dialogue for when you don't have enough spoons to choose a dialogue option

function openDialogue(npc) {
  activeNPC = npc;

  // reset to first visible option, not just index 0
  let visible = getVisibleOptionIndices();
  selectedOption = visible.length > 0 ? visible[0] : 0;

  if (spoonsRemaining === 0) {
    dialoguePhase = "hesitation"; // too tired to talk to anyone
    return;
  }

  if (npc.firstVisit) {
    dialoguePhase = "opening";
  } else {
    dialoguePhase = "repeat";
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
  if (dialoguePhase === "closed") return;

  let boxX = width * 0.1;
  let boxY = height * 0.7;
  let boxW = width * 0.8;
  let boxH = height * 0.25;

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
  fill(70, 130, 180);
  noStroke();
  rect(boxX, boxY, boxW, boxH, 8);
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
  let tagH = 28;
  let tagY = boxY - tagH;

  if (dialoguePhase === "monologue" || dialoguePhase === "hesitation") {
    // Little Red name tag on the RIGHT
    let tagW = 100;
    let tagX = boxX + boxW - tagW - 20;
    fill(50, 100, 150);
    noStroke();
    rect(tagX, tagY, tagW, tagH, 4);
    fill(255);
    textSize(13);
    textAlign(CENTER, CENTER);
    text("Little Red", tagX + tagW / 2, tagY + tagH / 2);
  } else if (activeNPC && activeNPC.dialogue.name) {
    // NPC name tag on the LEFT
    let tagW = textWidth(activeNPC.dialogue.name) + 24;
    let tagX = boxX + 20;
    fill(50, 100, 150);
    noStroke();
    rect(tagX, tagY, tagW, tagH, 4);
    fill(255);
    textSize(13);
    textAlign(LEFT, CENTER);
    text(activeNPC.dialogue.name, tagX + 12, tagY + tagH / 2);
  }
}

function drawDialogueText(boxX, boxY, boxW, boxH) {
  // text starts after the portrait width so it doesn't overlap
  let textX = boxX + 30;
  let textW = boxW - 60;

  if (dialoguePhase === "hesitation") {
    fill("#2e0401");
    textStyle(ITALIC);
    textSize(16);
    textAlign(LEFT, TOP);
    text(activeNPC.dialogue.hesitationLine, textX, boxY + 20, textW, boxH - 40);
    textStyle(NORMAL);
    return;
  }

  if (dialoguePhase === "monologue" && chosenOption) {
    fill("#2e0401");
    textStyle(ITALIC);
    textSize(16);
    textAlign(LEFT, TOP);
    text(chosenOption.monologue, textX, boxY + 20, textW, boxH - 40);
    textStyle(NORMAL);
    return;
  }

  fill(255);
  textSize(16);
  textAlign(LEFT, TOP);

  if (dialoguePhase === "opening") {
    text(activeNPC.dialogue.opening, textX, boxY + 20, textW, boxH - 40);
  }
  if (dialoguePhase === "choosing") {
    text(activeNPC.dialogue.opening, textX, boxY + 20, textW, boxH - 40);
  }
  if (dialoguePhase === "repeat" || dialoguePhase === "repeat-choosing") {
    text(activeNPC.dialogue.repeatLine, textX, boxY + 20, textW, boxH - 40);
  }
  if (dialoguePhase === "response" && chosenOption) {
    text(chosenOption.npcResponse, textX, boxY + 20, textW, boxH - 40);
  }
}

function drawEnterHint(boxX, boxY, boxW, boxH) {
  // don't show during choosing — player knows to use W/S/Enter
  if (dialoguePhase === "choosing" || dialoguePhase === "repeat-choosing")
    return;

  fill(255, 255, 255, 180);
  textSize(11);
  textAlign(RIGHT, BOTTOM);
  text("Press ENTER to continue", boxX + boxW - 15, boxY + boxH - 10);
}

function isMouseOver(x, y, w, h) {
  //detects when the mouswe is over a dialogue option box
  return mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;
}

function drawOptions() {
  if (!activeNPC) return;

  let btnW = width * 0.28;
  let btnH = height * 0.07;
  let btnX = width * 0.6;
  let startY = height * 0.4;
  let gap = btnH + 10;

  let options = activeNPC.dialogue.options;
  let drawnIndex = 0; // tracks vertical position separately from option index

  for (let i = 0; i < options.length; i++) {
    let option = options[i];

    // skip options already used (except C which is always the exit)
    if (option.id !== "C" && activeNPC.usedOptions.includes(option.id)) {
      continue;
    }

    let btnY = startY + drawnIndex * gap;
    let canAfford = spoonsRemaining >= option.cost;

    // style the button
    if (!canAfford && option.id !== "C") {
      fill(160, 160, 160); // faded — can't afford
    } else if (i === selectedOption) {
      fill(180, 180, 180); // highlighted
    } else {
      fill(220, 220, 220); // normal
    }

    noStroke();
    rect(btnX, btnY, btnW, btnH, 6);

    // text colour
    fill(
      canAfford || option.id === "C" ? color(30, 30, 30) : color(120, 120, 120),
    );
    textSize(14);
    textAlign(LEFT, CENTER);
    text(option.playerLine, btnX + 10, btnY, btnW - 60, btnH);

    // spoon cost badge
    textAlign(RIGHT, CENTER);
    textSize(13);
    text("🥄 " + option.cost, btnX + btnW - 8, btnY + btnH / 2);

    drawnIndex++;
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
    return;
  }

  spoonsRemaining -= option.cost;
  chosenOption = option;

  // mark this option as used (skip C — it's always the exit)
  if (option.id !== "C") {
    activeNPC.usedOptions.push(option.id);
  }

  // add notebook entry if this option has one
  if (option.notebookEntry && activeNPC.journalPageIndex !== undefined) {
    journal.addTextEntry(activeNPC.journalPageIndex, option.notebookEntry);
  }

  dialoguePhase = "response";
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
