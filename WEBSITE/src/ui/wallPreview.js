// "See it on your wall" — a self-contained visualiser. The user uploads a photo of their room,
// drops one or more Black Aesthetics pieces onto it, then moves / zooms / rotates / tilts each one
// (CSS 3D perspective) to picture it on their actual wall. Kept decoupled from the 3D gallery and
// the HUD's data-action delegation: it owns its launch button and modal, and only reads a flat list
// of placeable art (pieces that have a single 2D image — digital posters + wall-art silhouettes).
//
// Multiple pieces: every thumbnail click ADDS a piece. Exactly one piece is "selected" at a time —
// the sliders, wheel/pinch zoom and Reset act on the selection; dragging a piece selects it.

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const LIMITS = {
  scale: [0.15, 4],
  rot: [-180, 180],
  tilt: [-60, 60],
};

// Each additional piece is nudged down-right so a fresh drop never hides the one beneath it.
const STACK_OFFSET = 46;
// A piece at zoom 1 covers this fraction of the *photo's* width — sized against the wall the
// visitor actually uploaded, not the letterboxed stage, so it reads at a believable scale.
const BASE_WIDTH_RATIO = 0.22;

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
        <div class="wall-viz-pieces" data-wv-pieces></div>
        <span class="wall-viz-drag-hint" data-wv-draghint hidden>Tap a piece to select &middot; drag to move &middot; scroll or pinch to zoom</span>
      </div>
      <div class="wall-viz-panel">
        <div class="wall-viz-picker" data-wv-picker role="listbox" aria-label="Add art to your wall"></div>
        <div class="wall-viz-sliders">
          <label class="wall-viz-slider"><span>Zoom</span><input type="range" data-wv-slider="scale" min="0.15" max="4" step="0.01" value="1" /></label>
          <label class="wall-viz-slider"><span>Rotate</span><input type="range" data-wv-slider="rot" min="-180" max="180" step="1" value="0" /></label>
          <label class="wall-viz-slider"><span>Tilt &#8597;</span><input type="range" data-wv-slider="tiltX" min="-60" max="60" step="1" value="0" /></label>
          <label class="wall-viz-slider"><span>Tilt &#8596;</span><input type="range" data-wv-slider="tiltY" min="-60" max="60" step="1" value="0" /></label>
        </div>
        <div class="wall-viz-actions">
          <button type="button" class="wall-viz-btn" data-wv-upload>Change photo</button>
          <button type="button" class="wall-viz-btn" data-wv-reset>Reset piece</button>
          <button type="button" class="wall-viz-btn" data-wv-remove disabled>Remove piece</button>
          <button type="button" class="wall-viz-btn" data-wv-clear disabled>Clear all</button>
          <button type="button" class="wall-viz-btn primary" data-wv-download disabled>Download</button>
        </div>
        <p class="wall-viz-note">Downloads are saved with a Black Aesthetics watermark.</p>
      </div>
    </div>
    <input type="file" accept="image/*" class="wall-viz-file" data-wv-file hidden />
  `;

  const q = (sel) => modal.querySelector(sel);
  const stage = q("[data-wv-stage]");
  const photo = q("[data-wv-photo]");
  const empty = q("[data-wv-empty]");
  const layer = q("[data-wv-pieces]");
  const picker = q("[data-wv-picker]");
  const fileInput = q("[data-wv-file]");
  const dragHint = q("[data-wv-draghint]");
  const downloadBtn = q("[data-wv-download]");
  const removeBtn = q("[data-wv-remove]");
  const clearBtn = q("[data-wv-clear]");
  const sliders = {
    scale: q('[data-wv-slider="scale"]'),
    rot: q('[data-wv-slider="rot"]'),
    tiltX: q('[data-wv-slider="tiltX"]'),
    tiltY: q('[data-wv-slider="tiltY"]'),
  };

  /** @type {{item:any, wrap:HTMLElement, img:HTMLImageElement, t:{cx:number,cy:number,scale:number,rot:number,tiltX:number,tiltY:number}}[]} */
  const pieces = [];
  let selected = null;
  let photoUrl = null;
  let lastFocus = null;

  const hasPhoto = () => !photo.hidden;

  function applyTransform(piece) {
    const { wrap, t } = piece;
    wrap.style.left = `${t.cx}px`;
    wrap.style.top = `${t.cy}px`;
    wrap.style.transform =
      `translate(-50%, -50%) rotateX(${t.tiltX}deg) rotateY(${t.tiltY}deg) rotateZ(${t.rot}deg) scale(${t.scale})`;
  }

  function syncSliders() {
    const t = selected?.t;
    const enabled = Boolean(t);
    Object.values(sliders).forEach((s) => { s.disabled = !enabled; });
    if (!t) return;
    sliders.scale.value = String(t.scale);
    sliders.rot.value = String(t.rot);
    sliders.tiltX.value = String(t.tiltX);
    sliders.tiltY.value = String(t.tiltY);
  }

  // On-screen box of the photo inside the stage (it is object-fit: contain, so it is letterboxed).
  // Sizing/centring against this — not the stage — keeps the art proportionate to the real wall.
  function photoRect() {
    const rect = stage.getBoundingClientRect();
    if (!hasPhoto() || !photo.naturalWidth) {
      return { left: 0, top: 0, width: rect.width, height: rect.height, cx: rect.width / 2, cy: rect.height / 2 };
    }
    const pAsp = photo.naturalWidth / photo.naturalHeight;
    const sAsp = rect.width / rect.height;
    let w = rect.width;
    let h = rect.height;
    if (pAsp > sAsp) h = rect.width / pAsp;
    else w = rect.height * pAsp;
    return {
      left: (rect.width - w) / 2,
      top: (rect.height - h) / 2,
      width: w,
      height: h,
      cx: rect.width / 2,
      cy: rect.height / 2,
    };
  }

  function sizePiece(piece) {
    piece.img.style.width = `${Math.round(photoRect().width * BASE_WIDTH_RATIO)}px`;
    applyTransform(piece);
  }

  function selectPiece(piece) {
    selected = piece || null;
    pieces.forEach((p) => p.wrap.classList.toggle("is-selected", p === selected));
    // Picker highlights whichever art the selected piece uses.
    picker.querySelectorAll(".wall-viz-thumb").forEach((el) => {
      const active = Boolean(selected) && el.dataset.id === selected.item.id;
      el.classList.toggle("is-active", active);
      el.setAttribute("aria-selected", active ? "true" : "false");
    });
    removeBtn.disabled = !selected;
    syncSliders();
  }

  function addPiece(item) {
    const pr = photoRect();
    const n = pieces.length;
    const wrap = document.createElement("div");
    wrap.className = "wall-viz-artwrap";
    const img = document.createElement("img");
    img.className = "wall-viz-art";
    img.draggable = false;
    img.alt = item.name || "Art piece";
    wrap.appendChild(img);

    const piece = {
      item,
      wrap,
      img,
      t: {
        // Fan new pieces out from the photo's centre, wrapping so they never march off-frame.
        cx: pr.cx + ((n % 4) - 1.5) * STACK_OFFSET,
        cy: pr.cy + (Math.floor(n / 4) % 3) * STACK_OFFSET,
        scale: 1,
        rot: 0,
        tiltX: 0,
        tiltY: 0,
      },
    };

    img.onload = () => sizePiece(piece);
    img.src = item.image;

    attachDrag(piece);
    layer.appendChild(wrap);
    pieces.push(piece);
    sizePiece(piece);
    selectPiece(piece);
    refreshButtons();
    return piece;
  }

  function removePiece(piece) {
    const i = pieces.indexOf(piece);
    if (i === -1) return;
    piece.wrap.remove();
    pieces.splice(i, 1);
    selectPiece(pieces[pieces.length - 1] || null);
    refreshButtons();
  }

  function clearPieces() {
    pieces.splice(0).forEach((p) => p.wrap.remove());
    selectPiece(null);
    refreshButtons();
  }

  function refreshButtons() {
    const any = pieces.length > 0;
    downloadBtn.disabled = !(hasPhoto() && any);
    clearBtn.disabled = !any;
    removeBtn.disabled = !selected;
    dragHint.hidden = !(hasPhoto() && any);
  }

  function setPhoto(url) {
    if (photoUrl && photoUrl.startsWith("blob:")) URL.revokeObjectURL(photoUrl);
    photoUrl = url;
    photo.onload = () => {
      photo.hidden = false;
      empty.hidden = true;
      // First photo: seed the wall with the piece the visitor was last looking at.
      if (!pieces.length) addPiece(preselectItem());
      else pieces.forEach(sizePiece);
      refreshButtons();
    };
    photo.src = url;
  }

  function preselectItem() {
    const activeId = getActiveProductId?.();
    return items.find((a) => a.id === activeId) || items[0];
  }

  // ---- art picker: a click ADDS the piece to the wall ----
  items.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "wall-viz-thumb";
    btn.dataset.id = item.id;
    btn.setAttribute("role", "option");
    btn.setAttribute("aria-selected", "false");
    btn.title = `Add ${item.name || "this piece"} to your wall`;
    btn.innerHTML = `<img src="${item.image}" alt="${item.name || ""}" loading="lazy" draggable="false" />`;
    btn.addEventListener("click", () => {
      // Without a photo there is nowhere to place it — send the visitor to the file picker.
      if (!hasPhoto()) {
        fileInput.click();
        return;
      }
      addPiece(item);
    });
    picker.appendChild(btn);
  });

  // ---- move (drag), per piece ----
  function attachDrag(piece) {
    let dragging = false;
    let start = null;
    piece.wrap.addEventListener("pointerdown", (e) => {
      selectPiece(piece);
      dragging = true;
      start = { x: e.clientX, y: e.clientY, cx: piece.t.cx, cy: piece.t.cy };
      try { piece.wrap.setPointerCapture(e.pointerId); } catch {}
      piece.wrap.classList.add("is-grabbing");
    });
    piece.wrap.addEventListener("pointermove", (e) => {
      if (!dragging || pinch.active) return;
      piece.t.cx = start.cx + (e.clientX - start.x);
      piece.t.cy = start.cy + (e.clientY - start.y);
      applyTransform(piece);
    });
    const end = (e) => {
      dragging = false;
      piece.wrap.classList.remove("is-grabbing");
      try { piece.wrap.releasePointerCapture(e.pointerId); } catch {}
    };
    piece.wrap.addEventListener("pointerup", end);
    piece.wrap.addEventListener("pointercancel", end);
  }

  // ---- wheel zoom (selected piece) ----
  stage.addEventListener(
    "wheel",
    (e) => {
      if (!hasPhoto() || !selected) return;
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.0016);
      selected.t.scale = clamp(selected.t.scale * factor, LIMITS.scale[0], LIMITS.scale[1]);
      applyTransform(selected);
      syncSliders();
    },
    { passive: false },
  );

  // ---- pinch zoom (touch, selected piece) ----
  const pinch = { active: false, startDist: 0, startScale: 1, pointers: new Map() };
  stage.addEventListener("pointerdown", (e) => {
    pinch.pointers.set(e.pointerId, e);
    if (pinch.pointers.size === 2 && selected) {
      const [a, b] = [...pinch.pointers.values()];
      pinch.active = true;
      pinch.startDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1;
      pinch.startScale = selected.t.scale;
    }
  });
  stage.addEventListener("pointermove", (e) => {
    if (!pinch.pointers.has(e.pointerId)) return;
    pinch.pointers.set(e.pointerId, e);
    if (pinch.active && pinch.pointers.size >= 2 && selected) {
      const [a, b] = [...pinch.pointers.values()];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1;
      selected.t.scale = clamp(pinch.startScale * (dist / pinch.startDist), LIMITS.scale[0], LIMITS.scale[1]);
      applyTransform(selected);
      syncSliders();
    }
  });
  const dropPointer = (e) => {
    pinch.pointers.delete(e.pointerId);
    if (pinch.pointers.size < 2) pinch.active = false;
  };
  stage.addEventListener("pointerup", dropPointer);
  stage.addEventListener("pointercancel", dropPointer);

  // ---- sliders act on the selected piece ----
  Object.entries(sliders).forEach(([key, input]) => {
    input.addEventListener("input", () => {
      if (!selected) return;
      const val = parseFloat(input.value);
      const t = selected.t;
      if (key === "scale") t.scale = clamp(val, LIMITS.scale[0], LIMITS.scale[1]);
      else if (key === "rot") t.rot = clamp(val, LIMITS.rot[0], LIMITS.rot[1]);
      else if (key === "tiltX") t.tiltX = clamp(val, LIMITS.tilt[0], LIMITS.tilt[1]);
      else if (key === "tiltY") t.tiltY = clamp(val, LIMITS.tilt[0], LIMITS.tilt[1]);
      applyTransform(selected);
    });
  });

  // ---- upload / reset / remove / clear / download ----
  modal.querySelectorAll("[data-wv-upload]").forEach((b) => b.addEventListener("click", () => fileInput.click()));
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (file) setPhoto(URL.createObjectURL(file));
    fileInput.value = "";
  });
  q("[data-wv-reset]").addEventListener("click", () => {
    if (!selected) return;
    const pr = photoRect();
    Object.assign(selected.t, { cx: pr.cx, cy: pr.cy, scale: 1, rot: 0, tiltX: 0, tiltY: 0 });
    sizePiece(selected);
    syncSliders();
  });
  removeBtn.addEventListener("click", () => selected && removePiece(selected));
  clearBtn.addEventListener("click", clearPieces);
  downloadBtn.addEventListener("click", () => downloadComposite());

  // Clicking empty stage space deselects, so sliders don't secretly move a hidden piece.
  stage.addEventListener("pointerdown", (e) => {
    if (e.target === stage || e.target === photo) selectPiece(null);
  });

  // ---- close handling ----
  modal.querySelectorAll("[data-wv-close]").forEach((b) => b.addEventListener("click", close));
  const onKey = (e) => {
    if (modal.hidden) return;
    if (e.key === "Escape") close();
    if ((e.key === "Delete" || e.key === "Backspace") && selected && e.target === document.body) {
      e.preventDefault();
      removePiece(selected);
    }
  };

  function open(artId) {
    lastFocus = document.activeElement;
    modal.hidden = false;
    launch.setAttribute("aria-expanded", "true");
    document.addEventListener("keydown", onKey);
    // Opening from a specific product drops that piece straight onto an existing photo.
    if (artId && hasPhoto()) {
      const item = items.find((a) => a.id === artId);
      if (item) addPiece(item);
    }
    refreshButtons();
    syncSliders();
    (hasPhoto() ? downloadBtn : q("[data-wv-upload]"))?.focus?.();
  }

  function close() {
    modal.hidden = true;
    launch.setAttribute("aria-expanded", "false");
    document.removeEventListener("keydown", onKey);
    lastFocus?.focus?.();
  }

  // ---- watermark ----
  // The brand mark is a black SVG with a viewBox but no intrinsic size, so it is rasterised
  // explicitly and tinted to the cream brand colour (source-in) to stay legible on dark walls.
  let watermarkLogo = null;
  function getWatermarkLogo() {
    if (watermarkLogo) return Promise.resolve(watermarkLogo);
    return fetch("/logo-blackaesthetics.svg")
      .then((r) => r.text())
      .then(
        (svgText) =>
          new Promise((resolve, reject) => {
            const url = URL.createObjectURL(new Blob([svgText], { type: "image/svg+xml" }));
            const img = new Image();
            img.onload = () => {
              const S = 512;
              const c = document.createElement("canvas");
              c.width = S;
              c.height = S;
              const g = c.getContext("2d");
              g.drawImage(img, 0, 0, S, S);
              g.globalCompositeOperation = "source-in";
              g.fillStyle = "#fff3df";
              g.fillRect(0, 0, S, S);
              URL.revokeObjectURL(url);
              watermarkLogo = c;
              resolve(c);
            };
            img.onerror = () => {
              URL.revokeObjectURL(url);
              reject(new Error("logo failed"));
            };
            img.src = url;
          }),
      );
  }

  // Bottom-right lockup: brand mark + wordmark + site. Drawn with a soft shadow so it reads on
  // both bright and dark walls, and sized relative to the export so it scales with the image.
  function drawWatermark(ctx, logo, W, H) {
    const unit = Math.min(W, H);
    const mark = Math.max(34, Math.round(unit * 0.085));
    const gap = Math.round(mark * 0.32);
    const margin = Math.round(unit * 0.038);
    const nameSize = Math.max(11, Math.round(mark * 0.31));
    const siteSize = Math.max(9, Math.round(mark * 0.22));

    ctx.save();
    ctx.textBaseline = "alphabetic";
    ctx.font = `600 ${nameSize}px Inter, system-ui, -apple-system, "Segoe UI", sans-serif`;
    const nameW = ctx.measureText("BLACK AESTHETICS").width;
    ctx.font = `400 ${siteSize}px Inter, system-ui, -apple-system, "Segoe UI", sans-serif`;
    const siteW = ctx.measureText("blackaestheticspk.com").width;

    const textW = Math.max(nameW, siteW);
    const totalW = (logo ? mark + gap : 0) + textW;
    const left = W - margin - totalW;
    const bottom = H - margin;

    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = Math.round(mark * 0.28);
    ctx.shadowOffsetY = Math.round(mark * 0.04);

    if (logo) {
      ctx.globalAlpha = 0.92;
      ctx.drawImage(logo, left, bottom - mark, mark, mark);
      ctx.globalAlpha = 1;
    }

    const textLeft = left + (logo ? mark + gap : 0);
    ctx.fillStyle = "#fff3df";
    ctx.font = `600 ${nameSize}px Inter, system-ui, -apple-system, "Segoe UI", sans-serif`;
    ctx.fillText("BLACK AESTHETICS", textLeft, bottom - siteSize - Math.round(mark * 0.18));
    ctx.globalAlpha = 0.82;
    ctx.font = `400 ${siteSize}px Inter, system-ui, -apple-system, "Segoe UI", sans-serif`;
    ctx.fillText("blackaestheticspk.com", textLeft, bottom - Math.round(mark * 0.04));
    ctx.restore();
  }

  // ---- download (2D canvas composite of every placed piece) ----
  // Exports the PHOTO only (letterbox bars cropped away) at the photo's own resolution, so the
  // saved image is shareable quality. Faithfully captures position / zoom / rotation; tilt (a 3D
  // perspective on screen) is approximated with a skew so the export reads the same direction.
  const EXPORT_MAX_EDGE = 2400;

  async function downloadComposite() {
    if (!hasPhoto() || !pieces.length || !photo.naturalWidth) return;
    downloadBtn.disabled = true;
    try {
      const pr = photoRect();
      const capScale = Math.min(1, EXPORT_MAX_EDGE / Math.max(photo.naturalWidth, photo.naturalHeight));
      const W = Math.round(photo.naturalWidth * capScale);
      const H = Math.round(photo.naturalHeight * capScale);
      // CSS pixels (stage space) -> export pixels
      const s = W / pr.width;

      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(photo, 0, 0, W, H);

      pieces.forEach(({ img, t }) => {
        if (!img.naturalWidth) return;
        const artW = parseFloat(img.style.width) * s;
        const artH = artW / (img.naturalWidth / img.naturalHeight);
        ctx.save();
        ctx.translate((t.cx - pr.left) * s, (t.cy - pr.top) * s);
        ctx.rotate((t.rot * Math.PI) / 180);
        const skewX = Math.tan((-t.tiltY * 0.6 * Math.PI) / 180);
        const skewY = Math.tan((t.tiltX * 0.6 * Math.PI) / 180);
        ctx.transform(1, skewY, skewX, 1, 0, 0);
        ctx.scale(t.scale, t.scale);
        ctx.drawImage(img, -artW / 2, -artH / 2, artW, artH);
        ctx.restore();
      });

      const logo = await getWatermarkLogo().catch(() => null);
      drawWatermark(ctx, logo, W, H);

      const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "black-aesthetics-my-wall.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      refreshButtons();
    }
  }

  launch.addEventListener("click", () => open());
  document.body.appendChild(launch);
  document.body.appendChild(modal);
  syncSliders();

  return { open, close, launch, modal, _setPhotoForTest: setPhoto, _pieces: pieces };
}
