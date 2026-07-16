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
  onPreviewModeChange,
  getLaneInfo,
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
        <button class="icon-button bag-button" type="button" data-action="checkout" aria-label="Open cart">Cart</button>
        <button class="icon-button preview-toggle" type="button" data-action="toggle-preview-mode" aria-pressed="false">Mobile</button>
        <button class="icon-button" type="button" data-action="intro" aria-label="Reset view">Reset</button>
      </div>
    </header>

    <section class="home-copy" data-panel="home">
      <p>BLACK AESTHETICS</p>
      <h1>Gallery Storefront</h1>
      <span>Choose a bay to enter its collection.</span>
    </section>

    <button class="intro-browse" type="button" data-action="browse-home">Browse Store</button>

    <!-- D55 mobile stage: floating DOM UI over the charcoal 3D canvas (portrait only). -->
    <div class="mobile-stage" aria-hidden="true">
      <div class="m-intro" data-mpanel="intro">
        <img class="m-intro-logo" src="/logo-blackaesthetics.svg" alt="Black Aesthetics" />
        <h1>OBJECTS WITH PRESENCE.</h1>
        <p>Black Aesthetics creates distinctive wall art, digital prints, layered pieces and 3D objects for spaces with character.</p>
      </div>
      <div class="m-home-labels" data-mpanel="home">
        ${categories
          .map(
            (item, index) => `
              <button type="button" data-category="${escapeAttribute(item.id)}" style="--m-slot: ${index}">
                <span>${escapeHtml(item.label.toUpperCase())}</span>
                <em>View collection</em>
              </button>
            `,
          )
          .join("")}
      </div>
      <div class="m-category" data-mpanel="category">
        <p class="m-cat-eyebrow"></p>
        <h2 class="m-cat-title"></h2>
        <div class="m-hero-plaque"><strong></strong><span></span></div>
        <div class="m-lane-plaque"><strong></strong><span></span></div>
      </div>
    </div>

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
        <button class="shopify-buy" type="button" data-action="buy-now">Buy Now</button>
        <a class="whatsapp" href="#" target="_blank" rel="noreferrer" aria-label="Order via WhatsApp">WA</a>
      </div>
    </aside>

    <aside class="checkout-panel" data-panel="checkout" hidden>
      <div class="cart-panel-top">
        <p class="eyebrow">Checkout</p>
        <button class="text-link close-link" type="button" data-action="close-checkout" data-checkout-dismiss>Close</button>
      </div>
      <h2></h2>
      <div class="checkout-steps" aria-label="Checkout progress">
        <button type="button" data-checkout-step="cart">Cart</button>
        <button type="button" data-checkout-step="details">Details</button>
        <button type="button" data-checkout-step="payment">Payment</button>
        <button type="button" data-checkout-step="confirm">Confirm</button>
      </div>
      <div class="checkout-stage" data-stage="cart">
        <div class="cart-item">
          <span class="cart-thumb"></span>
          <div class="cart-item-copy">
            <strong></strong>
            <small></small>
          </div>
          <button class="cart-remove" type="button" data-action="remove-cart" data-cart-remove aria-label="Remove item">Remove</button>
        </div>
        <div class="cart-quantity-row">
          <span>Quantity</span>
          <div class="quantity-stepper" aria-label="Cart quantity">
            <button type="button" data-action="decrement" data-cart-quantity="-1" aria-label="Decrease quantity">-</button>
            <strong></strong>
            <button type="button" data-action="increment" data-cart-quantity="1" aria-label="Increase quantity">+</button>
          </div>
        </div>
      </div>
      <div class="checkout-stage" data-stage="details">
        <div class="checkout-field-grid">
          <label>
            <span>Full name</span>
            <input type="text" autocomplete="name" placeholder="Master Khurram" />
          </label>
          <label>
            <span>Phone</span>
            <input type="tel" autocomplete="tel" placeholder="+92" />
          </label>
          <label>
            <span>Email</span>
            <input type="email" autocomplete="email" placeholder="name@example.com" />
          </label>
          <label>
            <span>City</span>
            <input type="text" autocomplete="address-level2" placeholder="Lahore" />
          </label>
          <label class="checkout-field-wide">
            <span>Delivery address</span>
            <input type="text" autocomplete="street-address" placeholder="Street, house, area" />
          </label>
        </div>
      </div>
      <div class="checkout-stage" data-stage="payment">
        <div class="payment-options" role="radiogroup" aria-label="Payment method">
          <button class="is-selected" type="button" data-payment-method="shopify">Shopify secure checkout</button>
          <button type="button" data-payment-method="whatsapp">Confirm on WhatsApp</button>
          <button type="button" data-payment-method="cod">Cash on delivery request</button>
        </div>
        <p class="checkout-helper">Payment is completed on Shopify or confirmed manually. No card details are collected inside this 3D preview.</p>
      </div>
      <div class="checkout-stage" data-stage="confirm">
        <div class="confirm-card">
          <span>Ready to place order</span>
          <strong></strong>
          <small></small>
        </div>
        <div class="checkout-line">
          <span>Subtotal</span>
          <strong></strong>
        </div>
      </div>
      <div class="checkout-note">
        <span>Delivery calculated at checkout</span>
        <span>Shopify secure</span>
      </div>
      <div class="checkout-actions">
        <button class="secondary-button checkout-back" type="button" data-action="checkout-back" data-checkout-step="cart">Back</button>
        <button class="checkout-link checkout-next" type="button" data-action="checkout-next" data-checkout-step="payment">Continue</button>
        <a class="checkout-link checkout-final" href="#" target="_blank" rel="noreferrer">Place Order</a>
        <button class="secondary-button" type="button" data-action="close-checkout" data-checkout-dismiss>Keep Browsing</button>
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
  const previewToggle = root.querySelector(".preview-toggle");
  const mobileStage = root.querySelector(".mobile-stage");
  const mCatEyebrow = root.querySelector(".m-cat-eyebrow");
  const mCatTitle = root.querySelector(".m-cat-title");
  const mHeroPlaque = root.querySelector(".m-hero-plaque");
  const mLanePlaque = root.querySelector(".m-lane-plaque");
  const optionSelections = new Map();
  const checkoutSteps = ["cart", "details", "payment", "confirm"];
  let lastState = null;
  let previewedCategoryId = null;
  let activeProductId = null;
  let checkoutStep = "cart";
  let paymentMethod = "shopify";
  let previewMode = "desktop";
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

    const checkoutStepTarget = event.target.closest("[data-checkout-step]");
    if (checkoutStepTarget) {
      checkoutStep = checkoutStepTarget.dataset.checkoutStep;
      renderCheckout(lastState);
      return;
    }

    const paymentTarget = event.target.closest("[data-payment-method]");
    if (paymentTarget) {
      paymentMethod = paymentTarget.dataset.paymentMethod;
      renderCheckout(lastState);
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
    if (action === "checkout") openCheckout("cart");
    if (action === "close-checkout") closeCheckout();
    if (action === "remove-cart") removeCart();
    if (action === "add-to-cart") openCheckout("cart");
    if (action === "buy-now") openCheckout("details");
    if (action === "checkout-back") stepCheckout(-1);
    if (action === "checkout-next") stepCheckout(1);
    if (action === "toggle-preview-mode") {
      previewMode = previewMode === "desktop" ? "mobile" : "desktop";
      applyPreviewMode();
    }
    if (action === "category" && lastState) {
      closeTemporaryPanels();
      onCategory(lastState.activeCategoryId);
    }
    if (action === "prev") onStepProduct(-1);
    if (action === "next") onStepProduct(1);
    if (action === "category-scroll-prev") {
      onCategoryScroll?.(-1);
      renderLanePlaque();
    }
    if (action === "category-scroll-next") {
      onCategoryScroll?.(1);
      renderLanePlaque();
    }
    if (action === "toggle-layer-expand" && lastState) {
      const { product } = getProduct(lastState.activeProductId);
      layersExpanded = !layersExpanded;
      renderProductPanel(product, getCategory(lastState.activeCategoryId));
      onLayerExpandChange?.(product.id, layersExpanded);
    }
    if (action === "decrement") updateQuantity(-1);
    if (action === "increment") updateQuantity(1);
  });

  checkoutPanel.addEventListener("click", (event) => {
    if (interactionLocked) return;
    const dismissTarget = event.target.closest("[data-checkout-dismiss]");
    if (dismissTarget && checkoutPanel.contains(dismissTarget)) {
      event.stopPropagation();
      closeCheckout();
      return;
    }

    const removeTarget = event.target.closest("[data-cart-remove]");
    if (removeTarget && checkoutPanel.contains(removeTarget)) {
      event.stopPropagation();
      removeCart();
      return;
    }

    const quantityTarget = event.target.closest("[data-cart-quantity]");
    if (quantityTarget && checkoutPanel.contains(quantityTarget)) {
      event.stopPropagation();
      updateQuantity(Number(quantityTarget.dataset.cartQuantity));
      return;
    }

    const checkoutStepTarget = event.target.closest("[data-checkout-step]");
    if (checkoutStepTarget && checkoutPanel.contains(checkoutStepTarget)) {
      event.stopPropagation();
      checkoutStep = checkoutStepTarget.dataset.checkoutStep;
      renderCheckout(lastState);
      return;
    }

    const paymentTarget = event.target.closest("[data-payment-method]");
    if (paymentTarget && checkoutPanel.contains(paymentTarget)) {
      event.stopPropagation();
      paymentMethod = paymentTarget.dataset.paymentMethod;
      renderCheckout(lastState);
      return;
    }

    const actionTarget = event.target.closest("[data-action]");
    if (!actionTarget || !checkoutPanel.contains(actionTarget)) return;
    event.stopPropagation();
    const action = actionTarget.dataset.action;
    if (action === "close-checkout") closeCheckout();
    if (action === "remove-cart") removeCart();
    if (action === "checkout-back") stepCheckout(-1);
    if (action === "checkout-next") stepCheckout(1);
    if (action === "decrement") updateQuantity(-1);
    if (action === "increment") updateQuantity(1);
  });

  checkoutPanel.querySelectorAll("[data-payment-method]").forEach((button) => {
    button.addEventListener("pointerdown", () => {
      if (interactionLocked) return;
      paymentMethod = button.dataset.paymentMethod;
      renderCheckout(lastState);
    });
    button.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      if (interactionLocked) return;
      paymentMethod = button.dataset.paymentMethod;
      renderCheckout(lastState);
    });
  });

  searchInput.addEventListener("input", () => renderSearch(searchInput.value));
  window.addEventListener("resize", applyMobileAttr);
  applyPreviewMode();

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
    renderMobileStage(state, product, activeCategory, subcollection);
    applyCategoryPreview();
  }

  // D55: floating DOM text for the portrait charcoal stage — replaces every 3D text surface.
  function renderMobileStage(state, product, activeCategory, subcollection) {
    applyMobileAttr();
    if (state.mode !== "category") return;
    mCatEyebrow.textContent = subcollection ? activeCategory.label.toUpperCase() : "COLLECTION";
    mCatTitle.textContent = (subcollection?.label ?? activeCategory.label).toUpperCase();
    mHeroPlaque.querySelector("strong").textContent = product.name;
    mHeroPlaque.querySelector("span").textContent = displayPrice(product, activeCategory);
    renderLanePlaque();
  }

  function renderLanePlaque() {
    const lane = getLaneInfo?.();
    if (!lane) {
      mLanePlaque.hidden = true;
      return;
    }
    mLanePlaque.hidden = false;
    if (lane.isSubcollection) {
      mLanePlaque.querySelector("strong").textContent = lane.item.label;
      mLanePlaque.querySelector("span").textContent = `${lane.item.productIds.length} pieces`;
    } else {
      const laneCategory = lastState ? getCategory(lastState.activeCategoryId) : null;
      mLanePlaque.querySelector("strong").textContent = lane.item.name;
      mLanePlaque.querySelector("span").textContent = laneCategory ? displayPrice(lane.item, laneCategory) : "";
    }
  }

  function displayPrice(product, category) {
    const price = unitPrice(product, category, selectionFor(product.id));
    return price === null ? String(product.price ?? "") : formatPkr(price);
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
    productPanel.querySelector(".whatsapp").href = whatsappUrl(product, category);
  }

  function renderCheckout(state) {
    if (!state) return;
    const { product, category } = getProduct(state.activeProductId);
    const stepIndex = checkoutSteps.indexOf(checkoutStep);
    checkoutPanel.dataset.checkoutStep = checkoutStep;
    checkoutPanel.querySelector("h2").textContent = checkoutStep === "cart" ? "Cart" : checkoutStep === "details" ? "Details" : checkoutStep === "payment" ? "Payment" : "Confirm";
    checkoutPanel.querySelectorAll(".checkout-steps [data-checkout-step]").forEach((button) => {
      const index = checkoutSteps.indexOf(button.dataset.checkoutStep);
      button.classList.toggle("is-active", button.dataset.checkoutStep === checkoutStep);
      button.classList.toggle("is-complete", index < stepIndex);
      button.setAttribute("aria-pressed", button.dataset.checkoutStep === checkoutStep ? "true" : "false");
    });
    checkoutPanel.querySelector(".checkout-back").dataset.checkoutStep = checkoutSteps[Math.max(0, stepIndex - 1)];
    checkoutPanel.querySelector(".checkout-next").dataset.checkoutStep = checkoutSteps[Math.min(checkoutSteps.length - 1, stepIndex + 1)];
    checkoutPanel.querySelectorAll(".checkout-stage").forEach((stage) => {
      stage.hidden = stage.dataset.stage !== checkoutStep;
    });
    checkoutPanel.querySelectorAll("[data-payment-method]").forEach((button) => {
      button.classList.toggle("is-selected", button.dataset.paymentMethod === paymentMethod);
    });
    checkoutPanel.querySelector(".cart-item-copy strong").textContent = product.name;
    checkoutPanel.querySelector(".cart-item-copy small").textContent = `${category.label} · ${selectionSummary(product, category)}`;
    checkoutPanel.querySelector(".cart-quantity-row strong").textContent = quantity;
    const thumb = checkoutPanel.querySelector(".cart-thumb");
    thumb.style.setProperty("--cart-thumb-image", product.image ? `url("${product.image}")` : "none");
    const price = unitPrice(product, category, selectionFor(product.id));
    const subtotalText = price === null ? subtotal(product.price, quantity) : formatPkr(price * quantity);
    checkoutPanel.querySelectorAll(".checkout-line strong").forEach((item) => {
      item.textContent = subtotalText;
    });
    checkoutPanel.querySelector(".confirm-card strong").textContent = product.name;
    checkoutPanel.querySelector(".confirm-card small").textContent = `${selectionSummary(product, category)} · Qty ${quantity} · ${subtotalText}`;
    const final = checkoutPanel.querySelector(".checkout-final");
    final.href = paymentMethod === "shopify" ? productUrl(product) : whatsappUrl(product, category);
    final.textContent = paymentMethod === "whatsapp" ? "Send to WhatsApp" : paymentMethod === "cod" ? "Request COD" : "Place Order";
    checkoutPanel.querySelector(".checkout-back").hidden = checkoutStep === "cart";
    checkoutPanel.querySelector(".checkout-next").hidden = checkoutStep === "confirm";
    final.hidden = checkoutStep !== "confirm";
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

  function openCheckout(step = "cart") {
    if (!lastState) return;
    checkoutStep = step;
    checkoutPanel.hidden = false;
    productPanel.hidden = true;
    searchPanel.hidden = true;
    renderCheckout(lastState);
  }

  function closeCheckout() {
    checkoutPanel.hidden = true;
    render(lastState);
  }

  function removeCart() {
    quantity = 1;
    checkoutPanel.hidden = true;
    render(lastState);
  }

  function stepCheckout(direction) {
    const index = checkoutSteps.indexOf(checkoutStep);
    checkoutStep = checkoutSteps[Math.min(checkoutSteps.length - 1, Math.max(0, index + direction))];
    renderCheckout(lastState);
  }

  function updateQuantity(delta) {
    quantity = Math.max(1, quantity + delta);
    render(lastState);
  }

  function closeTemporaryPanels() {
    searchPanel.hidden = true;
    checkoutPanel.hidden = true;
  }

  function isMobileLayout() {
    return previewMode === "mobile" || window.innerWidth <= 760;
  }

  // data-mobile drives ALL portrait-only CSS (preview toggle AND real narrow screens),
  // so mobile rules never need duplicating into media queries.
  function applyMobileAttr() {
    const mobile = isMobileLayout();
    root.dataset.mobile = mobile ? "true" : "false";
    document.querySelector("#app")?.setAttribute("data-mobile", mobile ? "true" : "false");
    mobileStage.setAttribute("aria-hidden", mobile ? "false" : "true");
  }

  function applyPreviewMode() {
    const mobile = previewMode === "mobile";
    root.dataset.previewMode = previewMode;
    document.querySelector("#app")?.setAttribute("data-preview-mode", previewMode);
    previewToggle.textContent = mobile ? "Desktop" : "Mobile";
    previewToggle.setAttribute("aria-pressed", mobile ? "true" : "false");
    applyMobileAttr();
    onPreviewModeChange?.(previewMode);
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
