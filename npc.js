//npc.js
//this is where the template for any npc will live. this allows u to easily add any new npcs

class NPC {
  constructor(x, y, dialogue) {
    this.x = x;
    this.y = y;
    this.dialogue = dialogue;
    this.firstVisit = true;
    this.interactRadius = 80;
    //this.colour = color(255, 100, 100); // default red
  }

  isPlayerNearby(player) {
    let d = dist(player.px, player.py, this.x, this.y);
    return d < this.interactRadius;
  }

  draw() {
    // placeholder — just a coloured circle for now
    fill(this.colour);
    noStroke();
    circle(this.x, this.y, 40);
  }
}
//to check collisions into npcs so the player doesn't walk throught them
function playerHitsNPC(cx, cy, r) {
  for (let npc of npcs) {
    let d = dist(cx, cy, npc.x, npc.y);
    if (d < r + 35) return true; // 20 is the NPC's collision radius
  }
  return false;
}
window.NPC = NPC;
