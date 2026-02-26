// player.js
// Owns player state only. Movement/animation can live in sketch.js for now.

class Player {
  constructor() {
    this.px = 0;
    this.py = 0;

    this.dir = 0;
    this.frame = 0;
    this.animTimer = 0;
    this.moving = false;
  }
}

window.Player = Player;