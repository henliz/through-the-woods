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
  {
    key: "table1",
    path: "assets/table-3.png",
  },
  {
    key: "counter1",
    path: "assets/counter-4.png",
  },
  {
    key: "bigtable1",
    path: "assets/bigtable-5.png",
  },
  {
    key: "pillar",
    path: "assets/pillar-2.png",
  },
  {
    key: "bed1",
    path: "assets/bed-1.png",
  },
  {
    key: "bed2",
    path: "assets/bed-2.png",
  },
  {
    key: "bed3",
    path: "assets/bed-4.png",
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
  {
    key: "shelf2",
    path: "assets/shelf-2.png",
  },
  {
    key: "bigtable2",
    path: "assets/bigtable-2.png",
  },
];

const roomLayout = [
  { asset: "table1", tileX: 3, tileY: 7.5, scale: 4, anchor: "top-left" },
  {
    asset: "counter1",
    tileX: 11,
    tileY: 8,
    scale: 4,
    anchor: "top-right",
    rotation: 90,
  },
  {
    asset: "bigtable1",
    tileX: 3,
    tileY: 13.3,
    scale: 7,
    anchor: "top-left",
  },
  {
    asset: "pillar",
    tileX: 12,
    tileY: 8,
    scale: 3,
    anchor: "bottom",
    rotation: 45,
  },
  {
    asset: "bed1",
    tileX: 1.6,
    tileY: 4.2,
    scale: 6,
    anchor: "top-left",
  },
  {
    asset: "bed2",
    tileX: 11.8,
    tileY: 0.7,
    scale: 6,
    anchor: "bottom",
  },
  {
    asset: "bed3",
    tileX: 2.6,
    tileY: 0.6,
    scale: 5,
    anchor: "bottom",
  },
  {
    asset: "sofa1",
    tileX: 11,
    tileY: 12,
    scale: 6,
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
  {
    asset: "shelf2",
    tileX: 4.2,
    tileY: 0,
    scale: 6,
    anchor: "bottom",
  },
  {
    asset: "bigtable2",
    tileX: 2.8,
    tileY: 3.6,
    scale: 4,
    anchor: "bottom",
  },
];

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
  // We rely on your tavernFloor1 globals
  const T = window.TF1_T ?? 128;

  // Loop through all placed props and draw each one
  for (const p of CLUTTER) {
    if (!p.img) continue;

    const dw = p.img.width * (p.scale ?? 4);
    const dh = p.img.height * (p.scale ?? 4);

    const x = worldX + p.tileX * T;
    const y = worldY + p.tileY * T;

    // bottom-anchor so it sits on the floor nicely
    if (p.anchor === "bottom") {
      image(p.img, x, y + T - dh, dw, dh);
    } else {
      image(p.img, x, y, dw, dh);
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
