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
    path: "assets/table-2.png",
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
    path: "assets/bed-3.png",
  },
  {
    key: "sofa1",
    path: "assets/sofa-2.png",
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
    tileY: 13,
    scale: 6,
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
    scale: 5,
    anchor: "top-left",
  },
  {
    asset: "bed2",
    tileX: 12,
    tileY: 0.7,
    scale: 5,
    anchor: "bottom",
  },
  {
    asset: "bed3",
    tileX: 2.6,
    tileY: 0.7,
    scale: 5,
    anchor: "bottom",
  },
  {
    asset: "sofa1",
    tileX: 8,
    tileY: 6,
    scale: 5,
    anchor: "top-left",
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
