//npc.js
//this is where the template for any npc will live. this allows u to easily add any new npcs

class NPC {
  constructor(x, y, dialogue) {
    this.x = x;
    this.y = y;
    this.dialogue = dialogue;
    this.firstVisit = true;
    this.interactRadius = 80;
    this.usedOptions = []; // options tracker

    // patrol
    this.waypoints = null; // set to [{x,y}, ...] to enable patrolling
    this.waypointIndex = 0;
    this.patrolSpeed = 1.2;
    this.moving = false;
    this.dir = 0; // 0 = down (DIR loads later in sketch.js)
    this.frame = 0;
    this.animTimer = 0;
  }

  update() {
    // don't move during dialogue
    if (!this.waypoints || dialoguePhase !== "closed") {
      this.moving = false;
      this.frame = 0;
      this.animTimer = 0;
      return;
    }

    const target = this.waypoints[this.waypointIndex];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    if (d < this.patrolSpeed + 1) {
      // reached waypoint — advance to next
      this.waypointIndex = (this.waypointIndex + 1) % this.waypoints.length;
      this.moving = false;
    } else {
      this.moving = true;
      const nx = this.x + (dx / d) * this.patrolSpeed;
      const ny = this.y + (dy / d) * this.patrolSpeed;
      if (!tf1IsSolidAtPixel(nx, this.y)) this.x = nx;
      if (!tf1IsSolidAtPixel(this.x, ny)) this.y = ny;

      // pick facing direction from dominant axis
      if (Math.abs(dx) >= Math.abs(dy)) {
        this.dir = dx > 0 ? DIR.right : DIR.left;
      } else {
        this.dir = dy > 0 ? DIR.down : DIR.up;
      }

      // advance walk animation
      this.animTimer++;
      if (this.animTimer >= ANIM_SPEED) {
        this.animTimer = 0;
        this.frame = (this.frame + 1) % 4;
      }
    }
  }

  isPlayerNearby(player) {
    let d = dist(player.px, player.py, this.x, this.y);
    return d < this.interactRadius;
  }

  draw() {
    if (this.sprite) {
      const fw = this.spriteFrameW || 48;
      const fh = this.spriteFrameH || 48;
      // RPG Maker walk cycle: cols 0,1,2 → animate as 0,1,2,1
      const animCol = this.moving ? [0, 1, 2, 1][this.frame] : 1;
      const sx = animCol * fw;
      const sy = this.dir * fh;
      imageMode(CENTER);
      image(
        this.sprite,
        this.x,
        this.y - 8,
        fw * CHAR_SCALE,
        fh * CHAR_SCALE,
        sx,
        sy,
        fw,
        fh,
      );
      imageMode(CORNER);
    } else {
      fill(this.colour);
      noStroke();
      circle(this.x, this.y, 40);
    }
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
