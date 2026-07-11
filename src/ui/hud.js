import { getCategory, getProduct, getSubcollection } from "../data/catalog.js";

const SHOPIFY_PRODUCT_BASE = "https://blackaestheticspk.com/products";

export function createHud({ root, categories, onHome, onCategory, onProduct, onStepProduct, onCategoryScroll }) {
  root.innerHTML = `
    <header class="hud-top">
      <button class="brand" type="button" data-action="home" aria-label="Return home">
        <img src="/logo-blackaesthetics.svg" alt="" />
      </button>
      <div class="hud-actions">
        <button class="search-pill" type="button" data-action="search" aria-label="Search products">
          <span aria-hidden="true">Search products or categories</span>
        </button>
        <button class="icon-button bag-button" type="button" data-action="checkout" aria-label="Open bag">Bag</button>
        <button class="icon-button" type="button" data-action="home" aria-label="Reset view">Reset</button>
      </div>
    </header>

    <section class="home-copy" data-panel="home">
      <p>BLACK AESTHETICS</p>
      <h1>Gallery Storefront</h1>
      <span>Choose a bay to enter its collection.</span>
    </section>

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
      <button type="button" data-action="home" aria-label="Back home">Home</button>
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
  let activeProductId = null;
  let quantity = 1;

  root.addEventListener("click", (event) => {
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
    if (action === "home") {
      closeTemporaryPanels();
      onHome();
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
      quantity = 1;
      checkoutPanel.hidden = true;
      ensureSelection(product, category);
    }

    categoryRail.innerHTML = [
      `<button class="${state.mode === "home" ? "is-active" : ""}" type="button" data-action="home"><span class="nav-dot"></span><span>Home</span></button>`,
      ...categories.map(
        (item) => `
          <button class="${item.id === state.activeCategoryId && state.mode !== "home" ? "is-active" : ""}" type="button" data-category="${item.id}" aria-label="Open ${escapeAttribute(item.label)}">
            <span class="nav-dot"></span>
            <span>${escapeHtml(item.label.replace("Objects", "ART"))}</span>
          </button>
        `,
      ),
    ].join("");

    homePanel.hidden = state.mode !== "home";
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
  }

  function renderProductPanel(product, category) {
    productPanel.querySelector(".eyebrow").textContent = category.label;
    productPanel.querySelector("h2").textContent = product.name;
    productPanel.querySelector(".price").textContent = product.price;
    productPanel.querySelector(".material").textContent = productDescription(product, category);
    productPanel.querySelector(".variant-groups").innerHTML = renderVariantGroups(product, category);
    productPanel.querySelector(".quantity-stepper strong").textContent = quantity;
    productPanel.querySelector(".shopify-buy").href = productUrl(product);
    productPanel.querySelector(".whatsapp").href = whatsappUrl(product, category);
  }

  function renderCheckout(state) {
    if (!state) return;
    const { product, category } = getProduct(state.activeProductId);
    checkoutPanel.querySelector("h2").textContent = product.name;
    checkoutPanel.querySelector(".checkout-options").textContent = `${selectionSummary(product, category)} · Qty ${quantity}`;
    checkoutPanel.querySelector(".checkout-line strong").textContent = subtotal(product.price, quantity);
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

  return { update: render };
}

function optionGroups(product, category) {
  if (category.id === "digital-art") {
    return [
      { name: "Print size", values: ["12 x 18", "18 x 24", "24 x 36"] },
      { name: "Finish", values: ["Poster", "Mounted sheet"] },
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
    { name: "Size", values: ["12 in", "18 in", "24 in"] },
    { name: "Finish", values: ["Matte black", "Outdoor coat"] },
  ];
}

function defaultOption(group) {
  return group.values.length > 2 ? group.values[1] : group.values[0];
}

function productDescription(product, category) {
  if (product.kind === "object") return `${product.material}. Printed to order and confirmed through Shopify or WhatsApp.`;
  return `${product.material}. ${category.description}`;
}

function productUrl(product) {
  return `${SHOPIFY_PRODUCT_BASE}/${encodeURIComponent(product.id)}`;
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
