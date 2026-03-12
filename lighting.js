// lighting.js
// Atmospheric purple/blue tint — drawn in screen-space AFTER the world, BEFORE UI.
//
// Cross-platform approach: no offscreen buffer, no destination-out.
// destination-out has a known GPU compositing bug on Windows Chrome.
// Instead: dark source-over overlay + screen-mode light gradients directly
// on the main canvas. screen blend is universally supported.

// TF1_T is a global const from tavernFloor1.js (loaded first).
const LIGHT_SOURCES = [
  // ── Top rooms ──────────────────────────────────────────────────────────────
  { x:  3.5 * TF1_T, y:  0.7 * TF1_T, r: 210, seed: 0.11 },
  { x: 10.5 * TF1_T, y:  0.7 * TF1_T, r: 210, seed: 1.34 },

  // ── Upper corridor ─────────────────────────────────────────────────────────
  { x:  7.0 * TF1_T, y:  2.5 * TF1_T, r: 260, seed: 2.57 },

  // ── Main hall ──────────────────────────────────────────────────────────────
  { x:  3.0 * TF1_T, y:  4.5 * TF1_T, r: 340, seed: 3.21 },
  { x:  7.0 * TF1_T, y:  4.5 * TF1_T, r: 380, seed: 4.45 },
  { x: 11.0 * TF1_T, y:  4.5 * TF1_T, r: 320, seed: 5.68 },
  { x: 12.5 * TF1_T, y:  3.8 * TF1_T, r: 230, seed: 6.02 },

  // ── Centre corridor ────────────────────────────────────────────────────────
  { x:  7.0 * TF1_T, y:  6.5 * TF1_T, r: 230, seed: 7.14 },

  // ── Tavern / bar ───────────────────────────────────────────────────────────
  { x: 11.5 * TF1_T, y:  8.5 * TF1_T, r: 370, seed: 8.37 },
  { x:  3.5 * TF1_T, y:  8.5 * TF1_T, r: 310, seed: 9.60 },
  { x:  7.0 * TF1_T, y:  8.5 * TF1_T, r: 290, seed: 0.83 },

  // ── Lower corridor ─────────────────────────────────────────────────────────
  { x:  7.0 * TF1_T, y: 10.5 * TF1_T, r: 230, seed: 1.96 },

  // ── Lobby ──────────────────────────────────────────────────────────────────
  { x:  3.5 * TF1_T, y: 13.0 * TF1_T, r: 330, seed: 3.09 },
  { x:  7.0 * TF1_T, y: 13.0 * TF1_T, r: 350, seed: 4.22 },
  { x: 10.5 * TF1_T, y: 13.0 * TF1_T, r: 310, seed: 5.45 },
];

// Flicker cache — recomputed every FLICKER_INTERVAL frames
const FLICKER_INTERVAL = 3;
let _flickerTick   = 0;
const _flickerF    = new Float32Array(LIGHT_SOURCES.length).fill(1.0);
let   _flickerPlayer = 1.0;

// No buffer needed — lighting draws directly on the main canvas
function lightingSetup()   {}
function lightingResized() {}

// World → screen
function _w2s(wx, wy) {
  return [(wx - camX) * CAM_ZOOM, (wy - camY) * CAM_ZOOM];
}

// Draw one screen-mode light circle (brightens whatever is beneath it)
function _screenLight(ctx, sx, sy, r) {
  const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
  g.addColorStop(0,    'rgba(60, 45, 80, 0.45)');
  g.addColorStop(0.35, 'rgba(40, 30, 58, 0.22)');
  g.addColorStop(0.65, 'rgba(18, 13, 30, 0.08)');
  g.addColorStop(1,    'rgba(0,  0,  0,  0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(sx, sy, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawLighting() {
  if (currentScene !== "GAME") return;

  const ctx = drawingContext; // main canvas — no offscreen buffer
  const t   = frameCount * 0.016;

  // ── Refresh flicker cache every FLICKER_INTERVAL frames ───────────────────
  if (_flickerTick === 0) {
    _flickerPlayer = 0.92 + noise(t + 9.9) * 0.08;
    for (let i = 0; i < LIGHT_SOURCES.length; i++) {
      _flickerF[i] = 0.82 + noise(t + LIGHT_SOURCES[i].seed) * 0.18;
    }
  }
  _flickerTick = (_flickerTick + 1) % FLICKER_INTERVAL;

  // ── 1. Dark ambient overlay (source-over — works everywhere) ───────────────
  noStroke();
  fill(18, 8, 42, 140); // 0.55 opacity
  rect(0, 0, width, height);

  // ── 2. Brighten lit areas with screen-mode gradients ──────────────────────
  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  // Player carries a gentle personal glow
  const [ppx, ppy] = _w2s(player.px, player.py);
  _screenLight(ctx, ppx, ppy, 240 * _flickerPlayer * CAM_ZOOM);

  // Inn light sources — cull off-screen
  for (let i = 0; i < LIGHT_SOURCES.length; i++) {
    const src = LIGHT_SOURCES[i];
    const [sx, sy] = _w2s(src.x, src.y);
    const r = src.r * _flickerF[i] * CAM_ZOOM;
    if (sx + r < 0 || sx - r > width || sy + r < 0 || sy - r > height) continue;
    _screenLight(ctx, sx, sy, r);
  }

  ctx.restore(); // resets globalCompositeOperation to source-over

  // ── 3. Very gentle scene-wide purple breathe ──────────────────────────────
  noStroke();
  const pulse = 4 + noise(t * 0.25) * 8;
  fill(45, 15, 85, pulse);
  rect(0, 0, width, height);
}

window.lightingSetup   = lightingSetup;
window.lightingResized = lightingResized;
window.drawLighting    = drawLighting;
