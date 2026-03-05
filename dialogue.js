let dialoguePhase = "closed";
let activeNPC = null;
let selectedOption = 0; // which button is highlighted (0, 1, 2)
let spoonsRemaining = 7; // spoon budget for the day
let chosenOption = null; // stores the option the player picked

function openDialogue(npc) {
  activeNPC = npc;
  selectedOption = 0; // reset highlighted button each time

  if (npc.firstVisit) {
    dialoguePhase = "opening"; // full conversation
  } else {
    dialoguePhase = "repeat"; // short one-liner
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

  // --- blue box ---
  let boxX = width * 0.1;
  let boxY = height * 0.7;
  let boxW = width * 0.8;
  let boxH = height * 0.25;

  fill(70, 130, 180);
  noStroke();
  rect(boxX, boxY, boxW, boxH);

  fill(255);
  textSize(10);
  text(
    "Click 'E' to continue. Use 'W' and 'S' to hover over an option and click 'E' to select",
    370,
    height * 0.8 + 90,
  );

  fill(255);
  textSize(18);
  textAlign(LEFT, TOP);

  // show different text depending on the phase

  if (dialoguePhase === "repeat") {
    //when the player goes back to inetract with an npc they already have interacted with for the day
    fill(255);
    textSize(18);
    textAlign(LEFT, TOP);
    text(
      activeNPC.dialogue.repeatLine,
      boxX + 30,
      boxY + 20,
      boxW - 60,
      boxH - 20,
    );
    return; // don't draw anything else
  }
  if (dialoguePhase === "opening") {
    text(
      activeNPC.dialogue.opening,
      boxX + 30,
      boxY + 20,
      boxW - 60,
      boxH - 20,
    );
  }

  if (dialoguePhase === "choosing") {
    text(
      activeNPC.dialogue.opening,
      boxX + 30,
      boxY + 20,
      boxW - 60,
      boxH - 20,
    );
    drawOptions();
  }

  if (dialoguePhase === "response" && chosenOption) {
    text(chosenOption.npcResponse, boxX + 30, boxY + 20, boxW - 60, boxH - 20);
  }

  if (dialoguePhase === "monologue" && chosenOption) {
    //this write's the mc's internal thoughts
    // draw a slightly different box color to signal a different "mood"
    fill(70, 130, 180);
    noStroke();
    rect(boxX, boxY, boxW, boxH);

    // italic red text for internal monologue
    fill("#2e0401");
    textStyle(ITALIC);
    textSize(18);
    textAlign(LEFT, TOP);
    text(chosenOption.monologue, boxX + 30, boxY + 20, boxW - 60, boxH - 20);

    // reset text style so nothing else is accidentally italic
    textStyle(NORMAL);
  }
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

  for (let i = 0; i < options.length; i++) {
    let btnY = startY + i * gap;
    let option = options[i];
    let canAfford = spoonsRemaining >= option.cost;

    // highlight if selected or mouse is hovering
    if (isMouseOver(btnX, btnY, btnW, btnH)) {
      selectedOption = i;
    }

    if (i === selectedOption && canAfford) {
      fill(180, 180, 180); // darker grey = highlighted
    } else if (!canAfford) {
      fill(100, 100, 100); // dark grey = can't afford
    } else {
      fill(220, 220, 220); // light grey = normal
    }

    noStroke();
    rect(btnX, btnY, btnW, btnH, 6); // 6 = rounded corners

    // button text
    if (canAfford) {
      fill(30, 30, 30); // dark text if affordable
    } else {
      fill(160, 160, 160); // faded text if can't afford
    }

    textSize(14);
    textAlign(LEFT, CENTER);
    text(option.playerLine, btnX + 10, btnY, btnW - 60, btnH);

    // spoon cost badge on the right
    textAlign(RIGHT, CENTER);
    textSize(13);
    text("🥄 " + option.cost, btnX + btnW - 8, btnY + btnH / 2);
  }
}

function confirmChoice() {
  let option = activeNPC.dialogue.options[selectedOption];
  if (spoonsRemaining < option.cost) return;

  spoonsRemaining -= option.cost;
  chosenOption = option;

  // Add notebook entry if this option has one
  if (option.notebookEntry && activeNPC.journalPageIndex !== undefined) {
    journal.addTextEntry(activeNPC.journalPageIndex, option.notebookEntry);
  }

  dialoguePhase = "response";
}

function mousePressed() {
  if (dialoguePhase !== "choosing") return;

  let btnW = width * 0.28;
  let btnH = height * 0.07;
  let btnX = width * 0.6;
  let startY = height * 0.4;
  let gap = btnH + 10;

  for (let i = 0; i < 3; i++) {
    let btnY = startY + i * gap;
    if (isMouseOver(btnX, btnY, btnW, btnH)) {
      selectedOption = i;
      confirmChoice();
    }
  }
}

function bedtime() {
  if (spoonsRemaining === 0 && dialoguePhase === "closed") {
    fill("black");
    rect(0, 0, width, height);

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

window.openDialogue = openDialogue;
window.closeDialogue = closeDialogue;
window.drawDialogue = drawDialogue;
window.dialoguePhase = dialoguePhase;
window.bedtime = bedtime;
