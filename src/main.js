import "./styles.css";
import { categories, getCategory, getHeroProduct, getProduct, getSubcollectionHeroProduct, getSubcollectionProducts } from "./data/catalog.js";
import { GalleryScene } from "./scene/GalleryScene.js";
import { createHud } from "./ui/hud.js";

const canvas = document.querySelector("#gallery-canvas");
const hudRoot = document.querySelector("#hud-root");

const initialCategory = categories[0];
const appState = {
  mode: "home",
  activeCategoryId: initialCategory.id,
  activeSubcollectionId: null,
  activeProductId: getHeroProduct(initialCategory).id,
};

const gallery = new GalleryScene({
  canvas,
  categories,
  onCategorySelect: (categoryId) => openCategory(categoryId),
  onSubcollectionSelect: (subcollectionId) => openSubcollection(subcollectionId),
  onProductSelect: (productId) => selectProduct(productId, { openViewer: false }),
  onProductOpen: (productId) => selectProduct(productId, { openViewer: true }),
});

const hud = createHud({
  root: hudRoot,
  categories,
  onHome: showHome,
  onCategory: openCategory,
  onProduct: (productId, options = {}) => selectProduct(productId, { openViewer: options.openViewer ?? appState.mode === "viewer" }),
  onViewer: () => openViewer(appState.activeProductId),
  onStepProduct: stepProduct,
  onCategoryScroll: (direction) => gallery.scrollCategoryBy(direction),
});

function sync() {
  gallery.setState(appState);
  hud.update(appState);
}

function showHome() {
  appState.mode = "home";
  appState.activeSubcollectionId = null;
  sync();
}

function openCategory(categoryId) {
  const category = getCategory(categoryId);
  appState.mode = "category";
  appState.activeCategoryId = category.id;
  appState.activeSubcollectionId = null;
  appState.activeProductId = getHeroProduct(category).id;
  sync();
}

function openSubcollection(subcollectionId) {
  const category = getCategory(appState.activeCategoryId);
  appState.mode = "category";
  appState.activeSubcollectionId = subcollectionId;
  appState.activeProductId = getSubcollectionHeroProduct(category, subcollectionId).id;
  sync();
}

function selectProduct(productId, { openViewer }) {
  const { product, category } = getProduct(productId);
  appState.mode = openViewer ? "viewer" : appState.mode === "home" ? "category" : appState.mode;
  appState.activeCategoryId = category.id;
  appState.activeProductId = product.id;
  sync();
}

function openViewer(productId) {
  const { product, category } = getProduct(productId);
  appState.mode = "viewer";
  appState.activeCategoryId = category.id;
  appState.activeProductId = product.id;
  sync();
}

function stepProduct(direction) {
  const category = getCategory(appState.activeCategoryId);
  const products = getSubcollectionProducts(category, appState.activeSubcollectionId);
  const index = products.findIndex((product) => product.id === appState.activeProductId);
  const nextIndex = (index + direction + products.length) % products.length;
  appState.activeProductId = products[nextIndex].id;
  sync();
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") showHome();
  if (event.key === "ArrowLeft") {
    if (appState.mode === "category") gallery.scrollCategoryBy(-1);
    else stepProduct(-1);
  }
  if (event.key === "ArrowRight") {
    if (appState.mode === "category") gallery.scrollCategoryBy(1);
    else stepProduct(1);
  }
  if (event.key === "Enter" && appState.mode !== "viewer") openViewer(appState.activeProductId);
});

sync();
