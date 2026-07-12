import { getCategory, getProduct, getSubcollection } from "../data/catalog.js";
import { COMMERCE } from "../data/shopifyVariants.js";

const SHOPIFY_PRODUCT_BASE = "https://blackaestheticspk.com/products";

// Site-side variant additions for Wall Art + Digital Art (NOT yet on Shopify — D53).
// Pricing rule (Master Khurram, 2026-07-12): Acrylic +30% over wood, 5mm +20% over base.
const THICKNESS_GROUP = { name: "Thickness", values: ["2mm", "3mm", "5mm"] };
const MATERIAL_GROUP = { name: "Material", values: ["Wood", "Acrylic"] };
const THICKNESS_MULTIPLIER = { "2mm": 1, "3mm": 1, "5mm": 1.2 };
const MATERIAL_MULTIPLIER = { Wood: 1, Acrylic: 1.3 };

const isPanelKind = (product) => product.kind === "wall-art" || product.kind === "digital";

function formatPkr(amount) {
  return `PKR ${Math.round(amount).toLocaleString("en-US")}`;
}

// The Shopify variant whose options match every non-site-side selection; falls back to the
// cheapest variant so a partial selection still prices sensibly.
function matchedVariant(commerce, selection) {
  const found = commerce.variants.find((variant) =>
    Object.entries(variant.options).every(([name, value]) => (selection[name] ?? value) === value),
  );
  return found ?? [...commerce.variants].sort((a, b) => a.price - b.price)[0];
}

// Current unit price for the selection. Shopify variant price is the exact base; the
// site-side Thickness/Material multipliers apply on top for wall art + digital only.
function unitPrice(product, category, selection) {
  const commerce = COMMERCE[product.id];
  let base = null;
  if (commerce) {
    base = matchedVariant(commerce, selection)?.price ?? null;
  } else {
    const match = String(product.price).match(/PKR\s*([\d,]+)/i);
    if (match) base = Number(match[1].replaceAll(",", ""));
  }
  if (base === null) return null; // "Quote" products stay quotes
  if (isPanelKind(product)) {
    base *= THICKNESS_MULTIPLIER[selection.Thickness ?? "2mm"] ?? 1;
    base *= MATERIAL_MULTIPLIER[selection.Material ?? "Wood"] ?? 1;
  }
  return base;
}

export function createHud({
  root,
  categories,
  onIntro,
  onBrowseHome,
  onCategory,
  onProduct,
  onStepProduct,
  onCategoryScroll,
  onVariantChange,
  onLayerExpandChange,
}) {
  root.innerHTML = `
    <header class="hud-top">
      <button class="brand" type="button" data-action="intro" aria-label="Return to introduction">
        <img src="/logo-blackaesthetics.svg" alt="" />
      </button>
      <div class="hud-actions">
        <button class="search-pill" type="button" data-action="search" aria-label="Search products">
          <span aria-hidden="true">Search products or categories</span>
        </button>
        <button class="icon-button bag-button" type="button" data-action="checkout" aria-label="Open bag">Bag</button>
        <button class="icon-button" type="button" data-action="intro" aria-label="Reset view">Reset</button>
      </div>
    </header>

    <section class="home-copy" data-panel="home">
      <p>BLACK AESTHETICS</p>
      <h1>Gallery Storefront</h1>
      <span>Choose a bay to enter its collection.</span>
    </section>

    <button class="intro-browse" type="button" data-action="browse-home">Browse Store</button>

    <nav class="category-rail" aria-label="Store categories"></nav>

    <div class="category-scroll-controls" data-panel="category-scroll" hidden>
      <button type="button" data-action="category-scroll-prev" aria-label="Scroll collection left">
        <span class="scroll-arrow is-left" aria-hidden="true"></span>
      </button>
      <button type="button" data-action="category-scroll-next" aria-label="Scroll collection right">
        <span class="scroll-arrow is-right" aria-hidden="true"></span>
      </button>
    </div>

    <div class="collection-context" data-panel="collection-context" hidden>
      <span></span>
      <button type="button" data-action="category">All niches</button>
    </div>

    <aside class="product-panel" data-panel="product" hidden>
      <button class="text-link" type="button" data-action="category">Back to Collection</button>
      <p class="eyebrow"></p>
      <h2></h2>
      <p class="price"></p>
      <p class="material"></p>
      <div class="variant-groups"></div>
      <button class="layer-expand-button" type="button" data-action="toggle-layer-expand" hidden>Expand Layers</button>
      <div class="quantity-row">
        <span>Quantity</span>
        <div class="quantity-stepper" aria-label="Quantity">
          <button type="button" data-action="decrement" aria-label="Decrease quantity">-</button>
          <strong></strong>
          <button type="button" data-action="increment" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <div class="viewer-step-row">
        <button type="button" class="chip" data-action="prev">Prev</button>
        <button type="button" class="chip" data-action="next">Next</button>
      </div>
      <div class="buy-row">
        <button class="buy" type="button" data-action="add-to-cart">Add to Cart</button>
        <a class="shopify-buy" href="#" target="_blank" rel="noreferrer">Buy with Shopify</a>
        <a class="whatsapp" href="#" target="_blank" rel="noreferrer" aria-label="Order via WhatsApp">WA</a>
      </div>
    </aside>

    <aside class="checkout-panel" data-panel="checkout" hidden>
      <button class="text-link close-link" type="button" data-action="close-checkout">Close</button>
      <p class="eyebrow">Bag</p>
      <h2></h2>
      <p class="checkout-options"></p>
      <div class="checkout-line">
        <span>Subtotal</span>
        <strong></strong>
      </div>
      <div class="checkout-note">
        <span>Checkout</span>
        <span>Shopify secure</span>
      </div>
      <div class="checkout-actions">
        <a class="checkout-link" href="#" target="_blank" rel="noreferrer">Continue to Shopify</a>
        <button class="secondary-button" type="button" data-action="close-checkout">Keep Browsing</button>
      </div>
    </aside>

    <div class="viewer-controls" data-panel="viewer" hidden>
      <button type="button" data-action="prev" aria-label="Previous product">Prev</button>
      <button type="button" data-action="next" aria-label="Next product">Next</button>
      <button type="button" data-action="category" aria-label="Back to collection">Grid</button>
      <button type="button" data-action="browse-home" aria-label="Back to Gallery View">Gallery</button>
    </div>

    <section class="search-panel" data-panel="search" hidden>
      <button class="text-link close-link" type="button" data-action="close-search">Close</button>
      <label>
        <span>Search</span>
        <input type="search" placeholder="Product or category" autocomplete="off" />
      </label>
      <div class="search-results"></div>
    </section>
  `;

  const categoryRail = root.querySelector(".category-rail");
  const homePanel = root.querySelector('[data-panel="home"]');
  const introBrowse = root.querySelector(".intro-browse");
  const bagButton = root.querySelector(".bag-button");
  const productPanel = root.querySelector('[data-panel="product"]');
  const checkoutPanel = root.querySelector('[data-panel="checkout"]');
  const viewerControls = root.querySelector('[data-panel="viewer"]');
  const categoryScrollControls = root.querySelector('[data-panel="category-scroll"]');
  const collectionContext = root.querySelector('[data-panel="collection-context"]');
  const searchPanel = root.querySelector('[data-panel="search"]');
  const searchInput = root.querySelector('input[type="search"]');
  const searchResults = root.querySelector(".search-results");
  const optionSelections = new Map();
  let lastState = null;
  let previewedCategoryId = null;
  let activeProductId = null;
  let layersExpanded = false;
  let quantity = 1;
  let interactionLocked = false;

  root.addEventListener("click", (event) => {
    if (interactionLocked) return;
    const optionTarget = event.target.closest("[data-option-group]");
    if (optionTarget) {
      setOption(optionTarget.dataset.optionGroup, optionTarget.dataset.optionValue);
      return;
    }

    const categoryTarget = event.target.closest("[data-category]");
    if (categoryTarget) {
      closeTemporaryPanels();
      onCategory(categoryTarget.dataset.category);
      return;
    }

    const resultTarget = event.target.closest("[data-result-product]");
    if (resultTarget) {
      closeTemporaryPanels();
      onProduct(resultTarget.dataset.resultProduct, { openViewer: true });
      return;
    }

    const actionTarget = event.target.closest("[data-action]");
    if (!actionTarget) return;

    const action = actionTarget.dataset.action;
    if (action === "intro") {
      closeTemporaryPanels();
      onIntro();
    }
    if (action === "browse-home") {
      closeTemporaryPanels();
      onBrowseHome();
    }
    if (action === "search") {
      searchPanel.hidden = false;
      checkoutPanel.hidden = true;
      searchInput.focus();
    }
    if (action === "close-search") searchPanel.hidden = true;
    if (action === "checkout") openCheckout();
    if (action === "close-checkout") {
      checkoutPanel.hidden = true;
      render(lastState);
    }
    if (action === "add-to-cart") openCheckout();
    if (action === "category" && lastState) {
      closeTemporaryPanels();
      onCategory(lastState.activeCategoryId);
    }
    if (action === "prev") onStepProduct(-1);
    if (action === "next") onStepProduct(1);
    if (action === "category-scroll-prev") onCategoryScroll?.(-1);
    if (action === "category-scroll-next") onCategoryScroll?.(1);
    if (action === "toggle-layer-expand" && lastState) {
      const { product } = getProduct(lastState.activeProductId);
      layersExpanded = !layersExpanded;
      renderProductPanel(product, getCategory(lastState.activeCategoryId));
      onLayerExpandChange?.(product.id, layersExpanded);
    }
    if (action === "decrement") {
      quantity = Math.max(1, quantity - 1);
      render(lastState);
    }
    if (action === "increment") {
      quantity += 1;
      render(lastState);
    }
  });

  searchInput.addEventListener("input", () => renderSearch(searchInput.value));

  function render(state) {
    if (!state) return;
    lastState = state;
    root.dataset.mode = state.mode;
    document.querySelector("#app")?.setAttribute("data-mode", state.mode);
    const { product, category } = getProduct(state.activeProductId);

    if (activeProductId !== product.id) {
      activeProductId = product.id;
      layersExpanded = false;
      quantity = 1;
      checkoutPanel.hidden = true;
      ensureSelection(product, category);
      onLayerExpandChange?.(product.id, false);
    }

    categoryRail.innerHTML = [
      `<button class="${state.mode === "home" ? "is-active" : ""}" type="button" data-action="browse-home"><span class="nav-dot"></span><span>Gallery View</span></button>`,
      ...categories.map(
        (item) => `
          <button class="${item.id === state.activeCategoryId && state.mode !== "home" ? "is-active" : ""}" type="button" data-category="${item.id}" aria-label="Open ${escapeAttribute(item.label)}">
            <span class="nav-dot"></span>
            <span>${escapeHtml(item.label.replace("Objects", "ART"))}</span>
          </button>
        `,
      ),
    ].join("");

    homePanel.hidden = true;
    introBrowse.hidden = state.mode !== "intro";
    categoryRail.hidden = state.mode === "intro";
    bagButton.hidden = state.mode === "intro";
    productPanel.hidden = state.mode !== "viewer" || !checkoutPanel.hidden;
    viewerControls.hidden = state.mode !== "viewer";
    categoryScrollControls.hidden = state.mode !== "category";
    const activeCategory = getCategory(state.activeCategoryId);
    const subcollection = getSubcollection(activeCategory, state.activeSubcollectionId);
    collectionContext.hidden = state.mode !== "category" || !subcollection;
    if (subcollection) collectionContext.querySelector("span").textContent = subcollection.label;

    renderProductPanel(product, category);
    renderCheckout(state);
    renderSearch(searchInput.value);
    applyCategoryPreview();
  }

  function previewCategory(categoryId) {
    previewedCategoryId = categoryId;
    applyCategoryPreview();
  }

  function setInteractionLocked(locked) {
    interactionLocked = locked;
    root.dataset.interactionLocked = locked ? "true" : "false";
    root.classList.toggle("is-transitioning", locked);
    // The viewer mesh is rebuilt during transitions — reapply the remembered selection
    // as soon as the scene hands interaction back.
    if (!locked) notifyVariant();
  }

  function applyCategoryPreview() {
    categoryRail.querySelectorAll("[data-category]").forEach((button) => {
      button.classList.toggle("is-previewed", button.dataset.category === previewedCategoryId);
    });
  }

  function renderProductPanel(product, category) {
    productPanel.querySelector(".eyebrow").textContent = category.label;
    productPanel.querySelector("h2").textContent = product.name;
    const price = unitPrice(product, category, selectionFor(product.id));
    productPanel.querySelector(".price").textContent = price === null ? product.price : formatPkr(price);
    productPanel.querySelector(".material").textContent = productDescription(product, category);
    productPanel.querySelector(".variant-groups").innerHTML = renderVariantGroups(product, category);
    const expandButton = productPanel.querySelector(".layer-expand-button");
    expandButton.hidden = product.kind !== "layered";
    expandButton.textContent = layersExpanded ? "Collapse Layers" : "Expand Layers";
    expandButton.setAttribute("aria-pressed", layersExpanded ? "true" : "false");
    productPanel.querySelector(".quantity-stepper strong").textContent = quantity;
    productPanel.querySelector(".shopify-buy").href = productUrl(product);
    productPanel.querySelector(".whatsapp").href = whatsappUrl(product, category);
  }

  function renderCheckout(state) {
    if (!state) return;
    const { product, category } = getProduct(state.activeProductId);
    checkoutPanel.querySelector("h2").textContent = product.name;
    checkoutPanel.querySelector(".checkout-options").textContent = `${selectionSummary(product, category)} · Qty ${quantity}`;
    const price = unitPrice(product, category, selectionFor(product.id));
    checkoutPanel.querySelector(".checkout-line strong").textContent =
      price === null ? subtotal(product.price, quantity) : formatPkr(price * quantity);
    checkoutPanel.querySelector(".checkout-link").href = productUrl(product);
  }

  function renderSearch(query) {
    if (!lastState) return;
    const term = query.trim().toLowerCase();
    const products = categories.flatMap((category) =>
      category.products.map((product) => ({ ...product, category })),
    );
    const matches = products
      .filter((product) => !term || product.name.toLowerCase().includes(term) || product.category.label.toLowerCase().includes(term))
      .slice(0, 9);

    searchResults.innerHTML = matches
      .map((product) => {
        const thumbStyle = product.image ? ` style="--thumb-image: url('${escapeAttribute(product.image)}')"` : "";
        return `
          <button type="button" data-result-product="${escapeAttribute(product.id)}">
            <span class="result-thumb"${thumbStyle}></span>
            <span>
              <strong>${escapeHtml(product.name)}</strong>
              <small>${escapeHtml(product.category.label)} · ${escapeHtml(product.price)}</small>
            </span>
          </button>
        `;
      })
      .join("");
  }

  function setOption(group, value) {
    if (!lastState) return;
    const productSelections = selectionFor(lastState.activeProductId);
    productSelections[group] = value;
    render(lastState);
    notifyVariant();
  }

  // Tell the 3D scene what the selection means so the displayed mesh represents it (D54).
  function notifyVariant() {
    if (!lastState || lastState.mode !== "viewer" || !onVariantChange) return;
    const { product, category } = getProduct(lastState.activeProductId);
    ensureSelection(product, category);
    onVariantChange(product.id, variantParams(product, category, selectionFor(product.id)));
  }

  function openCheckout() {
    if (!lastState) return;
    checkoutPanel.hidden = false;
    productPanel.hidden = true;
    searchPanel.hidden = true;
    renderCheckout(lastState);
  }

  function closeTemporaryPanels() {
    searchPanel.hidden = true;
    checkoutPanel.hidden = true;
  }

  function ensureSelection(product, category) {
    const selection = selectionFor(product.id);
    optionGroups(product, category).forEach((group) => {
      if (!selection[group.name]) selection[group.name] = defaultOption(group);
    });
  }

  function selectionFor(productId) {
    if (!optionSelections.has(productId)) optionSelections.set(productId, {});
    return optionSelections.get(productId);
  }

  function renderVariantGroups(product, category) {
    const selection = selectionFor(product.id);
    return optionGroups(product, category)
      .map(
        (group) => `
          <div class="variant-group">
            <p>${escapeHtml(group.name)}</p>
            <div class="variant-options">
              ${group.values
                .map((value) => {
                  const selected = selection[group.name] === value;
                  return `<button class="chip ${selected ? "is-selected" : ""}" type="button" data-option-group="${escapeAttribute(group.name)}" data-option-value="${escapeAttribute(value)}" aria-pressed="${selected}">${escapeHtml(value)}</button>`;
                })
                .join("")}
            </div>
          </div>
        `,
      )
      .join("");
  }

  function selectionSummary(product, category) {
    const selection = selectionFor(product.id);
    return optionGroups(product, category)
      .map((group) => `${group.name}: ${selection[group.name] ?? defaultOption(group)}`)
      .join(" · ");
  }

  function whatsappUrl(product, category) {
    const message = `I want to order ${product.name} from Black Aesthetics. ${selectionSummary(product, category)}. Quantity: ${quantity}`;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }

  return { update: render, previewCategory, setInteractionLocked };
}

function optionGroups(product, category) {
  const commerce = COMMERCE[product.id];
  if (commerce) {
    // Exact Shopify option groups (names, values, order) — never invent values for
    // matched products. Site-side Thickness/Material append for wall art + digital.
    const groups = commerce.options.map((group) => ({ name: group.name, values: [...group.values] }));
    if (isPanelKind(product)) groups.push(THICKNESS_GROUP, MATERIAL_GROUP);
    return groups;
  }

  // Local-only products (no live Shopify listing yet): consistent placeholder structure.
  if (category.id === "digital-art") {
    return [
      { name: "Size", values: ["6x9 inches", "8x12 inches", "12x18 inches", "18x24 inches"] },
      THICKNESS_GROUP,
      MATERIAL_GROUP,
    ];
  }

  if (category.id === "3d-objects") {
    return [
      { name: "Scale", values: ["80 mm", "120 mm", "Custom"] },
      { name: "Color", values: ["Matte black", "Natural PLA"] },
    ];
  }

  if (product.kind === "layered") {
    return [
      { name: "Size", values: ["12 in", "18 in", "24 in"] },
      { name: "Finish", values: ["Black MDF", "Walnut edge"] },
    ];
  }

  return [
    { name: "Size", values: ["12x18 inches", "18x24 inches", "24x36 inches"] },
    THICKNESS_GROUP,
    MATERIAL_GROUP,
  ];
}

const isSizeGroup = (name) => /size|scale/i.test(name);

// "24x20 inches" -> 480, "12 in" -> 144, "80 mm" -> 6400 — a comparable area number.
function parsedArea(value) {
  const numbers = String(value).match(/\d+(\.\d+)?/g);
  if (!numbers?.length) return null;
  const [a, b] = numbers.map(Number);
  return b ? a * b : a * a;
}

// Display default = the LARGEST size (Master Khurram, 2026-07-12); other groups take
// their first value (Wood, 2mm — the visual baseline the 3D mesh is modeled at).
function defaultOption(group) {
  if (isSizeGroup(group.name)) {
    let best = group.values[group.values.length - 1];
    let bestArea = -1;
    for (const value of group.values) {
      const area = parsedArea(value);
      if (area !== null && area > bestArea) {
        bestArea = area;
        best = value;
      }
    }
    return best;
  }
  return group.values[0];
}

// Translate the current selection into what the 3D viewer should show.
// sizeRatio is LINEAR (sqrt of area ratio) against the largest offered size.
function variantParams(product, category, selection) {
  const groups = optionGroups(product, category);
  let sizeRatio = 1;
  const sizeGroup = groups.find((group) => isSizeGroup(group.name));
  if (sizeGroup) {
    const areas = sizeGroup.values.map(parsedArea).filter((area) => area !== null);
    const selectedArea = parsedArea(selection[sizeGroup.name] ?? defaultOption(sizeGroup));
    if (areas.length && selectedArea) sizeRatio = Math.sqrt(selectedArea / Math.max(...areas));
  }
  let thicknessMul = 1;
  if (isPanelKind(product) && selection.Thickness) {
    const mm = Number(String(selection.Thickness).match(/\d+/)?.[0] ?? 2);
    thicknessMul = mm / 2; // 2mm is the modeled baseline depth
  }
  const acrylic = isPanelKind(product) && selection.Material === "Acrylic";
  return { sizeRatio, thicknessMul, acrylic };
}

function productDescription(product, category) {
  if (product.kind === "object") return `${product.material}. Printed to order and confirmed through Shopify or WhatsApp.`;
  return `${product.material}. ${category.description}`;
}

function productUrl(product) {
  // Matched products link to their REAL live Shopify page by handle.
  const commerce = COMMERCE[product.id];
  return `${SHOPIFY_PRODUCT_BASE}/${encodeURIComponent(commerce?.handle ?? product.id)}`;
}

function subtotal(price, quantity) {
  const match = price.match(/PKR\s*([\d,]+)/i);
  if (!match) return price;
  const amount = Number(match[1].replaceAll(",", ""));
  return `PKR ${(amount * quantity).toLocaleString("en-US")}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

const escapeAttribute = escapeHtml;
