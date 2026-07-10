import "./styles.css";
import { categories, getCategory, getHeroProduct, getProduct } from "./data/catalog.js";
import { GalleryScene } from "./scene/GalleryScene.js";
import { createHud } from "./ui/hud.js";

const canvas = document.querySelector("#gallery-canvas");
const hudRoot = document.querySelector("#hud-root");

const initialCategory = categories[0];
const appState = {
  mode: "home",
  activeCategoryId: initialCategory.id,
  activeProductId: getHeroProduct(initialCategory).id,
};

const gallery = new GalleryScene({
  canvas,
  categories,
  onCategorySelect: (categoryId) => openCategory(categoryId),
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
});

function sync() {
  gallery.setState(appState);
  hud.update(appState);
}

function showHome() {
  appState.mode = "home";
  sync();
}

function openCategory(categoryId) {
  const category = getCategory(categoryId);
  appState.mode = "category";
  appState.activeCategoryId = category.id;
  appState.activeProductId = getHeroProduct(category).id;
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
  const index = category.products.findIndex((product) => product.id === appState.activeProductId);
  const nextIndex = (index + direction + category.products.length) % category.products.length;
  appState.activeProductId = category.products[nextIndex].id;
  sync();
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") showHome();
  if (event.key === "ArrowLeft") stepProduct(-1);
  if (event.key === "ArrowRight") stepProduct(1);
  if (event.key === "Enter" && appState.mode !== "viewer") openViewer(appState.activeProductId);
});

sync();
