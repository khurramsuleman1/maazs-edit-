export function mountHud(world, root = document.getElementById('ui')) {
  root.innerHTML = `
    <header class="hud-top">
      <button class="brand" type="button" data-action="home" aria-label="Return home">
        <img src="/logo-blackaesthetics.svg" alt="" />
      </button>
      <div class="hud-actions">
        <button class="search-pill" type="button" data-action="search" aria-label="Search products"><span>⌕</span> Search</button>
        <button class="icon-button" type="button" data-action="reset" aria-label="Reset view">↺</button>
      </div>
    </header>
    <section class="home-copy" data-panel="home">
      <p>BLACK AESTHETICS</p>
      <h1>Gallery Storefront</h1>
      <span>Choose a display wall to move closer.</span>
    </section>
    <nav class="category-rail" aria-label="Store categories"></nav>
    <section class="category-panel" data-panel="category" hidden>
      <button class="text-link" type="button" data-action="back">← Room</button>
      <p class="eyebrow"></p>
      <h2></h2>
      <p class="intro"></p>
      <div class="filter-strip"></div>
    </section>
    <aside class="product-panel" data-panel="product" hidden>
      <button class="text-link" type="button" data-action="back">← Collection</button>
      <p class="eyebrow"></p>
      <h2></h2>
      <p class="price"></p>
      <div class="variant-row" aria-label="Variant selector">
        <button type="button" class="chip is-active">M</button>
        <button type="button" class="chip">L</button>
        <button type="button" class="chip">XL</button>
      </div>
      <div class="buy-row">
        <a class="buy" href="#" target="_blank" rel="noreferrer">Add to Cart</a>
        <a class="whatsapp" href="#" target="_blank" rel="noreferrer" aria-label="Order via WhatsApp">✆</a>
      </div>
    </aside>
    <div class="viewer-controls" data-panel="viewer" hidden>
      <button type="button" data-control="rotate" aria-label="Toggle auto rotate">⟳</button>
      <button type="button" data-control="layers" aria-label="Toggle layer animation">▤</button>
      <button type="button" data-control="light" aria-label="Toggle inspection light">◐</button>
      <button type="button" data-control="reset" aria-label="Reset product view">⌂</button>
    </div>
    <section class="search-panel" data-panel="search" hidden>
      <button class="text-link" type="button" data-action="close-search">Close</button>
      <label>
        <span>Search</span>
        <input type="search" placeholder="Product or category" autocomplete="off" />
      </label>
      <div class="search-results"></div>
    </section>
  `;

  const categoryRail = root.querySelector('.category-rail');
  const homePanel = root.querySelector('[data-panel="home"]');
  const categoryPanel = root.querySelector('[data-panel="category"]');
  const productPanel = root.querySelector('[data-panel="product"]');
  const viewerControls = root.querySelector('[data-panel="viewer"]');
  const searchPanel = root.querySelector('[data-panel="search"]');
  const searchInput = root.querySelector('input[type="search"]');
  const searchResults = root.querySelector('.search-results');
  let lastState = null;

  root.addEventListener('click', (event) => {
    const actionTarget = event.target.closest('[data-action]');
    const categoryTarget = event.target.closest('[data-category]');
    const filterTarget = event.target.closest('[data-filter]');
    const controlTarget = event.target.closest('[data-control]');

    if (actionTarget) {
      const action = actionTarget.dataset.action;
      if (action === 'home' || action === 'reset') world.goHome();
      if (action === 'back') world.back();
      if (action === 'search') searchPanel.hidden = false;
      if (action === 'close-search') searchPanel.hidden = true;
    }

    if (categoryTarget) world.enterCategory(categoryTarget.dataset.category);
    if (filterTarget) world.setFilter(filterTarget.dataset.filter);
    if (controlTarget) world.setControl(controlTarget.dataset.control);

    const chip = event.target.closest('.chip');
    if (chip) {
      root.querySelectorAll('.chip').forEach((item) => item.classList.toggle('is-active', item === chip));
    }

    const result = event.target.closest('[data-result-category]');
    if (result) {
      searchPanel.hidden = true;
      world.openProduct(result.dataset.resultProduct, result.dataset.resultCategory);
    }
  });

  root.addEventListener('pointerover', (event) => {
    const categoryTarget = event.target.closest('[data-category]');
    if (categoryTarget) world.hoverCategory(categoryTarget.dataset.category);
  });

  root.addEventListener('pointerout', (event) => {
    const categoryTarget = event.target.closest('[data-category]');
    if (!categoryTarget) return;
    if (!categoryTarget.contains(event.relatedTarget)) world.clearCategoryHover();
  });

  root.addEventListener('focusin', (event) => {
    const categoryTarget = event.target.closest('[data-category]');
    if (categoryTarget) world.hoverCategory(categoryTarget.dataset.category);
  });

  root.addEventListener('focusout', (event) => {
    const categoryTarget = event.target.closest('[data-category]');
    if (categoryTarget) world.clearCategoryHover();
  });

  searchInput.addEventListener('input', () => renderSearch(searchInput.value, lastState));

  world.onStateChange((state) => {
    lastState = state;
    render(state);
    renderSearch(searchInput.value, state);
  });

  function render(state) {
    root.dataset.mode = state.mode;
    const railActiveId = state.hoveredCategory?.id ?? (state.mode !== 'home' ? state.activeCategory?.id : null);
    categoryRail.innerHTML = state.categories.map((category) => `
      <button class="${railActiveId === category.id ? 'is-active' : ''}" type="button" data-category="${category.id}" aria-label="Open ${category.name} collection">
        <span class="nav-icon" aria-hidden="true">${categoryIcon(category.id)}</span>
        <span>${category.name}</span>
      </button>
    `).join('');

    homePanel.hidden = state.mode !== 'home';
    categoryPanel.hidden = state.mode === 'home' || !state.activeCategory || state.mode === 'product';
    productPanel.hidden = state.mode !== 'product' || !state.activeProduct;
    viewerControls.hidden = state.mode !== 'product';

    if (state.activeCategory) {
      categoryPanel.querySelector('.eyebrow').textContent = 'Collection';
      categoryPanel.querySelector('h2').textContent = state.activeCategory.name;
      categoryPanel.querySelector('.intro').textContent = state.activeCategory.intro;
      const filters = ['All', ...(state.activeCategory.filters ?? [])];
      categoryPanel.querySelector('.filter-strip').innerHTML = filters.map((filter) => `
        <button class="${state.selectedFilter === filter ? 'is-active' : ''}" type="button" data-filter="${filter}">${filter}</button>
      `).join('');
    }

    if (state.activeProduct) {
      productPanel.querySelector('.eyebrow').textContent = state.activeCategory.name;
      productPanel.querySelector('h2').textContent = state.activeProduct.name;
      productPanel.querySelector('.price').textContent = state.activeProduct.price;
      productPanel.querySelector('.buy').href = `https://blackaestheticspk.com/products/${state.activeProduct.id}`;
      productPanel.querySelector('.whatsapp').href = `https://wa.me/?text=${encodeURIComponent(`I want to order ${state.activeProduct.name} from Black Aesthetics`)}`;
    }

    viewerControls.querySelector('[data-control="rotate"]').classList.toggle('is-active', state.autoRotate);
    viewerControls.querySelector('[data-control="layers"]').classList.toggle('is-active', state.exploded);
    viewerControls.querySelector('[data-control="light"]').classList.toggle('is-active', state.lightMode === 'inspect');
  }

  function categoryIcon(categoryId) {
    if (categoryId === 'wall-art') return '▣';
    if (categoryId === 'digital-art') return '▤';
    if (categoryId === 'layered-art') return '▱';
    return '□';
  }

  function renderSearch(query, state) {
    if (!state) return;
    const term = query.trim().toLowerCase();
    const products = state.categories.flatMap((category) =>
      category.products.map((product) => ({ ...product, category })),
    );
    const matches = products
      .filter((product) => !term || product.name.toLowerCase().includes(term) || product.category.name.toLowerCase().includes(term))
      .slice(0, 8);

    searchResults.innerHTML = matches.map((product) => `
      <button type="button" data-result-category="${product.category.id}" data-result-product="${product.id}">
        <span>${product.name}</span>
        <small>${product.category.name} · ${product.price}</small>
      </button>
    `).join('');
  }

  return { root };
}
