import "./styles.css";
import { categories, getCategory, getHeroProduct, getProduct, getSubcollectionHeroProduct, getSubcollectionProducts } from "./data/catalog.js";
import { GalleryScene } from "./scene/GalleryScene.js";
import { createHud } from "./ui/hud.js";
import { createWallPreview } from "./ui/wallPreview.js";

const canvas = document.querySelector("#gallery-canvas");
const hudRoot = document.querySelector("#hud-root");

const initialCategory = categories[0];
const appState = {
  mode: "intro",
  activeCategoryId: initialCategory.id,
  activeSubcollectionId: null,
  activeProductId: getHeroProduct(initialCategory).id,
};

let hud = null;
let interactionLocked = false;

function setInteractionLocked(locked) {
  interactionLocked = locked;
  hud?.setInteractionLocked(locked);
}

const gallery = new GalleryScene({
  canvas,
  categories,
  onCategorySelect: (categoryId) => openCategory(categoryId),
  onSubcollectionSelect: (subcollectionId) => openSubcollection(subcollectionId),
  onProductSelect: (productId) => selectProduct(productId, { openViewer: false }),
  onProductOpen: (productId) => selectProduct(productId, { openViewer: true }),
  onCategoryPreview: (categoryId) => hud?.previewCategory(categoryId),
  onInteractionLock: setInteractionLocked,
  onMobileLaneChange: (lane) => hud?.updateMobileRing(lane),
});

hud = createHud({
  root: hudRoot,
  categories,
  onIntro: showIntro,
  onBrowseHome: showBrowseHome,
  onCategory: openCategory,
  onSubcollection: openSubcollection,
  onProduct: (productId, options = {}) => selectProduct(productId, { openViewer: options.openViewer ?? appState.mode === "viewer" }),
  onViewer: () => openViewer(appState.activeProductId),
  onStepProduct: stepProduct,
  onCategoryScroll: (direction) => gallery.scrollCategoryBy(direction),
  onVariantChange: (productId, params) => gallery.applyViewerVariant(productId, params),
  onWallColorChange: (color) => gallery.setWallColor(color),
  onLayerExpandChange: (productId, expanded) => gallery.setLayerExpanded(productId, expanded),
  onPreviewModeChange: (mode) => gallery.setPreviewMode(mode),
  getLaneInfo: () => gallery.getMobileLaneItem(),
});

// "See it on your wall": every piece that has a single flat image (digital posters + wall-art
// silhouettes) can be placed onto a user-uploaded room photo. Layered/3D pieces have no flat
// source, so they are omitted.
const wallArtItems = categories
  .flatMap((category) => category.products)
  .filter((product) => product.image && (product.kind === "digital" || product.kind === "wall-art"))
  .map((product) => ({ id: product.id, name: product.name, image: product.image, kind: product.kind }));
const wallPreview = createWallPreview({
  artItems: wallArtItems,
  getActiveProductId: () => appState.activeProductId,
});
if (import.meta.env.DEV) window.__wallPreview = wallPreview;

function sync() {
  gallery.setState(appState);
  hud.update(appState);
}

function showIntro() {
  if (interactionLocked) return;
  appState.mode = "intro";
  appState.activeSubcollectionId = null;
  sync();
}

function showBrowseHome() {
  if (interactionLocked) return;
  appState.mode = "home";
  appState.activeSubcollectionId = null;
  sync();
}

function openCategory(categoryId) {
  if (interactionLocked) return;
  if (appState.mode === "category" && appState.activeCategoryId === categoryId && !appState.activeSubcollectionId) return;
  setInteractionLocked(true);
  gallery.prepareCategory(categoryId);
  const category = getCategory(categoryId);
  appState.mode = "category";
  appState.activeCategoryId = category.id;
  appState.activeSubcollectionId = null;
  appState.activeProductId = getHeroProduct(category).id;
  sync();
}

function openSubcollection(subcollectionId) {
  if (interactionLocked) return;
  if (appState.mode === "category" && appState.activeSubcollectionId === subcollectionId) return;
  setInteractionLocked(true);
  gallery.prepareCategory(appState.activeCategoryId, subcollectionId);
  const category = getCategory(appState.activeCategoryId);
  appState.mode = "category";
  appState.activeSubcollectionId = subcollectionId;
  appState.activeProductId = getSubcollectionHeroProduct(category, subcollectionId).id;
  sync();
}

function selectProduct(productId, { openViewer }) {
  if (interactionLocked) return;
  const { product, category } = getProduct(productId);
  appState.mode = openViewer ? "viewer" : appState.mode === "home" ? "category" : appState.mode;
  appState.activeCategoryId = category.id;
  appState.activeProductId = product.id;
  sync();
}

function openViewer(productId) {
  if (interactionLocked) return;
  const { product, category } = getProduct(productId);
  appState.mode = "viewer";
  appState.activeCategoryId = category.id;
  appState.activeProductId = product.id;
  sync();
}

function stepProduct(direction) {
  if (interactionLocked || appState.mode === "intro") return;
  const category = getCategory(appState.activeCategoryId);
  const products = getSubcollectionProducts(category, appState.activeSubcollectionId);
  const index = products.findIndex((product) => product.id === appState.activeProductId);
  const nextIndex = (index + direction + products.length) % products.length;
  appState.activeProductId = products[nextIndex].id;
  sync();
}

window.addEventListener("keydown", (event) => {
  if (interactionLocked) return;
  if (event.key === "Escape") showIntro();
  if (event.key === "ArrowLeft") {
    if (appState.mode === "category") gallery.scrollCategoryBy(-1);
    else stepProduct(-1);
  }
  if (event.key === "ArrowRight") {
    if (appState.mode === "category") gallery.scrollCategoryBy(1);
    else stepProduct(1);
  }
  if (event.key === "Enter" && appState.mode === "intro") showBrowseHome();
  else if (event.key === "Enter" && appState.mode !== "viewer") openViewer(appState.activeProductId);
});

sync();

// Dev-only introspection hook for debugging camera/layout in the browser console.
if (import.meta.env.DEV) window.__gallery = gallery;
