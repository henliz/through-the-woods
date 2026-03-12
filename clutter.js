// clutter.js
// Simple props layer for tavern. Draws in WORLD SPACE.
// Uses multi-asset loading framework to manage many furniture/prop images.

// ============================================================
// ASSET STORAGE & ASSET LIST
// ============================================================

/**
 * clutterImages: Object to store all loaded PNG images
 * Each key corresponds to a named asset (e.g., "table", "chair", "lamp")
 */
const clutterImages = {};

const CLUTTER = []; // will hold placed props

/**
 * clutterAssetList: Array defining all assets to load
 * Structure: { key: "name", path: "relative/path/to/image.png" }
 */
const clutterAssetList = [
  //Lobby clutter
  {
    key: "bigtable1",
    path: "assets/bigtable-5.png",
  },
  {
    key: "sofa1",
    path: "assets/walls/sofa-1.png",
  },
  {
    key: "piano",
    path: "assets/Piano.png",
  },
  {
    key: "pianochair1",
    path: "assets/pianochair.png",
  },
  {
    key: "shelf1",
    path: "assets/shelf-1.png",
  },
  {
    key: "sofa2",
    path: "assets/walls/sofa-3.png",
  },
  {
    key: "plant1",
    path: "assets/plant-1.png",
  },

  //Travern clutter
  {
    key: "table1",
    path: "assets/table-3.png",
  },
  {
    key: "counter1",
    path: "assets/counter-4.png",
  },

  {
    key: "pillar",
    path: "assets/pillar-2.png",
  },
  {
    key: "stool1",
    path: "assets/stool-1.png",
  },
  {
    key: "stool2",
    path: "assets/stool-2.png",
  },
  {
    key: "stool3",
    path: "assets/stool-1.png",
  },

  //Room 1
  {
    key: "bed1",
    path: "assets/bed-5.png",
  },
  {
    key: "cabinet1",
    path: "assets/cabinet.png",
  },

  //Room 2
  {
    key: "bed2",
    path: "assets/bed-2.png",
  },
  {
    key: "shelf3",
    path: "assets/shelf-3.png",
  },
  //Room 3
  {
    key: "bed3",
    path: "assets/bed-4.png",
  },
  {
    key: "shelf2",
    path: "assets/shelf-2.png",
  },

  //Little Red Room Door
  {
    key: "door1",
    path: "assets/door-1.png",
  },

  //office clutter
  {
    key: "desk",
    path: "assets/desk.png",
  },
  {
    key: "deskchair",
    path: "assets/deskchair.png",
  },
  {
    key: "painting",
    path: "assets/painting.png",
  },
  {
    key: "bigtable2",
    path: "assets/bigtable-4.png",
  },
  {
    key: "TV",
    path: "assets/TV.png",
  },
  {
    key: "cabinet2",
    path: "assets/cabinet-2.png",
  },
];

const roomLayout = [
  // Tavern clutter setting
  {
    asset: "table1",
    tileX: 3,
    tileY: 7.5,
    scale: 4,
    anchor: "top-left",
  },
  {
    asset: "counter1",
    tileX: 11,
    tileY: 8,
    scale: 4,
    anchor: "top-right",
  },
  {
    asset: "pillar",
    tileX: 12,
    tileY: 8,
    scale: 3,
    anchor: "bottom",
  },
  {
    asset: "stool1",
    tileX: 10.5,
    tileY: 6.8,
    scale: 3,
    anchor: "top-left",
  },
  {
    asset: "stool2",
    tileX: 9.8,
    tileY: 6.8,
    scale: 3,
    anchor: "top-left",
  },
  {
    asset: "stool3",
    tileX: 11,
    tileY: 6.8,
    scale: 3,
    anchor: "top-left",
  },

  //Lobby clutter setting
  {
    asset: "bigtable1",
    tileX: 3,
    tileY: 13.3,
    scale: 7,
    anchor: "top-left",
  },
  {
    asset: "piano",
    tileX: 10,
    tileY: 13.6,
    scale: 5,
    anchor: "top-left",
  },
  {
    asset: "pianochair1",
    tileX: 10.4,
    tileY: 14.3,
    scale: 4,
    anchor: "top-left",
  },
  {
    asset: "plant1",
    tileX: 10.4,
    tileY: 12,
    scale: 5,
    anchor: "top-left",
  },
  {
    asset: "sofa1",
    tileX: 11,
    tileY: 12,
    scale: 6,
    anchor: "top-left",
  },

  {
    asset: "shelf1",
    tileX: 2.8,
    tileY: 11.5,
    scale: 4.3,
    anchor: "top-left",
  },
  {
    asset: "sofa2",
    tileX: 3.7,
    tileY: 12,
    scale: 6,
    anchor: "top-left",
  },

  //Room 1 cultter setting
  {
    asset: "bed1",
    tileX: 1.6,
    tileY: 4,
    scale: 6,
    anchor: "top-left",
  },
  {
    asset: "cabinet1",
    tileX: 2.6,
    tileY: 3.6,
    scale: 4,
    anchor: "bottom",
  },

  //Room 2 clutter setting
  {
    asset: "bed2",
    tileX: 11.8,
    tileY: 0.7,
    scale: 6,
    anchor: "bottom",
  },
  {
    asset: "shelf3",
    tileX: 10.4,
    tileY: 0,
    scale: 6,
    anchor: "bottom",
  },

  //Room 3 clutter setting
  {
    asset: "bed3",
    tileX: 2.6,
    tileY: 0.6,
    scale: 5,
    anchor: "bottom",
  },
  {
    asset: "shelf2",
    tileX: 4.2,
    tileY: 0,
    scale: 6,
    anchor: "bottom",
  },

  //office clutter setting
  {
    asset: "desk",
    tileX: 13,
    tileY: 5,
    scale: 7,
    anchor: "top-left",
  },
  {
    asset: "deskchair",
    tileX: 12.6,
    tileY: 5.1,
    scale: 4,
    anchor: "top-left",
  },
  {
    asset: "painting",
    tileX: 11.6,
    tileY: 2.5,
    scale: 4,
    anchor: "bottom",
  },
  {
    asset: "bigtable2",
    tileX: 12.4,
    tileY: 3.7,
    scale: 4,
    anchor: "top-left",
  },
  {
    asset: "TV",
    tileX: 12.5,
    tileY: 3.5,
    scale: 3,
    anchor: "top-left",
  },
  {
    asset: "cabinet2",
    tileX: 11.8,
    tileY: 3.7,
    scale: 3,
    anchor: "top-left",
  },
];

//Little Red Room Door setting
const door1Layout = {
  asset: "door1",
  tileX: 7.3,
  tileY: 1.1,
  scale: 5,
  anchor: "bottom",
  interactRadius: 120, // radius (in pixels) where the player can interact
};

// ============================================================
// HELPER: Get position and size for a prop
// ============================================================

function getPropPosition(f, worldX = 0, worldY = 0) {
  const T = window.TF1_T ?? 128;
  const img = f.img || clutterImages[f.asset];
  if (!img) return null;

  const dw = img.width * (f.scale ?? 4);
  const dh = img.height * (f.scale ?? 4);

  const x = worldX + f.tileX * T;
  const y = worldY + f.tileY * T;

  let actualX = x;
  let actualY = y;
  if (f.anchor === "bottom") {
    actualY = y + T - dh;
  }

  return { actualX, actualY, dw, dh };
}

function isPlayerNearDoor1(player) {
  // determine door's world position (center of the sprite)
  const pos = getPropPosition(door1Layout);
  if (!pos) return false;

  const doorCenterX = pos.actualX + pos.dw / 2;
  const doorCenterY = pos.actualY + pos.dh / 2;
  const d = dist(player.px, player.py, doorCenterX, doorCenterY);

  return d < (door1Layout.interactRadius || 80);
}

// ============================================================
// COLLISON: Check if player collides with any clutter props. Returns true if collision detected.
// ============================================================

function checkCollision(playerNextX, playerNextY, playerR) {
  let radius = playerR;

  for (const f of roomLayout) {
    const pos = getPropPosition(f);
    if (!pos) continue;

    // Bounding box of the prop
    const left = pos.actualX;
    const right = pos.actualX + pos.dw;
    const top = pos.actualY;
    const bottom = pos.actualY + pos.dh;

    // Find closest point on rectangle to circle center
    const closestX = Math.max(left, Math.min(playerNextX, right));
    const closestY = Math.max(top, Math.min(playerNextY, bottom));

    // Distance from circle center to closest point
    const distX = playerNextX - closestX;
    const distY = playerNextY - closestY;
    const distance = Math.sqrt(distX * distX + distY * distY);

    if (distance <= radius) {
      return true; // Collision detected
    }
  }
  return false; // No collision
}

// ============================================================
// PRELOAD: Load all assets from the list
// ============================================================

function clutterPreload() {
  // Loop through asset list and load each image
  for (const asset of clutterAssetList) {
    clutterImages[asset.key] = loadImage(
      asset.path,
      () => console.log(`[clutter] loaded: ${asset.key}`),
      () => console.error(`[clutter] FAILED to load: ${asset.key}`),
    );
  }
}

// ============================================================
// SETUP: Place props in the scene
// ============================================================

function clutterSetup() {
  // Clear previous clutter
  CLUTTER.length = 0;

  // Place props from roomLayout
  for (const item of roomLayout) {
    const img = clutterImages[item.asset];
    if (!img) {
      console.warn(`Image for ${item.asset} not loaded`);
      continue;
    }
    CLUTTER.push({
      img: img,
      tileX: item.tileX,
      tileY: item.tileY,
      scale: window.TF1_SCALE ?? item.scale ?? 4,
      anchor: item.anchor || "bottom",
    });
  }
}

// ============================================================
// DRAW: Render all props in the CLUTTER array
// ============================================================

function clutterDraw(worldX = 0, worldY = 0) {
  // Loop through all placed props and draw each one
  for (const p of CLUTTER) {
    if (!p.img) continue;

    const pos = getPropPosition(p, worldX, worldY);
    if (!pos) continue;

    image(p.img, pos.actualX, pos.actualY, pos.dw, pos.dh);
  }

  // Draw door1 separately
  const doorImg = clutterImages[door1Layout.asset];
  if (doorImg) {
    const pos = getPropPosition(door1Layout, worldX, worldY);
    if (pos) {
      image(doorImg, pos.actualX, pos.actualY, pos.dw, pos.dh);
    }
  }
}

// ============================================================
// EXPOSE TO P5 GLOBAL MODE
// ============================================================

// expose to p5 global mode
window.clutterPreload = clutterPreload;
window.clutterSetup = clutterSetup;
window.clutterDraw = clutterDraw;
// also expose door layout so other modules can inspect or modify it
window.door1Layout = door1Layout;
