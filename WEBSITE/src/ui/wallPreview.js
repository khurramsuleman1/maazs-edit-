// "See it on your wall" — a self-contained visualiser. The user uploads a photo of their room,
// drops a Black Aesthetics piece onto it, then moves / zooms / rotates / tilts it (CSS 3D
// perspective) to picture it on their actual wall. Kept decoupled from the 3D gallery and the
// HUD's data-action delegation: it owns its launch button and modal, and only reads a flat list
// of placeable art (pieces that have a single 2D image — digital posters + wall-art silhouettes).

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const LIMITS = {
  scale: [0.15, 4],
  rot: [-180, 180],
  tilt: [-60, 60],
};

export function createWallPreview({ artItems = [], getActiveProductId = () => null } = {}) {
  const items = artItems.filter((a) => a && a.image);
  if (!items.length) return { open() {}, close() {} };

  // ---- launch button ----
  const launch = document.createElement("button");
  launch.type = "button";
  launch.className = "wall-viz-launch";
  launch.setAttribute("aria-haspopup", "dialog");
  launch.innerHTML =
    '<span class="wall-viz-launch-ico" aria-hidden="true">&#9635;</span>' +
    '<span class="wall-viz-launch-label">See it on your wall</span>';

  // ---- modal ----
  const modal = document.createElement("div");
  modal.className = "wall-viz-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", "See the art on your wall");
  modal.hidden = true;
  modal.innerHTML = `
    <div class="wall-viz-backdrop" data-wv-close></div>
    <div class="wall-viz-dialog" role="document">
      <header class="wall-viz-head">
        <h2 class="wall-viz-title">See it on your wall</h2>
        <button type="button" class="wall-viz-close" data-wv-close aria-label="Close preview">&#10005;</button>
      </header>
      <div class="wall-viz-stage" data-wv-stage>
        <div class="wall-viz-empty" data-wv-empty>
          <span class="wall-viz-empty-ico" aria-hidden="true">&#128444;</span>
          <p>Upload a photo of your wall to place the art on it.</p>
          <button type="button" class="wall-viz-btn primary" data-wv-upload>Upload photo</button>
          <span class="wall-viz-hint">Your photo stays on your device &mdash; it is never uploaded anywhere.</span>
        </div>
        <img class="wall-viz-photo" data-wv-photo alt="Your wall" hidden />
        <div class="wall-viz-artwrap" data-wv-artwrap hidden>
          <img class="wall-viz-art" data-wv-art alt="" draggable="false" />
        </div>
        <span class="wall-viz-drag-hint" data-wv-draghint hidden>Drag to move &middot; scroll or pinch to zoom</span>
      </div>
      <div class="wall-viz-panel">
        <div class="wall-viz-picker" data-wv-picker role="listbox" aria-label="Choose art"></div>
        <div class="wall-viz-sliders">
          <label class="wall-viz-slider"><span>Zoom</span><input type="range" data-wv-slider="scale" min="0.15" max="4" step="0.01" value="1" /></label>
          <label class="wall-viz-slider"><span>Rotate</span><input type="range" data-wv-slider="rot" min="-180" max="180" step="1" value="0" /></label>
          <label class="wall-viz-slider"><span>Tilt &#8597;</span><input type="range" data-wv-slider="tiltX" min="-60" max="60" step="1" value="0" /></label>
          <label class="wall-viz-slider"><span>Tilt &#8596;</span><input type="range" data-wv-slider="tiltY" min="-60" max="60" step="1" value="0" /></label>
        </div>
        <div class="wall-viz-actions">
          <button type="button" class="wall-viz-btn" data-wv-upload>Change photo</button>
          <button type="button" class="wall-viz-btn" data-wv-reset>Reset</button>
          <button type="button" class="wall-viz-btn primary" data-wv-download disabled>Download</button>
        </div>
      </div>
    </div>
    <input type="file" accept="image/*" class="wall-viz-file" data-wv-file hidden />
  `;

  const q = (sel) => modal.querySelector(sel);
  const stage = q("[data-wv-stage]");
  const photo = q("[data-wv-photo]");
  const empty = q("[data-wv-empty]");
  const artWrap = q("[data-wv-artwrap]");
  const art = q("[data-wv-art]");
  const picker = q("[data-wv-picker]");
  const fileInput = q("[data-wv-file]");
  const dragHint = q("[data-wv-draghint]");
  const downloadBtn = q("[data-wv-download]");
  const sliders = {
    scale: q('[data-wv-slider="scale"]'),
    rot: q('[data-wv-slider="rot"]'),
    tiltX: q('[data-wv-slider="tiltX"]'),
    tiltY: q('[data-wv-slider="tiltY"]'),
  };

  const t = { cx: 0, cy: 0, scale: 1, rot: 0, tiltX: 0, tiltY: 0 };
  let currentArt = null;
  let photoUrl = null;
  let lastFocus = null;

  function applyTransform() {
    artWrap.style.left = `${t.cx}px`;
    artWrap.style.top = `${t.cy}px`;
    artWrap.style.transform =
      `translate(-50%, -50%) rotateX(${t.tiltX}deg) rotateY(${t.tiltY}deg) rotateZ(${t.rot}deg) scale(${t.scale})`;
  }

  function syncSliders() {
    sliders.scale.value = String(t.scale);
    sliders.rot.value = String(t.rot);
    sliders.tiltX.value = String(t.tiltX);
    sliders.tiltY.value = String(t.tiltY);
  }

  function centerArt(resetTransform = true) {
    const rect = stage.getBoundingClientRect();
    if (resetTransform) {
      t.cx = rect.width / 2;
      t.cy = rect.height / 2;
      t.scale = 1;
      t.rot = 0;
      t.tiltX = 0;
      t.tiltY = 0;
    }
    // Base display width so scale=1 shows the piece at ~32% of the stage; zoom multiplies from there.
    art.style.width = `${Math.round(rect.width * 0.32)}px`;
    applyTransform();
    syncSliders();
  }

  function setPhoto(url) {
    if (photoUrl && photoUrl.startsWith("blob:")) URL.revokeObjectURL(photoUrl);
    photoUrl = url;
    photo.onload = () => {
      photo.hidden = false;
      empty.hidden = true;
      if (!currentArt) selectArt(preselectItem());
      artWrap.hidden = false;
      dragHint.hidden = false;
      downloadBtn.disabled = false;
      centerArt(true);
    };
    photo.src = url;
  }

  function selectArt(item) {
    if (!item) return;
    currentArt = item;
    art.onload = () => centerArt(false);
    art.src = item.image;
    art.alt = item.name || "Art piece";
    picker.querySelectorAll(".wall-viz-thumb").forEach((el) => {
      const active = el.dataset.id === item.id;
      el.classList.toggle("is-active", active);
      el.setAttribute("aria-selected", active ? "true" : "false");
    });
    if (!photo.hidden) {
      artWrap.hidden = false;
      centerArt(false);
    }
  }

  function preselectItem() {
    const activeId = getActiveProductId?.();
    return items.find((a) => a.id === activeId) || items[0];
  }

  // ---- art picker (lazy thumbnails) ----
  items.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "wall-viz-thumb";
    btn.dataset.id = item.id;
    btn.setAttribute("role", "option");
    btn.title = item.name || "";
    btn.innerHTML = `<img src="${item.image}" alt="${item.name || ""}" loading="lazy" draggable="false" />`;
    btn.addEventListener("click", () => selectArt(item));
    picker.appendChild(btn);
  });

  // ---- move (drag) ----
  let dragging = false;
  let dragStart = null;
  artWrap.addEventListener("pointerdown", (e) => {
    dragging = true;
    dragStart = { x: e.clientX, y: e.clientY, cx: t.cx, cy: t.cy };
    artWrap.setPointerCapture(e.pointerId);
    artWrap.classList.add("is-grabbing");
  });
  artWrap.addEventListener("pointermove", (e) => {
    if (!dragging || pinch.active) return;
    t.cx = dragStart.cx + (e.clientX - dragStart.x);
    t.cy = dragStart.cy + (e.clientY - dragStart.y);
    applyTransform();
  });
  const endDrag = (e) => {
    dragging = false;
    artWrap.classList.remove("is-grabbing");
    try { artWrap.releasePointerCapture(e.pointerId); } catch {}
  };
  artWrap.addEventListener("pointerup", endDrag);
  artWrap.addEventListener("pointercancel", endDrag);

  // ---- wheel zoom ----
  stage.addEventListener(
    "wheel",
    (e) => {
      if (photo.hidden) return;
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.0016);
      t.scale = clamp(t.scale * factor, LIMITS.scale[0], LIMITS.scale[1]);
      applyTransform();
      syncSliders();
    },
    { passive: false },
  );

  // ---- pinch zoom (touch) ----
  const pinch = { active: false, startDist: 0, startScale: 1, pointers: new Map() };
  stage.addEventListener("pointerdown", (e) => {
    pinch.pointers.set(e.pointerId, e);
    if (pinch.pointers.size === 2) {
      const [a, b] = [...pinch.pointers.values()];
      pinch.active = true;
      pinch.startDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1;
      pinch.startScale = t.scale;
    }
  });
  stage.addEventListener("pointermove", (e) => {
    if (!pinch.pointers.has(e.pointerId)) return;
    pinch.pointers.set(e.pointerId, e);
    if (pinch.active && pinch.pointers.size >= 2) {
      const [a, b] = [...pinch.pointers.values()];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1;
      t.scale = clamp(pinch.startScale * (dist / pinch.startDist), LIMITS.scale[0], LIMITS.scale[1]);
      applyTransform();
      syncSliders();
    }
  });
  const dropPointer = (e) => {
    pinch.pointers.delete(e.pointerId);
    if (pinch.pointers.size < 2) pinch.active = false;
  };
  stage.addEventListener("pointerup", dropPointer);
  stage.addEventListener("pointercancel", dropPointer);

  // ---- sliders ----
  Object.entries(sliders).forEach(([key, input]) => {
    input.addEventListener("input", () => {
      const val = parseFloat(input.value);
      if (key === "scale") t.scale = clamp(val, LIMITS.scale[0], LIMITS.scale[1]);
      else if (key === "rot") t.rot = clamp(val, LIMITS.rot[0], LIMITS.rot[1]);
      else if (key === "tiltX") t.tiltX = clamp(val, LIMITS.tilt[0], LIMITS.tilt[1]);
      else if (key === "tiltY") t.tiltY = clamp(val, LIMITS.tilt[0], LIMITS.tilt[1]);
      applyTransform();
    });
  });

  // ---- upload / reset / download ----
  modal.querySelectorAll("[data-wv-upload]").forEach((b) => b.addEventListener("click", () => fileInput.click()));
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (file) setPhoto(URL.createObjectURL(file));
    fileInput.value = "";
  });
  q("[data-wv-reset]").addEventListener("click", () => centerArt(true));
  downloadBtn.addEventListener("click", () => downloadComposite());

  // ---- close handling ----
  modal.querySelectorAll("[data-wv-close]").forEach((b) => b.addEventListener("click", close));
  const onKey = (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  };

  function open(artId) {
    lastFocus = document.activeElement;
    modal.hidden = false;
    launch.setAttribute("aria-expanded", "true");
    document.addEventListener("keydown", onKey);
    const target = (artId && items.find((a) => a.id === artId)) || (currentArt ?? preselectItem());
    // render the picker selection + art element even before a photo exists
    currentArt = null;
    selectArt(target);
    (photo.hidden ? q("[data-wv-upload]") : downloadBtn)?.focus?.();
  }

  function close() {
    modal.hidden = true;
    launch.setAttribute("aria-expanded", "false");
    document.removeEventListener("keydown", onKey);
    lastFocus?.focus?.();
  }

  // ---- download (2D canvas composite) ----
  // Faithfully captures position / zoom / rotation; tilt (a 3D perspective on screen) is
  // approximated with a skew so the exported image reads the same direction as the preview.
  function downloadComposite() {
    if (photo.hidden || !currentArt || !art.naturalWidth) return;
    const rect = stage.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.round(rect.width * dpr);
    const H = Math.round(rect.height * dpr);
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    // photo drawn with object-fit: contain (matches the stage CSS)
    const pAsp = photo.naturalWidth / photo.naturalHeight;
    const sAsp = rect.width / rect.height;
    let dw = W;
    let dh = H;
    if (pAsp > sAsp) dh = W / pAsp;
    else dw = H * pAsp;
    ctx.drawImage(photo, (W - dw) / 2, (H - dh) / 2, dw, dh);

    // art at the same on-screen transform
    const artW = parseFloat(art.style.width) * dpr;
    const artH = artW / (art.naturalWidth / art.naturalHeight);
    ctx.save();
    ctx.translate(t.cx * dpr, t.cy * dpr);
    ctx.rotate((t.rot * Math.PI) / 180);
    const skewX = Math.tan((-t.tiltY * 0.6 * Math.PI) / 180);
    const skewY = Math.tan((t.tiltX * 0.6 * Math.PI) / 180);
    ctx.transform(1, skewY, skewX, 1, 0, 0);
    ctx.scale(t.scale, t.scale);
    ctx.drawImage(art, -artW / 2, -artH / 2, artW, artH);
    ctx.restore();

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `black-aesthetics-${currentArt.id}-on-wall.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  }

  launch.addEventListener("click", () => open());
  document.body.appendChild(launch);
  document.body.appendChild(modal);

  return { open, close, launch, modal, _setPhotoForTest: setPhoto };
}
