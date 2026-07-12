import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import fontData from "three/examples/fonts/helvetiker_bold.typeface.json";
import { getCategory, getHeroProduct, getProduct, getSubcollection, getSubcollectionHeroProduct, getSubcollectionProducts } from "../data/catalog.js";

// D47 bayless Home framing: full logo at the left through the two 3D shelves at the right.
// z 9.65 is only the 16:9 baseline — homeCameraZ() below refits z per viewport aspect.
const HOME_CAMERA = new THREE.Vector3(-0.25, 1.62, 9.65);
const HOME_LOOK = new THREE.Vector3(-0.25, 1.6, 0);
const CATEGORY_CAMERA = new THREE.Vector3(-3.12, 1.82, 7.85);
const CATEGORY_LOOK = new THREE.Vector3(-1.55, 1.62, 0);
const CATEGORY_FRONTAL_CAMERA = new THREE.Vector3(1.15, 1.82, 10.0);
const CATEGORY_FRONTAL_LOOK = new THREE.Vector3(1.15, 1.62, 0);
const CATEGORY_MOBILE_CAMERA = new THREE.Vector3(-4.0, 1.82, 10.0);
const CATEGORY_MOBILE_LOOK = new THREE.Vector3(-3.05, 1.62, 0);
const CATEGORY_MOBILE_FRONTAL_CAMERA = new THREE.Vector3(0.9, 1.82, 12.5);
const CATEGORY_MOBILE_FRONTAL_LOOK = new THREE.Vector3(0.9, 1.62, 0);
const VIEWER_CAMERA = new THREE.Vector3(0, 1.78, 6.55);
const VIEWER_LOOK = new THREE.Vector3(0, 1.72, 0);

// Content spans the full logo and shelf composition with a little room for hover lift.
const HOME_HALF_W = 4.6;
const HOME_HALF_H = 1.58;

// Home dolly distance from the wall plane (z = 0) so the logo AND all four bays fit with a
// 5% margin at any landscape aspect — narrow landscape (16:10, 4:3) pulls back, ultra-wide
// eases in. Portrait does NOT force-fit the logo (everything would go tiny; the mobile rail
// handles navigation), so it only gets a gentle pull-back. Camera x/y and look stay locked.
function homeCameraZ(aspect, fovYRad) {
  const halfTan = Math.tan(fovYRad / 2);
  const fitH = HOME_HALF_H / halfTan; // distance covering the vertical extent
  const fitW = HOME_HALF_W / (halfTan * aspect); // distance covering the horizontal extent
  const d = Math.max(fitH, fitW) * 1.05;
  return aspect >= 1.2 ? THREE.MathUtils.clamp(d, 9.4, 13.5) : THREE.MathUtils.clamp(d, 9.4, 10.5);
}

function homeCameraX(aspect) {
  return aspect < 0.78 ? -4 : HOME_CAMERA.x;
}

const SMALL_GRID = {
  startX: -0.4,
  stepX: 1.36,
  rowY: [2.47, 1.0],
};
const HERO_BAY_RIGHT_WALL_X = -1.39;
const SMALL_BAY_HALF_WIDTH = 0.48;
const HERO_GRID_VANISH_X = HERO_BAY_RIGHT_WALL_X + SMALL_BAY_HALF_WIDTH + 0.08;
const HERO_GRID_FULL_X = SMALL_GRID.startX - 0.12;
const GRID_EDGE_SCALE_DISTANCE = HERO_GRID_FULL_X - HERO_GRID_VANISH_X;

const TRACK_STEM_X = [-5.2, -2.6, 0, 2.6, 5.2, 7.8, 10.4];
// Blender parity: all colors below are the linear values from BAstore.blend converted to sRGB.
// Warm key (1, 0.72, 0.45) linear -> #ffddb3. Never eyeball these — recompute from the .blend.
const LIGHT_COLOR = 0xffddb3;
const FRONT_FILL_COLOR = 0xffeacb;

const WALL_FONT = new FontLoader().parse(fontData);
RectAreaLightUniformsLib.init();

export class GalleryScene {
  constructor({ canvas, categories, onCategorySelect, onSubcollectionSelect, onProductSelect, onProductOpen, onCategoryPreview, onInteractionLock }) {
    this.canvas = canvas;
    this.categories = categories;
    this.onCategorySelect = onCategorySelect;
    this.onSubcollectionSelect = onSubcollectionSelect;
    this.onProductSelect = onProductSelect;
    this.onProductOpen = onProductOpen;
    this.onCategoryPreview = onCategoryPreview;
    this.onInteractionLock = onInteractionLock;
    this.textureLoader = new THREE.TextureLoader();
    this.svgLoader = new SVGLoader();
    this.stlLoader = new STLLoader();
    this.textureCache = new Map();
    this.svgTextCache = new Map();
    this.svgResolvedCache = new Map();
    this.stlCache = new Map();
    this.stlResolvedCache = new Map();
    this.categoryPreparationCache = new Map();
    this.lightPoolTexture = null;
    this.clickable = [];
    this.pointer = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.clock = new THREE.Clock();
    this.targetCamera = HOME_CAMERA.clone();
    this.targetLook = HOME_LOOK.clone();
    this.look = HOME_LOOK.clone();
    this.scrollOffset = 0;
    this.maxScroll = 0;
    this.lastSignature = "";
    this.dragging = false;
    this.dragStartX = 0;
    this.dragLastX = 0;
    this.dragMoved = false;
    this.viewerOrbit = 0;
    this.hoveredEntry = null;
    this.hoveredHomeZone = null;
    this.gridTrack = null;
    this.transition = null;
    this.pendingSelectionBay = null;
    this.categoryCameraIsFrontal = false;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x120d09);
    this.scene.fog = new THREE.Fog(0x120d09, 10.5, 25);

    this.camera = new THREE.PerspectiveCamera(33, 1, 0.1, 100);
    this.camera.position.copy(HOME_CAMERA);

    this.materials = this.createMaterials();
    this.architecture = new THREE.Group();
    this.introGroup = new THREE.Group();
    this.homeGroup = new THREE.Group();
    this.categoryGroup = new THREE.Group();
    this.viewerGroup = new THREE.Group();
    this.transitionGroup = new THREE.Group();

    this.scene.add(this.architecture, this.introGroup, this.homeGroup, this.categoryGroup, this.viewerGroup, this.transitionGroup);
    this.createArchitecture();
    this.createIntro();
    this.createHome();
    this.createLights();
    this.bindEvents();
    this.resize();
    this.animate();
  }

  setState(state) {
    const signature = `${state.mode}:${state.activeCategoryId}:${state.activeSubcollectionId ?? "all"}:${state.activeProductId}`;
    if (signature === this.lastSignature) return;
    this.finishTransition();
    const previousState = this.state ? { ...this.state } : null;
    const sourceBay = this.pendingSelectionBay ?? this.findTransitionSource(previousState, state);
    const sourceProduct = this.findTransitionProduct(sourceBay);
    const sourceClone = sourceProduct ? this.cloneInWorld(sourceProduct) : null;
    // The old wall mount remains in the outgoing scene, but its selected product is detached into
    // its own travel clone so the mesh can leave the wall without appearing twice.
    const sourceWasVisible = sourceProduct?.visible;
    if (sourceProduct) sourceProduct.visible = false;
    // Browse Home clears instantly around the selected hero. Cloning the full product wall adds
    // no useful information and can briefly expose large transparent/background planes.
    const outgoingClone = previousState && previousState.mode !== "home" ? this.cloneInWorld(this.activeGroup(previousState.mode)) : null;
    if (sourceProduct) sourceProduct.visible = sourceWasVisible;
    this.pendingSelectionBay = null;
    this.lastSignature = signature;
    this.state = { ...state };

    this.introGroup.visible = state.mode === "intro";
    this.homeGroup.visible = state.mode === "home";
    this.categoryGroup.visible = state.mode === "category";
    this.viewerGroup.visible = state.mode === "viewer";

    if (state.mode === "intro") {
      this.clickable = [];
      this.targetCamera.copy(HOME_CAMERA);
      this.targetCamera.x = homeCameraX(this.camera.aspect);
      this.targetCamera.z = homeCameraZ(this.camera.aspect, THREE.MathUtils.degToRad(this.camera.fov));
      this.targetLook.copy(HOME_LOOK);
      this.targetLook.x = this.targetCamera.x;
      this.setIntroLayout();
      this.startTransition(previousState, outgoingClone, null, null, null);
      return;
    }

    if (state.mode === "home") {
      this.clickable = [...this.homeClickTargets];
      this.targetCamera.copy(HOME_CAMERA);
      this.targetCamera.x = homeCameraX(this.camera.aspect);
      // Re-entering home: refit the dolly for the live viewport so logo + bays frame fully.
      this.targetCamera.z = homeCameraZ(this.camera.aspect, THREE.MathUtils.degToRad(this.camera.fov));
      this.targetLook.copy(HOME_LOOK);
      this.targetLook.x = this.targetCamera.x;
      if (previousState?.mode === "intro") {
        [...this.homeZones.values()].forEach((entry, index) => {
          entry.revealProgress = 0;
          entry.revealIndex = index;
          entry.group.scale.setScalar(0.01);
        });
      }
      this.startTransition(
        previousState,
        outgoingClone,
        sourceClone,
        this.homeBays?.get(state.activeCategoryId),
        this.homeProducts?.get(state.activeCategoryId),
      );
      return;
    }

    if (state.mode === "category") {
      const category = getCategory(state.activeCategoryId);
      const { product } = getProduct(state.activeProductId);
      this.scrollOffset = 0;
      this.buildCategory(category, product);
      this.categoryCameraIsFrontal = false;
      this.setCategoryCamera();
      this.startTransition(previousState, outgoingClone, sourceClone, this.categoryBigBay, this.categoryBigProduct);
      return;
    }

    const { product, category } = getProduct(state.activeProductId);
    this.buildViewer(category, product);
    this.viewerOrbit = 0;
    this.targetCamera.copy(VIEWER_CAMERA);
    this.targetLook.copy(VIEWER_LOOK);
    this.startTransition(previousState, outgoingClone, sourceClone, this.viewerBay, this.viewerProduct);
  }

  activeGroup(mode) {
    if (mode === "intro") return this.introGroup;
    if (mode === "category") return this.categoryGroup;
    if (mode === "viewer") return this.viewerGroup;
    return this.homeGroup;
  }

  findTransitionSource(previousState, nextState) {
    if (!previousState) return null;
    if (previousState.mode === "intro") return null;
    if (previousState.mode === "home") return this.homeBays?.get(nextState.activeCategoryId) ?? null;
    if (previousState.mode === "viewer") return this.viewerBay ?? null;
    if (previousState.mode === "category") {
      const matchingGridBay = [...(this.gridBays?.values() ?? [])].find((entry) => {
        const data = entry.hit.userData;
        return data.productId === nextState.activeProductId || data.subcollectionId === nextState.activeSubcollectionId;
      });
      return matchingGridBay?.bay ?? this.categoryBigBay ?? null;
    }
    return null;
  }

  findTransitionProduct(bay) {
    if (!bay) return null;
    let product = null;
    bay.traverse((object) => {
      if (!product && object.userData?.transitionProduct) product = object;
    });
    return product;
  }

  cloneInWorld(object) {
    if (!object) return null;
    object.updateWorldMatrix(true, true);
    const clone = object.clone(true);
    clone.traverse((child) => {
      if (child.geometry) child.geometry = child.geometry.clone();
      if (child.material) {
        child.material = Array.isArray(child.material)
          ? child.material.map((material) => material.clone())
          : child.material.clone();
      }
    });
    const excluded = [];
    clone.traverse((child) => {
      if (child !== clone && child.userData?.excludeFromTransition && !child.parent?.userData?.excludeFromTransition) {
        excluded.push(child);
      }
    });
    excluded.forEach((child) => child.parent?.remove(child));
    object.getWorldPosition(clone.position);
    object.getWorldQuaternion(clone.quaternion);
    object.getWorldScale(clone.scale);
    clone.visible = true;
    return clone;
  }

  startTransition(previousState, outgoing, source, destinationBay, destinationProduct) {
    if (!previousState) return;
    this.onInteractionLock?.(true);
    const cameraEnd = this.targetCamera.clone();
    const lookEnd = this.targetLook.clone();
    const outgoingItems = outgoing ? this.collectOutgoingItems(outgoing) : [];

    if (outgoing) this.transitionGroup.add(outgoing);
    if (source) this.transitionGroup.add(source);

    let sourceStart = null;
    let sourceEnd = null;
    let sourceStartScale = null;
    let sourceEndScale = null;
    if (source && destinationBay) {
      destinationBay.updateWorldMatrix(true, true);
      sourceStart = source.position.clone();
      sourceEnd = new THREE.Vector3();
      (destinationProduct ?? destinationBay).getWorldPosition(sourceEnd);
      sourceStartScale = source.scale.clone();
      const sourceSize = new THREE.Vector3();
      const destinationSize = new THREE.Vector3();
      new THREE.Box3().setFromObject(source).getSize(sourceSize);
      new THREE.Box3().setFromObject(destinationProduct ?? destinationBay).getSize(destinationSize);
      const uniformScale = THREE.MathUtils.clamp(
        Math.min(
          destinationSize.x / Math.max(0.001, sourceSize.x),
          destinationSize.y / Math.max(0.001, sourceSize.y),
        ),
        0.45,
        3.2,
      );
      sourceEndScale = sourceStartScale.clone().multiplyScalar(uniformScale);
      destinationBay.visible = false;
      if (destinationProduct) destinationProduct.visible = false;
    }

    if (this.state.mode === "category" && this.gridBays) {
      [...this.gridBays.values()].forEach((entry, index) => {
        entry.revealProgress = 0;
        entry.revealIndex = index;
        entry.bay.scale.setScalar(0.01);
      });
      if (this.categoryDescription) {
        this.categoryDescription.visible = true;
        this.categoryDescription.userData.revealGlyphs?.forEach((glyph) => {
          glyph.visible = false;
          glyph.scale.copy(glyph.userData.revealBaseScale).multiplyScalar(0.78);
          glyph.position.copy(glyph.userData.revealBasePosition);
          glyph.position.z += 0.055;
        });
        if (this.categoryDescription.userData.revealDivider) {
          this.categoryDescription.userData.revealDivider.visible = false;
        }
      }
    }

    this.clickable = [];
    this.transition = {
      elapsed: 0,
      startedAt: performance.now(),
      duration:
        this.state.mode === "category"
          ? 2.35 + Math.min(0.8, (this.gridBays?.size ?? 0) * 0.045)
          : this.state.mode === "viewer"
            ? 2.15
            : this.state.mode === "home"
              ? 1.65
              : 1.35,
      outgoing,
      outgoingItems,
      source,
      sourceStart,
      sourceEnd,
      sourceStartScale,
      sourceEndScale,
      destinationBay,
      destinationProduct,
      cameraStart: this.camera.position.clone(),
      cameraEnd,
      lookStart: this.look.clone(),
      lookEnd,
    };
  }

  collectOutgoingItems(outgoing) {
    const bays = [];
    outgoing.traverse((object) => {
      if (object.userData?.isBayPrefab && object.visible) bays.push(object);
    });
    const staticItems = outgoing.children.filter((child) => {
      if (!child.visible || child.userData?.isBayPrefab) return false;
      let containsBay = false;
      child.traverse((object) => {
        if (object !== child && object.userData?.isBayPrefab) containsBay = true;
      });
      return !containsBay;
    });
    return [...bays, ...staticItems].map((object, index) => ({
      object,
      index,
      scale: object.scale.clone(),
      position: object.position.clone(),
      isBay: Boolean(object.userData?.isBayPrefab),
    }));
  }

  finishTransition() {
    if (!this.transition) return;
    const { outgoing, source, destinationBay, destinationProduct } = this.transition;
    if (outgoing) {
      this.transitionGroup.remove(outgoing);
      disposeObject3D(outgoing);
    }
    if (source) {
      this.transitionGroup.remove(source);
      disposeObject3D(source);
    }
    if (destinationBay) {
      destinationBay.visible = true;
      destinationBay.scale.setScalar(1);
    }
    if (destinationProduct) destinationProduct.visible = true;
    if (this.categoryDescription) {
      this.categoryDescription.visible = true;
      this.categoryDescription.scale.setScalar(1);
      this.categoryDescription.userData.revealGlyphs?.forEach((glyph) => {
        glyph.visible = true;
        glyph.scale.copy(glyph.userData.revealBaseScale);
        glyph.position.copy(glyph.userData.revealBasePosition);
      });
      if (this.categoryDescription.userData.revealDivider) {
        this.categoryDescription.userData.revealDivider.visible = true;
      }
    }
    if (this.gridBays) {
      this.gridBays.forEach((entry) => {
        entry.revealProgress = 1;
      });
    }
    if (this.homeZones) {
      this.homeZones.forEach((entry) => {
        entry.revealProgress = 1;
      });
    }
    this.transition = null;
    this.onInteractionLock?.(false);
  }

  scrollCategoryBy(direction) {
    const stepX = this.gridLayout?.stepX ?? SMALL_GRID.stepX;
    this.scrollCategoryTo(this.scrollOffset + direction * stepX * 3);
  }

  scrollCategoryTo(value) {
    if (this.state?.mode !== "category") return;
    const nextOffset = THREE.MathUtils.clamp(value, 0, this.maxScroll);
    if (Math.abs(nextOffset - this.scrollOffset) < 0.001) return;
    this.scrollOffset = nextOffset;
    if (this.gridTrack) this.gridTrack.position.x = -this.scrollOffset;
    this.updateCategoryGrid();
  }

  prepareCategory(categoryId, subcollectionId = null) {
    const cacheKey = `${categoryId}:${subcollectionId ?? "all"}`;
    if (this.categoryPreparationCache.has(cacheKey)) return this.categoryPreparationCache.get(cacheKey);

    const category = getCategory(categoryId);
    const subcollection = getSubcollection(category, subcollectionId);
    let products;
    if (subcollection) {
      products = getSubcollectionProducts(category, subcollection.id).slice(0, 18);
    } else if (category.subcollections?.length) {
      products = category.subcollections
        .map((item) => category.products.find((product) => product.id === item.coverProductId))
        .filter(Boolean);
    } else {
      products = category.products.slice(0, 18);
    }
    products.unshift(subcollection ? getSubcollectionHeroProduct(category, subcollection.id) : getHeroProduct(category));
    const uniqueProducts = [...new Map(products.map((product) => [product.id, product])).values()];

    const tasks = uniqueProducts.flatMap((product) => {
      if (product.kind === "wall-art" && product.image) return [this.loadSvgText(product.image)];
      if (product.kind === "digital" && product.image) {
        const texture = this.loadTexture(product.image);
        return [texture.userData.readyPromise ?? Promise.resolve(texture)];
      }
      if (product.kind === "layered") return (product.layers ?? []).map((path) => this.loadSvgText(path));
      if (product.kind === "object" && product.model) return [this.loadStlGeometry(product.model)];
      return [];
    });
    const preparation = Promise.allSettled(tasks).then(() => undefined);
    this.categoryPreparationCache.set(cacheKey, preparation);
    return preparation;
  }

  createMaterials() {
    const ashTexture = this.createAshTexture();
    const plasterTexture = this.createPlasterTexture();
    ashTexture.repeat.set(3.2, 0.9);
    return {
      // BA_RR_warm_plaster_real_ratio: linear (0.53, 0.40, 0.25) -> sRGB #c0aa89 (baked into the texture).
      wall: new THREE.MeshStandardMaterial({
        map: plasterTexture,
        bumpMap: plasterTexture,
        roughness: 0.86,
        metalness: 0,
        bumpScale: 0.028,
      }),
      // BA_RR_bay_inner_gray: linear (0.62, 0.61, 0.585) -> #cecdc9 — the gray canvas behind black art.
      bayInner: new THREE.MeshStandardMaterial({ color: 0xcecdc9, roughness: 0.85 }),
      // BA_MAT_ASH_WOOD_DARKGREY: grey grain ramp 0.055 -> 0.145 (#424242 -> #6a6a6a) baked into texture.
      blackAsh: new THREE.MeshStandardMaterial({ map: ashTexture, roughness: 0.62, metalness: 0 }),
      black: new THREE.MeshStandardMaterial({ color: 0x050403, roughness: 0.58, metalness: 0.06 }),
      // D50 web floor: black-and-gold marble slabs, generated procedurally so no new asset is needed.
      floor: new THREE.MeshStandardMaterial({
        map: this.createFloorTexture(),
        roughness: 0.28,
        metalness: 0.18,
      }),
      // BA_RR_warm_gold_emission: emission (1, 0.62, 0.28) x4 -> #ffce90.
      goldLight: new THREE.MeshStandardMaterial({ color: 0xffce90, emissive: 0xffce90, emissiveIntensity: 2.4, roughness: 0.34 }),
      hit: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
      wallText: new THREE.MeshStandardMaterial({
        color: 0x0b0704,
        emissive: 0x180c03,
        emissiveIntensity: 0.1,
        roughness: 0.46,
        metalness: 0.03,
      }),
      // BA_SP_gold_matte: linear (0.65, 0.45, 0.15) -> #d3b36c, metallic 0.9, rough 0.35.
      wallTextGold: new THREE.MeshStandardMaterial({ color: 0xd3b36c, roughness: 0.35, metalness: 0.9 }),
    };
  }

  createArchitecture() {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(18, 3.6, 0.16), this.materials.wall);
    wall.position.set(2.6, 1.8, -0.08);
    wall.receiveShadow = true;
    this.architecture.add(wall);

    const header = new THREE.Mesh(new THREE.BoxGeometry(18.3, 0.52, 0.86), this.materials.black);
    header.position.set(2.45, 3.92, 0.32);
    header.castShadow = true;
    this.architecture.add(header);

    const cove = new THREE.Mesh(new THREE.BoxGeometry(17.7, 0.055, 0.04), this.materials.goldLight);
    cove.position.set(2.75, 3.43, 0.02);
    this.architecture.add(cove);

    const rail = new THREE.Mesh(new THREE.BoxGeometry(17.25, 0.06, 0.06), this.materials.black);
    rail.position.set(2.975, 3.3, 0.42);
    this.architecture.add(rail);

    TRACK_STEM_X.forEach((x) => {
      const stem = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.36, 0.025), this.materials.black);
      stem.position.set(x, 3.48, 0.42);
      this.architecture.add(stem);
    });

    // FULLY LIT ROOM (D41): no spotlights at all — no fixture meshes, no spot lights,
    // no wall scallops. Even, bright gallery light from ambient + area fills + cove.
    // Rail + stems stay as architecture; bay strips/pucks/underlights are bay furniture.

    // Whisper of shade at the very top/bottom so the wall still has depth.
    const shade = new THREE.Mesh(new THREE.PlaneGeometry(18, 3.6), this.createWallShadeMaterial());
    shade.position.set(2.6, 1.8, 0.004);
    this.architecture.add(shade);

    const floor = new THREE.Mesh(new THREE.BoxGeometry(17.7, 0.09, 6.2), this.materials.floor);
    floor.position.set(2.75, -0.045, 3.1);
    floor.receiveShadow = true;
    this.architecture.add(floor);

    const skirtingTop = new THREE.Mesh(new THREE.BoxGeometry(18, 0.16, 0.08), this.materials.black);
    skirtingTop.position.set(2.6, 0.22, 0.06);
    const skirtingBottom = new THREE.Mesh(new THREE.BoxGeometry(18, 0.09, 0.09), this.materials.black);
    skirtingBottom.position.set(2.6, 0.065, 0.07);
    this.architecture.add(skirtingTop, skirtingBottom);

    for (let i = 0; i < 10; i += 1) {
      const seam = new THREE.Mesh(new THREE.BoxGeometry(17.4, 0.004, 0.012), this.materials.black);
      seam.position.set(2.6, 0.006, 0.55 + i * 0.52);
      this.architecture.add(seam);
    }
  }

  createIntro() {
    const wallTone = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 3.6),
      new THREE.MeshBasicMaterial({ map: this.createHomeWallFinishTexture(), transparent: true, opacity: 0.34, depthWrite: false }),
    );
    wallTone.position.set(2.6, 1.8, 0.002);
    wallTone.userData.excludeFromTransition = true;
    this.introGroup.add(wallTone);

    const logo = this.createLogoPlane(2.18, 2.18);
    logo.position.set(-3.65, 1.72, 0.045);
    this.introLogo = logo;
    this.introGroup.add(logo, this.createWallLightPool(-3.65, 1.82, 2.65, 3.05, 0.2));

    const copyGroup = new THREE.Group();
    this.introCopy = copyGroup;
    const statement = this.createExtrudedText("OBJECTS WITH PRESENCE.", 0.18, 0.024, this.materials.wallText);
    statement.position.set(-0.95, 2.15, 0.045);
    const statementBox = statement.geometry.boundingBox;
    const statementWidth = statementBox.max.x - statementBox.min.x;
    if (statementWidth > 4.55) statement.scale.setScalar(4.55 / statementWidth);
    copyGroup.add(statement);

    const aboutLines = [
      "BLACK AESTHETICS CREATES DISTINCTIVE WALL ART,",
      "DIGITAL PRINTS, LAYERED PIECES AND 3D OBJECTS",
      "FOR SPACES WITH CHARACTER.",
    ];
    aboutLines.forEach((line, index) => {
      const text = this.createExtrudedText(line, 0.068, 0.016, this.materials.wallText);
      text.position.set(-0.92, 1.62 - index * 0.18, 0.04);
      copyGroup.add(text);
    });
    this.introGroup.add(copyGroup);

    [-4.5, -2.9, -1.3, 0.3, 1.9, 3.5].forEach((x) => {
      const fixture = this.createHomeFixture(x);
      const pool = this.createWallLightPool(x, 2.12, 1.55, 2.8, 0.15);
      const key = this.createHomeKeyLight(x);
      fixture.userData.excludeFromTransition = true;
      pool.userData.excludeFromTransition = true;
      key.userData.excludeFromTransition = true;
      this.introGroup.add(fixture, pool, key);
    });
  }

  setIntroLayout() {
    if (!this.introLogo || !this.introCopy) return;
    const portrait = this.camera.aspect < 0.78;
    if (portrait) {
      this.introLogo.position.set(-4, 2.2, 0.045);
      this.introLogo.scale.setScalar(0.72);
      this.introCopy.position.set(-3.9, -0.05, 0);
      this.introCopy.scale.setScalar(0.5);
      return;
    }
    this.introLogo.position.set(-3.65, 1.72, 0.045);
    this.introLogo.scale.setScalar(1);
    this.introCopy.position.set(0, 0, 0);
    this.introCopy.scale.setScalar(1);
  }

  createHome() {
    this.homeClickTargets = [];
    this.homeBays = new Map();
    this.homeProducts = new Map();
    this.homeZones = new Map();

    const wallTone = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 3.6),
      new THREE.MeshBasicMaterial({ map: this.createHomeWallFinishTexture(), transparent: true, opacity: 0.34, depthWrite: false }),
    );
    wallTone.position.set(2.6, 1.8, 0.002);
    wallTone.userData.excludeFromTransition = true;
    this.homeGroup.add(wallTone);

    const logo = this.createLogoPlane(1.36, 1.36);
    logo.position.set(-4.2, 1.78, 0.04);
    this.homeGroup.add(this.createWallLightPool(-4.2, 1.76, 1.55, 2.7, 0.18), logo);

    const wall = this.createHomeZone("wall-art", -2.45, 2.18, 2.52);
    this.addHomeProduct(wall, "wall-elegant-horse-head", { width: 1.86, height: 1.86, homeDark: true }, 0, 0.43, 0.09, true);
    [
      ["wall-decor-horse", -0.84, -0.73, 0.66, 0.64],
      ["wall-mountain-tree", -0.28, -0.72, 0.62, 0.64],
      ["wall-geometric-horse", 0.27, -0.73, 0.6, 0.62],
      ["wall-horse", 0.82, -0.72, 0.64, 0.64],
    ].forEach(([id, x, y, width, height]) => this.addHomeProduct(wall, id, { width, height, homeDark: true }, x, y, 0.07));

    const digital = this.createHomeZone("digital-art", -0.25, 1.96, 2.72);
    this.addHomeProduct(digital, "digital-ironman", { width: 0.6, height: 1.08 }, -0.72, 0.02, 0.08);
    this.addHomeProduct(digital, "digital-joker", { width: 0.78, height: 1.68 }, 0, 0.27, 0.09, true);
    this.addHomeProduct(digital, "digital-joker-dark-knight", { width: 0.5, height: 0.9 }, 0.73, -0.45, 0.1);

    const layered = this.createHomeZone("layered-art", 1.55, 2.2, 2.78);
    this.addHomeProduct(layered, "layered-wolf", { width: 1.54, height: 1.76, big: true }, 0, 0.03, 0.11, true);

    const objects = this.createHomeZone("3d-objects", 3.55, 2.05, 2.66);
    const shelfMaterial = new THREE.MeshStandardMaterial({ color: 0x11100e, roughness: 0.5, metalness: 0.08 });
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.09, 0.72), shelfMaterial);
    shelf.position.set(0, 0.05, 0.42);
    shelf.castShadow = true;
    objects.add(shelf);
    const panther = this.addHomeProduct(objects, "object-panther", { width: 0.92, height: 0.64, big: true, homeDark: true }, 0, 0.64, 0.76, true, 2.75);
    panther.rotation.y = Math.PI / 2;

    [-4.2, -2.8, -1.35, 0.05, 1.5, 2.9, 4.05].forEach((x) => {
      const fixture = this.createHomeFixture(x);
      const pool = this.createWallLightPool(x, 2.15, 1.45, 2.75, 0.16);
      const key = this.createHomeKeyLight(x);
      fixture.userData.excludeFromTransition = true;
      pool.userData.excludeFromTransition = true;
      key.userData.excludeFromTransition = true;
      this.homeGroup.add(fixture, pool, key);
    });

    this.clickable = [...this.homeClickTargets];
  }

  createHomeZone(categoryId, x, width, height) {
    const zone = new THREE.Group();
    zone.position.set(x, 1.75, 0);
    zone.userData = { isHomeZone: true, categoryId };
    const hit = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.5), this.materials.hit);
    hit.position.set(0, 0, 0.24);
    hit.userData = { action: "category", categoryId };
    zone.add(hit);
    this.homeClickTargets.push(hit);
    this.homeBays.set(categoryId, zone);
    this.homeZones.set(categoryId, { group: zone, hit });
    this.homeGroup.add(zone);
    return zone;
  }

  addHomeProduct(zone, productId, bounds, x, y, z, transitionProduct = false, scale = 1) {
    const product = this.createProductDisplay(getProduct(productId).product, bounds);
    product.position.set(x, y, z);
    product.scale.setScalar(scale);
    product.userData.transitionProduct = transitionProduct;
    zone.add(product);
    if (transitionProduct) this.homeProducts.set(zone.userData.categoryId, product);
    return product;
  }

  createHomeFixture(x) {
    const fixture = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.28, 10), this.materials.black);
    stem.position.y = -0.13;
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.15, 16), this.materials.black);
    head.position.y = -0.31;
    fixture.position.set(x, 3.31, 0.43);
    fixture.add(stem, head);
    return fixture;
  }

  createHomeKeyLight(x) {
    const rig = new THREE.Group();
    const target = new THREE.Object3D();
    target.position.set(x, 1.55, 0);
    const light = new THREE.SpotLight(0xffc47f, 3.5, 5.5, 0.34, 0.9, 1.4);
    light.position.set(x, 3.18, 1.12);
    light.target = target;
    rig.add(light, target);
    return rig;
  }

  createWallMount({ x, y, width, height, label, labelSize = 0.11, labelDepth = 0.03, labelOffset = 0.13, labelPlacement = "below" }) {
    const group = new THREE.Group();
    group.position.set(x, y, 0);
    group.userData.isBayPrefab = true;
    group.userData.isBaylessMount = true;
    group.userData.baySize = { width, height };

    if (label) {
      const labelGroup = this.createWallMountLabel(label, width, labelSize, labelDepth);
      const labelY = labelPlacement === "above" ? height / 2 + labelOffset : -height / 2 - labelOffset;
      labelGroup.position.set(0, labelY, 0.07);
      group.add(labelGroup);
    }

    return group;
  }

  createFloatingShelf({ width, depth = 0.54, thickness = 0.075, y = -0.34, z = 0.38 }) {
    const group = new THREE.Group();
    const slab = new THREE.Mesh(new THREE.BoxGeometry(width, thickness, depth), this.materials.black);
    slab.position.set(0, y, z);
    slab.castShadow = true;
    slab.receiveShadow = true;

    const frontLip = new THREE.Mesh(new THREE.BoxGeometry(width * 1.02, thickness * 0.7, 0.035), this.materials.black);
    frontLip.position.set(0, y - thickness * 0.05, z + depth / 2 + 0.018);
    frontLip.castShadow = true;
    frontLip.receiveShadow = true;

    const wallShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 1.06, thickness * 1.7),
      new THREE.MeshBasicMaterial({ color: 0x080604, transparent: true, opacity: 0.22, depthWrite: false }),
    );
    wallShadow.position.set(0, y - thickness * 0.15, 0.018);

    group.add(wallShadow, slab, frontLip);
    return group;
  }

  createWallMountLabel(label, width, baseSize, depth) {
    const maxWidth = width * 0.96;
    const maxHeight = baseSize * 2.35;
    const lines = splitShelfLabel(label, width < 1.05 ? 11 : width < 1.8 ? 16 : 22);
    const group = new THREE.Group();
    const lineHeight = baseSize * 1.05;
    let naturalWidth = 0;
    let minY = Infinity;
    let maxY = -Infinity;

    lines.forEach((line, index) => {
      const mesh = this.createExtrudedText(line, baseSize, depth, this.materials.wallText);
      const box = mesh.geometry.boundingBox;
      const width = box.max.x - box.min.x;
      const height = box.max.y - box.min.y;
      const lineY = ((lines.length - 1) / 2 - index) * lineHeight;

      mesh.position.set(-(box.min.x + width / 2), lineY - (box.min.y + height / 2), 0);
      group.add(mesh);

      naturalWidth = Math.max(naturalWidth, width);
      minY = Math.min(minY, lineY - height / 2);
      maxY = Math.max(maxY, lineY + height / 2);
    });

    const naturalHeight = Math.max(0.001, maxY - minY);
    const scale = Math.min(1, maxWidth / Math.max(0.001, naturalWidth), maxHeight / naturalHeight);
    group.scale.setScalar(scale);
    return group;
  }

  buildCategory(category, activeProduct) {
    if (this.gridBays) {
      this.gridBays.forEach((entry) => disposeObject3D(entry.bay));
    }
    this.clearGroup(this.categoryGroup);
    this.gridBays = new Map();
    this.gridTrack = new THREE.Group();
    this.hoveredEntry = null;
    this.clickable = [];
    const activeSubcollection = getSubcollection(category, this.state.activeSubcollectionId);
    const showingSubcollections = Boolean(category.subcollections?.length && !activeSubcollection);
    const lead = activeSubcollection ? activeProduct ?? getSubcollectionHeroProduct(category, activeSubcollection.id) : activeProduct ?? getHeroProduct(category);
    const viewCopy = activeSubcollection ?? category;

    this.categoryGroup.add(this.createWallLightPool(-4.78, 2.12, 2.42, 1.9, 0.16));
    const desc = this.createDescriptionPanel(viewCopy, lead);
    desc.position.set(-4.82, 2.54, 0.03);
    this.categoryDescription = desc;
    this.categoryGroup.add(desc);

    const bigBay = this.createWallMount({
      x: -2.55,
      y: 1.735,
      width: 2.12,
      height: 2.35,
      label: lead.name.toUpperCase(),
      labelSize: 0.13,
      labelDepth: 0.04,
      labelOffset: 0.11,
    });
    const isObjectCategory = category.id === "3d-objects";
    const bigProduct = this.createProductDisplay(lead, { width: 1.64, height: 1.92, big: true });
    bigProduct.userData.transitionProduct = true;
    bigProduct.position.set(0, isObjectCategory ? 0.12 : 0, isObjectCategory ? 0.52 : 0.105);
    if (isObjectCategory) {
      bigBay.add(this.createFloatingShelf({ width: 1.82, depth: 0.72, thickness: 0.09, y: -0.3, z: 0.42 }));
    }
    bigBay.add(bigProduct);
    const bigHit = new THREE.Mesh(new THREE.BoxGeometry(2.35, 2.75, 0.5), this.materials.hit);
    bigHit.position.set(0, 0, 0.28);
    bigHit.userData = { action: "product", productId: lead.id };
    bigBay.add(bigHit);
    this.clickable.push(bigHit);
    this.categoryBigBay = bigBay;
    this.categoryBigProduct = bigProduct;
    this.categoryGroup.add(bigBay);
    this.categoryGroup.add(this.createWallLightPool(-2.55, 1.86, 2.28, 2.65, 0.16));
    this.categoryGroup.add(this.createRowWash(new THREE.Vector3(5.0, 3.1, 1.4), new THREE.Vector3(5.0, 2.35, 0.04), 2.2));
    this.categoryGroup.add(this.createRowWash(new THREE.Vector3(5.0, 1.9, 1.6), new THREE.Vector3(5.0, 1.0, 0.04), 1.8));
    this.categoryGroup.add(this.gridTrack);

    const products = showingSubcollections ? category.subcollections : getSubcollectionProducts(category, activeSubcollection?.id);
    if (this.gridBays) this.gridBays.forEach((entry) => this.disposeGridBay(entry.bay));
    this.categoryProducts = products;
    this.categoryShowingSubcollections = showingSubcollections;
    this.gridLayout =
      !showingSubcollections && products.length <= 6
        ? { startX: -0.18, stepX: 1.05, rowY: [2.46, 1.02] }
        : SMALL_GRID;
    this.bigHit = bigHit;
    this.gridBays = new Map();
    this.maxScroll = Math.max(0, (Math.ceil(products.length / 2) - 4) * this.gridLayout.stepX);
    // Windowed virtualization: only the product bays near the scroll window are built (see
    // updateCategoryGrid). With 148 Wall Art products, eagerly building every bay (a fetch + SVG
    // extrude each) was the load cost — now ~9 columns are live at a time.
    this.gridTrack.position.x = -this.scrollOffset;
    this.updateCategoryGrid();
  }

  // Build one wall-mounted product group (extruded SVG / poster / STL) and return its group + hit mesh.
  buildGridBay(item, index) {
    const row = index % 2;
    const col = Math.floor(index / 2);
    const layout = this.gridLayout ?? SMALL_GRID;
    const x = layout.startX + col * layout.stepX;
    const y = layout.rowY[row];
    const product = this.categoryShowingSubcollections ? getSubcollectionHeroProduct(getCategory(this.state.activeCategoryId), item.id) : item;
    const bay = this.createWallMount({
      x,
      y,
      width: 0.9,
      height: 0.98,
      label: (this.categoryShowingSubcollections ? item.label : product.name).toUpperCase(),
      labelSize: 0.07,
      labelDepth: 0.026,
      labelOffset: 0.1,
    });
    const isObjectProduct = product.kind === "object";
    // restY: shelf top in display space — shelf centre y 0.08 + half thickness 0.0325, minus the
    // display group's own y offset (0.08). Keeps STLs standing ON the slab, not through it.
    const display = this.createProductDisplay(product, {
      width: isObjectProduct ? 0.62 : 0.58,
      height: isObjectProduct ? 0.58 : 0.68,
      big: false,
      ...(isObjectProduct ? { restY: 0.0325 } : {}),
    });
    display.userData.transitionProduct = true;
    display.position.set(0, isObjectProduct ? 0.08 : 0, isObjectProduct ? 0.44 : 0.105);
    if (isObjectProduct) {
      bay.add(this.createFloatingShelf({ width: 0.76, depth: 0.5, thickness: 0.065, y: 0.08, z: 0.32 }));
    }
    bay.add(display);
    bay.add(this.createWallLightPool(0, 0.16, 0.88, 1.1, 0.12));
    const hoverGlow = this.createWallLightPool(0, 0.12, 1.08, 1.28, 0.24);
    hoverGlow.position.z = 0.032;
    hoverGlow.visible = false;
    bay.add(hoverGlow);
    if (this.categoryShowingSubcollections) {
      const count = this.createExtrudedText(`${item.productIds.length} PIECES`, 0.06, 0.012, this.materials.wallTextGold);
      centerGeometry(count.geometry);
      count.position.set(0, -0.34, 0.045);
      bay.add(count);
    }
    const hit = new THREE.Mesh(new THREE.BoxGeometry(1.02, 1.28, 0.46), this.materials.hit);
    hit.position.set(0, 0, isObjectProduct ? 0.38 : 0.28);
    hit.userData = this.categoryShowingSubcollections ? { action: "subcollection", subcollectionId: item.id } : { action: "product", productId: product.id };
    bay.add(hit);
    this.gridTrack.add(bay);
    return {
      bay,
      productDisplay: display,
      productBaseScale: display.scale.clone(),
      productBaseZ: display.position.z,
      hit,
      hoverGlow,
      edgeScale: 1,
      revealProgress: 1,
      revealIndex: index,
    };
  }

  // Dispose a grid bay's per-mesh geometry (the heavy extruded SVG) and its NON-shared materials.
  // Singletons in this.materials and cached textures are left intact so other bays keep working.
  disposeGridBay(bay) {
    if (!this.sharedMaterials) this.sharedMaterials = new Set(Object.values(this.materials));
    bay.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      const mats = Array.isArray(child.material) ? child.material : child.material ? [child.material] : [];
      mats.forEach((material) => {
        if (!this.sharedMaterials.has(material)) material.dispose();
      });
    });
  }

  // Keep only the columns within HALF world-units of the scroll centre built; drop ones that
  // scroll a whole column past it (hysteresis avoids thrash at the edge). Runs on build/scroll/resize.
  updateCategoryGrid() {
    if (this.state?.mode !== "category" || !this.categoryProducts || !this.gridBays) return;
    if (this.gridTrack) this.gridTrack.position.x = -this.scrollOffset;
    const rightEdge = this.camera.aspect < 0.78 ? 4.6 : 8.9;
    this.categoryProducts.forEach((item, index) => {
      const layout = this.gridLayout ?? SMALL_GRID;
      const x = layout.startX + Math.floor(index / 2) * layout.stepX;
      const visibleX = x - this.scrollOffset;
      const near = visibleX >= HERO_GRID_VANISH_X - GRID_EDGE_SCALE_DISTANCE && visibleX <= rightEdge + GRID_EDGE_SCALE_DISTANCE;
      if (near) {
        const newlyBuilt = !this.gridBays.has(index);
        if (newlyBuilt) this.gridBays.set(index, this.buildGridBay(item, index));
        const entry = this.gridBays.get(index);
        entry.edgeScale = gridEdgeScale(visibleX, rightEdge);
        if (newlyBuilt) entry.bay.scale.setScalar(entry.edgeScale);
        entry.hit.visible = entry.edgeScale > 0.45;
      } else if (this.gridBays.has(index)) {
        const entry = this.gridBays.get(index);
        this.gridTrack.remove(entry.bay);
        this.disposeGridBay(entry.bay);
        this.gridBays.delete(index);
      }
    });
    this.clickable = [this.bigHit, ...[...this.gridBays.values()].map((entry) => entry.hit)];
  }

  buildViewer(category, product) {
    this.clearGroup(this.viewerGroup);
    this.clickable = [];
    const bay = this.createWallMount({
      x: 0,
      y: 1.735,
      width: 2.32,
      height: 2.45,
      label: product.name.toUpperCase(),
      labelSize: 0.12,
      labelDepth: 0.042,
      labelOffset: 0.11,
      labelPlacement: "above",
    });
    const isObjectProduct = product.kind === "object";
    const display = this.createProductDisplay(product, { width: 1.72, height: 1.96, big: true });
    display.userData.transitionProduct = true;
    display.position.set(0, isObjectProduct ? 0.12 : 0, isObjectProduct ? 0.62 : 0.48);
    display.userData.viewerProduct = true;
    if (isObjectProduct) {
      bay.add(this.createFloatingShelf({ width: 1.9, depth: 0.78, thickness: 0.09, y: -0.3, z: 0.43 }));
    }
    bay.add(display);
    this.viewerProduct = display;
    this.viewerProductInfo = { productId: product.id, baseScale: display.scale.clone() };
    this.viewerBay = bay;
    this.viewerGroup.add(this.createWallLightPool(0, 1.9, 2.5, 2.8, 0.16), bay);
  }

  // D54: the viewer mesh REPRESENTS the selected variant. Size scales the whole piece
  // relative to the largest size (the display default), Thickness scales depth only,
  // Acrylic swaps non-shared materials to a gloss finish. Wood restores the originals.
  applyViewerVariant(productId, { sizeRatio = 1, thicknessMul = 1, acrylic = false } = {}) {
    if (this.state?.mode !== "viewer") return;
    if (!this.viewerProduct || this.viewerProductInfo?.productId !== productId) return;
    const base = this.viewerProductInfo.baseScale;
    this.viewerProduct.scale.set(base.x * sizeRatio, base.y * sizeRatio, base.z * sizeRatio * thicknessMul);

    if (!this.sharedMaterials) this.sharedMaterials = new Set(Object.values(this.materials));
    this.viewerProduct.traverse((child) => {
      if (!child.isMesh) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      const swapped = materials.map((material) => {
        if (!material?.isMeshStandardMaterial || this.sharedMaterials.has(material)) return material;
        // Remember which original each mesh had so Wood always restores exactly.
        if (!child.userData.woodMaterials) child.userData.woodMaterials = new Map();
        const original = child.userData.woodMaterials.get(material.uuid)?.wood ?? material;
        if (!acrylic) return original;
        let entry = child.userData.woodMaterials.get(original.uuid);
        if (!entry) {
          const gloss = original.clone();
          gloss.roughness = 0.12;
          gloss.metalness = 0.08;
          entry = { wood: original, acrylic: gloss };
          child.userData.woodMaterials.set(original.uuid, entry);
          child.userData.woodMaterials.set(gloss.uuid, entry);
        }
        return entry.acrylic;
      });
      child.material = Array.isArray(child.material) ? swapped : swapped[0];
    });
  }

  createDescriptionPanel(category) {
    const group = new THREE.Group();
    const titleLine = this.createGlyphLine(category.label.toUpperCase(), 0.18, 0.03, this.materials.wallText);
    const title = titleLine.group;
    const divider = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.014, 0.026), this.materials.wallTextGold);
    divider.position.set(0.61, -0.2, 0.01);
    // Long labels ("DIGITAL ART", "LAYERED ART") can crowd the big bay (left edge ≈ world
    // −3.71; this panel sits at −4.82), so the title gets a fixed physical lane.
    // Short labels ("WALL ART") measure under the cap and stay untouched.
    const TITLE_MAX_W = 1.02;
    const titleWidth = titleLine.width;
    if (titleWidth > TITLE_MAX_W) {
      const s = TITLE_MAX_W / titleWidth;
      title.scale.set(s, s, 1); // uniform x/y so the glyphs keep their aspect
      divider.scale.x = s; // shrink the gold rule to match the title width
      divider.position.x = 0.61 * s; // and re-anchor it left-aligned under the title
    }
    const lines = wrapText(category.description, 26).slice(0, 6);
    const body = new THREE.Group();
    const bodyGlyphs = [];
    lines.forEach((line, index) => {
      const textLine = this.createGlyphLine(line, 0.052, 0.017, this.materials.wallText);
      textLine.group.position.set(0, -0.38 - index * 0.125, 0);
      body.add(textLine.group);
      bodyGlyphs.push(...textLine.glyphs);
    });
    group.add(title, divider, body);
    group.userData.revealGlyphs = [...titleLine.glyphs, ...bodyGlyphs];
    group.userData.titleGlyphCount = titleLine.glyphs.length;
    group.userData.revealDivider = divider;
    return group;
  }

  createGlyphLine(text, size, depth, material) {
    const group = new THREE.Group();
    const glyphs = [];
    let cursor = 0;
    [...text].forEach((character) => {
      if (character === " ") {
        cursor += size * 0.58;
        return;
      }
      const glyph = this.createExtrudedText(character, size, depth, material);
      const box = glyph.geometry.boundingBox;
      const width = Math.max(size * 0.22, box.max.x - box.min.x);
      glyph.position.x = cursor - box.min.x;
      glyph.userData.revealBasePosition = glyph.position.clone();
      glyph.userData.revealBaseScale = glyph.scale.clone();
      group.add(glyph);
      glyphs.push(glyph);
      cursor += width + size * 0.18;
    });
    return { group, glyphs, width: Math.max(0, cursor - size * 0.18) };
  }

  createProductDisplay(product, bounds) {
    if (product.kind === "object") {
      return this.createObjectProduct(product, bounds);
    }

    const group = new THREE.Group();
    const aspect = product.aspect ?? 1;
    const fitted = fit(bounds.width, bounds.height, aspect);

    if (product.kind === "layered") {
      return this.createLayeredProduct(product, bounds);
    }

    if (product.kind === "digital") {
      return this.createDigitalProduct(product, fitted);
    }

    if (product.kind === "wall-art") {
      return this.createWallArtProduct(product, bounds);
    }

    const plane = this.createImagePlane(product.image, fitted.width, fitted.height, { transparent: true, physical: false });
    group.add(plane);
    return group;
  }

  // Digital Art = POSTER (D34). One black sheet mesh; the final print file is the texture of the
  // FRONT FACE of that mesh — not a separate sticker plane floating on a board.
  createDigitalProduct(product, fitted) {
    const group = new THREE.Group();
    const thickness = 0.012;
    const sheet = new THREE.MeshStandardMaterial({ color: 0x0a0908, roughness: 0.6, metalness: 0.02 });
    const printFace = new THREE.MeshBasicMaterial({
      map: this.loadTexture(product.image),
      color: 0xd8d0c5,
      toneMapped: false,
    });
    // BoxGeometry material order: +x, -x, +y, -y, +z (front), -z — print goes on the front face only.
    const poster = new THREE.Mesh(
      new THREE.BoxGeometry(fitted.width, fitted.height, thickness),
      [sheet, sheet, sheet, sheet, printFace, sheet],
    );
    poster.position.z = thickness / 2;
    poster.castShadow = true;
    poster.receiveShadow = true;
    group.add(poster);

    // Gold corner standoff pins, as in the approved render target.
    const pinMaterial = this.materials.wallTextGold;
    const px = fitted.width / 2 - 0.035;
    const py = fitted.height / 2 - 0.035;
    [[-px, py], [px, py], [-px, -py], [px, -py]].forEach(([x, y]) => {
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.014, 12), pinMaterial);
      pin.rotation.x = Math.PI / 2;
      pin.position.set(x, y, thickness + 0.006);
      group.add(pin);
    });
    return group;
  }

  createLayeredProduct(product, bounds) {
    const group = new THREE.Group();
    const placeholder = this.createProceduralLayerStack(product, bounds);
    group.add(placeholder);

    if (!product.layers?.length) return group;
    const cachedLayers = product.layers.map((path) => this.svgResolvedCache.get(path));
    if (cachedLayers.every(Boolean)) {
      group.remove(placeholder);
      disposeObject3D(placeholder);
      group.add(this.createLayeredSvgStack(product, bounds, cachedLayers));
      return group;
    }
    Promise.all(product.layers.map((path) => this.loadSvgText(path)))
      .then((svgTexts) => {
        const model = this.createLayeredSvgStack(product, bounds, svgTexts);
        group.remove(placeholder);
        disposeObject3D(placeholder);
        group.add(model);
      })
      .catch((error) => {
        console.warn(`[BA] Could not build SVG layer stack for ${product.name}`, error);
      });
    return group;
  }

  createLayeredSvgStack(product, bounds, svgTexts) {
    const content = new THREE.Group();
    const targetWidth = bounds.width * (bounds.big ? 0.9 : 0.84);
    const targetHeight = bounds.height * (bounds.big ? 0.92 : 0.84);
    const layerDepth = bounds.homeDark ? (bounds.big ? 0.042 : 0.024) : bounds.big ? 0.026 : 0.016;
    const layerGap = bounds.homeDark ? (bounds.big ? 0.058 : 0.034) : bounds.big ? 0.036 : 0.023;
    // Blender wolf parity: BA_MAT_WOLF_1..4 = linear 0.02 -> 0.82 with the DARK detail layer in
    // FRONT and the LIGHT silhouette at the back (#272727 front -> #bcbcbc back). Mandala pieces
    // (incl. Eclipse Mandala) take the warm gold base instead of grey.
    const isMandala = product.id.includes("mandala") || product.id.includes("eclipse");
    const back = new THREE.Color(bounds.homeDark ? (isMandala ? 0x3d2c17 : 0x211f1d) : isMandala ? 0xb6a271 : 0xbcbcbc);
    const front = new THREE.Color(bounds.homeDark ? (isMandala ? 0x0d0a06 : 0x0b0a09) : 0x272727);

    // Detect the solid full-canvas backing sheet (a plain rectangle = very few path commands)
    // and force it to the BACK whatever its file index — otherwise a mid/front backing sheet
    // (e.g. Motorcycle layer-04) sits in front of and hides the detail cuts.
    const commandCount = (svg) => (svg.match(/[MLHVCSQTAZ]/gi) || []).length;
    let backIndex = -1;
    let minCommands = Infinity;
    svgTexts.forEach((svg, i) => {
      const c = commandCount(svg);
      if (c < minCommands) {
        minCommands = c;
        backIndex = i;
      }
    });
    const hasBacking = minCommands <= 10;
    const detailOrder = svgTexts.map((_, i) => i).filter((i) => !(hasBacking && i === backIndex));
    if (product.frontLayerFirst) detailOrder.reverse();
    const depthOf = new Array(svgTexts.length);
    if (hasBacking) depthOf[backIndex] = 0;
    detailOrder.forEach((idx, step) => {
      depthOf[idx] = (hasBacking ? 1 : 0) + step;
    });
    const maxDepth = Math.max(1, svgTexts.length - 1);

    svgTexts.forEach((svgText, layerIndex) => {
      if (bounds.homeDark && isMandala && hasBacking && layerIndex === backIndex) return;
      const parsed = this.svgLoader.parse(svgText);
      const depthIndex = depthOf[layerIndex];
      const tint = depthIndex / maxDepth;
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color().lerpColors(back, front, tint),
        roughness: bounds.homeDark ? 0.4 : 0.52,
        metalness: bounds.homeDark ? 0.12 : 0.05,
        side: THREE.DoubleSide,
      });

      parsed.paths.forEach((svgPath) => {
        SVGLoader.createShapes(svgPath).forEach((shape) => {
          const mesh = new THREE.Mesh(
            new THREE.ExtrudeGeometry(shape, {
              depth: layerDepth,
              bevelEnabled: true,
              bevelThickness: layerDepth * 0.08,
              bevelSize: layerDepth * 0.05,
              bevelSegments: 1,
            }),
            material,
          );
          mesh.position.z = depthIndex * layerGap;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          content.add(mesh);
        });
      });
    });

    const box = new THREE.Box3().setFromObject(content);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    if (!Number.isFinite(size.x) || !Number.isFinite(size.y) || size.x === 0 || size.y === 0) {
      return this.createProceduralLayerStack(product, bounds);
    }

    content.children.forEach((child) => {
      child.position.x -= center.x;
      child.position.y -= center.y;
    });
    const scale = Math.min(targetWidth / size.x, targetHeight / size.y);
    content.scale.set(scale, -scale, 1);
    content.position.z = -layerDepth * 0.5;
    return content;
  }

  createProceduralLayerStack(product, bounds) {
    const group = new THREE.Group();
    const materialSteps = [0x100f0d, 0x27231e, 0x4c453c, 0x736a5c, 0x9b907f];
    const scale = bounds.big ? 1 : 0.62;
    const shapes = product.id.includes("mandala") ? 7 : product.id.includes("bear") ? 5 : 6;
    for (let i = 0; i < 5; i += 1) {
      const mat = new THREE.MeshStandardMaterial({ color: materialSteps[i], roughness: 0.62, metalness: 0.04 });
      const ring = product.id.includes("mandala")
        ? new THREE.TorusGeometry(0.34 - i * 0.035, 0.015, 8, 54)
        : new THREE.TorusKnotGeometry(0.22 - i * 0.012, 0.012, 76, 6);
      const mesh = new THREE.Mesh(ring, mat);
      mesh.scale.set(scale, scale, 0.16);
      mesh.position.z = i * 0.026;
      mesh.rotation.z = (i * Math.PI) / shapes;
      group.add(mesh);
    }
    return group;
  }

  loadSvgText(path) {
    if (!this.svgTextCache.has(path)) {
      this.svgTextCache.set(
        path,
        fetch(path)
          .then((response) => {
            if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
            return response.text();
          })
          .then((svgText) => {
            this.svgResolvedCache.set(path, svgText);
            return svgText;
          }),
      );
    }
    return this.svgTextCache.get(path);
  }

  createWallArtProduct(product, bounds) {
    const targetWidth = bounds.width * (bounds.big ? 0.88 : 0.82);
    const targetHeight = bounds.height * (bounds.big ? 0.9 : 0.84);
    const depth = bounds.big ? 0.078 : 0.048;
    // BA_MAT_BLACK_WOOD: linear (0.03, 0.025, 0.022) -> #302c29, rough 0.55.
    const material = new THREE.MeshStandardMaterial({
      color: bounds.homeDark ? 0x090807 : 0x302c29,
      roughness: bounds.homeDark ? 0.42 : 0.55,
      metalness: bounds.homeDark ? 0.12 : 0,
      side: THREE.DoubleSide,
    });
    const group = new THREE.Group();
    group.userData.svgPath = product.image;

    const fallback = new THREE.Mesh(new THREE.BoxGeometry(targetWidth * 0.78, targetHeight * 0.78, depth), material);
    fallback.castShadow = true;
    fallback.receiveShadow = true;
    group.add(fallback);

    const buildSvg = (svgText) => {
        const data = this.svgLoader.parse(svgText);
        const content = new THREE.Group();

        data.paths.forEach((svgPath) => {
          SVGLoader.createShapes(svgPath).forEach((shape) => {
            const mesh = new THREE.Mesh(
              new THREE.ExtrudeGeometry(shape, {
                depth,
                bevelEnabled: true,
                bevelThickness: depth * 0.08,
                bevelSize: depth * 0.05,
                bevelSegments: 1,
              }),
              material,
            );
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            content.add(mesh);
          });
        });

        const box = new THREE.Box3().setFromObject(content);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        if (!Number.isFinite(size.x) || !Number.isFinite(size.y) || size.x === 0 || size.y === 0) return;

        content.children.forEach((child) => {
          child.position.x -= center.x;
          child.position.y -= center.y;
        });
        const scale = Math.min(targetWidth / size.x, targetHeight / size.y);
        content.scale.set(scale, -scale, 1);
        content.position.z = -depth * 0.5;

        group.remove(fallback);
        fallback.geometry.dispose();
        group.add(content);
    };

    const cachedSvg = this.svgResolvedCache.get(product.image);
    if (cachedSvg) {
      buildSvg(cachedSvg);
    } else {
      this.loadSvgText(product.image).then(buildSvg).catch((error) => {
        console.warn(`[BA] Could not build SVG mesh for ${product.image}`, error);
      });
    }

    return group;
  }

  createObjectProduct(product, bounds) {
    const fallback = this.createObjectFallback(product, bounds);
    // Every 3D Object display — hero, grid array, viewer — loads its real decimated STL (D38).
    // The procedural shapes are only a brief stand-in while the STL streams in; a `!bounds.big`
    // early-return here once left ALL array/collection bays as stand-ins (the "disappeared
    // meshes" regression) — never reintroduce it.
    if (!product.model) return fallback;

    const group = new THREE.Group();
    const cachedGeometry = this.stlResolvedCache.get(product.model);
    if (cachedGeometry) {
      disposeObject3D(fallback);
      group.add(this.createStlMesh(product, bounds, cachedGeometry));
      return group;
    }
    group.add(fallback);
    this.loadStlGeometry(product.model)
      .then((geometry) => {
        const model = this.createStlMesh(product, bounds, geometry);
        group.remove(fallback);
        disposeObject3D(fallback);
        group.add(model);
      })
      .catch((error) => {
        console.warn(`[BA] Could not load STL for ${product.name}`, error);
      });
    return group;
  }

  createObjectFallback(product, bounds) {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: bounds.homeDark ? 0x050403 : 0x080807, roughness: 0.4, metalness: 0.2 });
    const gold = new THREE.MeshStandardMaterial({ color: 0x8f6730, roughness: 0.5, metalness: 0.4 });
    // Small 3D previews stay conservative because procedural tails, legs, and bases project wider
    // when the category camera is angled.
    const scale = bounds.big ? 1.0 : 0.42;

    if (product.shape === "panther") {
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.62, 6, 18), mat);
      body.rotation.z = Math.PI / 2;
      body.position.set(-0.02, 0.02, 0);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 12), mat);
      head.scale.set(1.15, 0.82, 0.9);
      head.position.set(0.42, 0.08, 0);
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.028, 0.44, 12), mat);
      tail.rotation.z = Math.PI / 4;
      tail.position.set(-0.42, 0.14, 0);
      for (let i = 0; i < 4; i += 1) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.032, 0.24, 10), mat);
        leg.position.set(-0.22 + i * 0.15, -0.12, i % 2 ? 0.08 : -0.08);
        leg.rotation.z = i % 2 ? 0.18 : -0.18;
        group.add(leg);
      }
      group.add(body, head, tail);
    } else if (product.shape === "spinner") {
      const center = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 32), gold);
      center.rotation.x = Math.PI / 2;
      group.add(center);
      for (let i = 0; i < 3; i += 1) {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.08, 0.05), mat);
        arm.rotation.z = (Math.PI * 2 * i) / 3;
        group.add(arm);
      }
    } else if (product.shape === "lamp") {
      const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.22, 0.72, 32, 1, true), mat);
      shade.position.y = 0.15;
      const glow = new THREE.PointLight(0xffbf70, 1.8, 2.2);
      glow.position.y = 0.15;
      group.add(shade, glow);
    } else if (product.shape === "chain") {
      for (let i = 0; i < 7; i += 1) {
        const bead = new THREE.Mesh(new THREE.SphereGeometry(0.11, 18, 12), mat);
        bead.position.set((i - 3) * 0.13, Math.sin(i * 0.9) * 0.08, 0);
        group.add(bead);
      }
    } else if (product.shape === "superhero") {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.06, 24), mat);
      base.position.y = -0.32;
      const figure = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.52, 8, 16), mat);
      figure.position.y = 0.02;
      const cape = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.46, 4), gold);
      cape.rotation.z = Math.PI / 4;
      cape.position.set(-0.08, -0.02, -0.08);
      group.add(base, cape, figure);
    } else if (product.shape === "stand" || product.shape === "figure") {
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.08, 0.32), mat);
      base.position.y = -0.28;
      const figure = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.48, 6, 16), mat);
      figure.position.y = 0.08;
      group.add(base, figure);
    } else {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.18), mat);
      body.position.y = -0.04;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 12), mat);
      head.position.set(0.42, 0.07, 0);
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.42, 12), mat);
      tail.rotation.z = Math.PI / 4;
      tail.position.set(-0.43, 0.08, 0);
      group.add(body, head, tail);
    }

    group.scale.setScalar(scale);
    group.position.y = product.shape === "panther" ? -0.18 : -0.04;
    if (bounds.restY !== undefined) {
      // Match the STL placement contract: stand-in rests on the shelf top, never through it.
      const box = new THREE.Box3().setFromObject(group);
      if (Number.isFinite(box.min.y)) group.position.y += bounds.restY - box.min.y;
    }
    return group;
  }

  createStlMesh(product, bounds, sourceGeometry) {
    const geometry = sourceGeometry.clone();
    geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({
      color: bounds.homeDark ? 0x070605 : product.materialColor ?? 0x302c29,
      roughness: bounds.homeDark ? 0.38 : 0.5,
      metalness: bounds.homeDark ? 0.16 : 0.04,
    });
    const mesh = new THREE.Mesh(geometry, material);
    const rotation = product.modelRotation ?? [-Math.PI / 2, 0, 0];
    mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const wrapper = new THREE.Group();
    wrapper.add(mesh);
    wrapper.updateMatrixWorld(true);
    let box = new THREE.Box3().setFromObject(wrapper);
    let center = box.getCenter(new THREE.Vector3());
    mesh.position.sub(center);
    wrapper.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(wrapper);
    const size = box.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);
    const target = Math.min(bounds.width, bounds.height) * (product.modelFit ?? 0.72);
    const scale = maxDimension > 0 ? target / maxDimension : 1;
    wrapper.scale.setScalar(scale);
    if (bounds.restY !== undefined) {
      // Grid/array bays: rest the scaled mesh bottom exactly on the shelf top instead of
      // using the hero-tuned modelLift (which assumes the big-bay shelf geometry).
      wrapper.position.y = bounds.restY - box.min.y * scale;
    } else {
      wrapper.position.y = product.modelLift ?? -0.05;
    }
    return wrapper;
  }

  loadStlGeometry(path) {
    if (!this.stlCache.has(path)) {
      this.stlCache.set(
        path,
        new Promise((resolve, reject) => {
          this.stlLoader.load(
            path,
            (geometry) => {
              this.stlResolvedCache.set(path, geometry);
              resolve(geometry);
            },
            undefined,
            reject,
          );
        }),
      );
    }
    return this.stlCache.get(path);
  }

  // The real BA logo (D21). The SVG has a viewBox but no width/height, so TextureLoader
  // rasterizes it at zero size — rasterize explicitly through a canvas instead.
  createLogoPlane(width, height) {
    const material = new THREE.MeshStandardMaterial({
      transparent: true,
      alphaTest: 0.05,
      roughness: 0.5,
      metalness: 0.04,
      visible: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    fetch("/logo-blackaesthetics.svg")
      .then((response) => response.text())
      .then((svgText) => {
        const url = URL.createObjectURL(new Blob([svgText], { type: "image/svg+xml" }));
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 1024;
          canvas.height = 1024;
          canvas.getContext("2d").drawImage(img, 0, 0, 1024, 1024);
          URL.revokeObjectURL(url);
          const texture = new THREE.CanvasTexture(canvas);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = 8;
          material.map = texture;
          material.visible = true;
          material.needsUpdate = true;
        };
        img.src = url;
      })
      .catch((error) => console.warn("[BA] Logo SVG failed to rasterize", error));
    return mesh;
  }

  createImagePlane(path, width, height, { transparent = false, physical = false } = {}) {
    const texture = this.loadTexture(path);
    const material = physical
      ? new THREE.MeshPhysicalMaterial({
          map: texture,
          roughness: 0.18,
          metalness: 0.02,
          clearcoat: 0.85,
          clearcoatRoughness: 0.08,
          side: THREE.DoubleSide,
        })
      : new THREE.MeshStandardMaterial({
          map: texture,
          transparent,
          alphaTest: transparent ? 0.08 : 0,
          roughness: 0.62,
          metalness: 0.02,
          side: THREE.DoubleSide,
        });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    mesh.castShadow = true;
    return mesh;
  }

  createExtrudedText(text, size, depth, material) {
    const geometry = new TextGeometry(text, {
      font: WALL_FONT,
      size,
      height: depth,
      curveSegments: 2,
      bevelEnabled: false,
    });
    geometry.computeBoundingBox();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    return mesh;
  }

  loadTexture(path) {
    if (this.textureCache.has(path)) return this.textureCache.get(path);
    let texture;
    const readyPromise = new Promise((resolve, reject) => {
      texture = this.textureLoader.load(path, () => resolve(texture), undefined, reject);
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.userData.readyPromise = readyPromise;
    this.textureCache.set(path, texture);
    return texture;
  }

  createPlasterTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#c0aa89";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 1600; i += 1) {
      const alpha = Math.random() * 0.08;
      ctx.fillStyle = Math.random() > 0.5 ? `rgba(74,60,42,${alpha})` : `rgba(248,228,196,${alpha})`;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2 + 0.5, Math.random() * 2 + 0.5);
    }
    for (let i = 0; i < 520; i += 1) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const length = 5 + Math.random() * 22;
      ctx.strokeStyle = Math.random() > 0.45 ? "rgba(78,58,35,0.11)" : "rgba(255,237,205,0.12)";
      ctx.lineWidth = 0.7 + Math.random() * 1.4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + length * 0.45, y + (Math.random() - 0.5) * 8, x + length, y + (Math.random() - 0.5) * 5);
      ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(5, 1.5);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  createHomeWallFinishTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#80583b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 7200; i += 1) {
      const light = Math.random() > 0.48;
      const alpha = 0.035 + Math.random() * 0.11;
      ctx.fillStyle = light ? `rgba(245,215,174,${alpha})` : `rgba(57,35,22,${alpha})`;
      const size = 0.6 + Math.random() * 2.8;
      ctx.fillRect(Math.random() * 1024, Math.random() * 1024, size, size * (0.45 + Math.random()));
    }

    for (let i = 0; i < 900; i += 1) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const length = 7 + Math.random() * 36;
      ctx.strokeStyle = Math.random() > 0.52 ? "rgba(45,27,16,0.15)" : "rgba(255,228,188,0.13)";
      ctx.lineWidth = 0.7 + Math.random() * 2.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(
        x + length * 0.3,
        y + (Math.random() - 0.5) * 12,
        x + length * 0.72,
        y + (Math.random() - 0.5) * 12,
        x + length,
        y + (Math.random() - 0.5) * 8,
      );
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4.2, 1.55);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  createAshTexture() {
    // BA_MAT_ASH_WOOD_DARKGREY parity (rebuilt 2026-07-03): natural dark-grey ash —
    // ramp #3c3b38 -> #6a675f (Blender linear 0.045 -> 0.145), layered wavy streaks,
    // plank tone bands, sparse knots, fine grain. No regular sine pattern.
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#514f49";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Broad tonal bands (plank-to-plank variation), horizontal like the grain direction.
    for (let i = 0; i < 9; i += 1) {
      const y = Math.random() * canvas.height;
      const h = 14 + Math.random() * 42;
      const tone = Math.random();
      ctx.fillStyle = tone > 0.5 ? `rgba(106,103,95,${0.1 + tone * 0.14})` : `rgba(48,47,44,${0.12 + tone * 0.2})`;
      ctx.fillRect(0, y, canvas.width, h);
    }

    // Long irregular grain streaks — random walks, not sine waves.
    for (let i = 0; i < 150; i += 1) {
      const dark = Math.random() > 0.4;
      const alpha = 0.05 + Math.random() * 0.16;
      ctx.strokeStyle = dark ? `rgba(30,29,27,${alpha})` : `rgba(122,118,108,${alpha * 0.8})`;
      ctx.lineWidth = 0.5 + Math.random() * (dark ? 1.7 : 1.1);
      let y = Math.random() * canvas.height;
      let drift = (Math.random() - 0.5) * 0.6;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= canvas.width; x += 14 + Math.random() * 22) {
        drift += (Math.random() - 0.5) * 0.5;
        drift = Math.max(-1.1, Math.min(1.1, drift));
        y += drift * 3.2;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // A few subtle knots with grain compression around them.
    for (let i = 0; i < 4; i += 1) {
      const kx = 80 + Math.random() * (canvas.width - 160);
      const ky = 30 + Math.random() * (canvas.height - 60);
      const kr = 5 + Math.random() * 9;
      for (let ring = 4; ring >= 0; ring -= 1) {
        ctx.strokeStyle = `rgba(28,27,25,${0.1 + ring * 0.05})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.ellipse(kx, ky, kr + ring * 3.4, (kr + ring * 2.1) * 0.55, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(24,23,21,0.5)";
      ctx.beginPath();
      ctx.ellipse(kx, ky, kr * 0.6, kr * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fine pore speckle.
    for (let i = 0; i < 2200; i += 1) {
      const alpha = Math.random() * 0.07;
      ctx.fillStyle = Math.random() > 0.5 ? `rgba(20,19,18,${alpha})` : `rgba(130,126,116,${alpha})`;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1 + Math.random() * 2, 1);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  createFloorTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");

    const base = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    base.addColorStop(0, "#040403");
    base.addColorStop(0.38, "#11100d");
    base.addColorStop(0.72, "#060504");
    base.addColorStop(1, "#18130c");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 9000; i += 1) {
      const warm = Math.random() > 0.62;
      const alpha = 0.018 + Math.random() * 0.07;
      ctx.fillStyle = warm ? `rgba(101,78,38,${alpha})` : `rgba(205,198,178,${alpha * 0.45})`;
      const size = 0.8 + Math.random() * 3.8;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, size, size * (0.35 + Math.random() * 1.4));
    }

    const slabW = 320;
    const slabH = 320;
    ctx.strokeStyle = "rgba(231,184,81,0.14)";
    ctx.lineWidth = 1.2;
    for (let x = 0; x <= canvas.width; x += slabW) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += slabH) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(canvas.width, y + 0.5);
      ctx.stroke();
    }

    const drawVein = (gold = false) => {
      const startX = Math.random() * canvas.width;
      const startY = Math.random() * canvas.height;
      const length = (gold ? 95 : 120) + Math.random() * (gold ? 260 : 340);
      const angle = Math.random() * Math.PI * 2;
      const segments = 4 + Math.floor(Math.random() * 4);
      const points = [];
      for (let i = 0; i <= segments; i += 1) {
        const t = i / segments;
        points.push({
          x: startX + Math.cos(angle) * length * t + (Math.random() - 0.5) * 42,
          y: startY + Math.sin(angle) * length * t + (Math.random() - 0.5) * 42,
        });
      }

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = gold ? "rgba(235,174,48,0.28)" : "rgba(216,211,198,0.08)";
      ctx.lineWidth = gold ? 4.8 + Math.random() * 5.6 : 2.4 + Math.random() * 5.2;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach((point, index) => {
        const previous = points[index];
        ctx.quadraticCurveTo(
          (previous.x + point.x) / 2 + (Math.random() - 0.5) * 20,
          (previous.y + point.y) / 2 + (Math.random() - 0.5) * 20,
          point.x,
          point.y,
        );
      });
      ctx.stroke();

      ctx.strokeStyle = gold ? "rgba(255,220,118,0.9)" : "rgba(226,222,210,0.34)";
      ctx.lineWidth = gold ? 1.1 + Math.random() * 1.8 : 0.45 + Math.random() * 1.1;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
      ctx.stroke();

      if (Math.random() > (gold ? 0.55 : 0.42)) {
        const branchStart = points[1 + Math.floor(Math.random() * Math.max(1, points.length - 2))];
        const branchAngle = angle + (Math.random() > 0.5 ? 1 : -1) * (0.62 + Math.random() * 0.9);
        const branchLength = length * (0.18 + Math.random() * 0.22);
        ctx.strokeStyle = gold ? "rgba(255,214,107,0.68)" : "rgba(221,218,207,0.22)";
        ctx.lineWidth = gold ? 0.7 + Math.random() * 1.1 : 0.35 + Math.random() * 0.8;
        ctx.beginPath();
        ctx.moveTo(branchStart.x, branchStart.y);
        ctx.quadraticCurveTo(
          branchStart.x + Math.cos(branchAngle) * branchLength * 0.55 + (Math.random() - 0.5) * 18,
          branchStart.y + Math.sin(branchAngle) * branchLength * 0.55 + (Math.random() - 0.5) * 18,
          branchStart.x + Math.cos(branchAngle) * branchLength,
          branchStart.y + Math.sin(branchAngle) * branchLength,
        );
        ctx.stroke();
      }
    };

    for (let i = 0; i < 52; i += 1) drawVein(false);
    for (let i = 0; i < 38; i += 1) drawVein(true);

    for (let i = 0; i < 520; i += 1) {
      ctx.fillStyle = `rgba(255,218,104,${0.2 + Math.random() * 0.5})`;
      const r = 0.35 + Math.random() * 1.4;
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(7.2, 2.55);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  createLights() {
    // Dim ambient: the render's drama comes from warm pools against dark falloff, not fill.
    // FULLY LIT ROOM (D41): even, bright gallery illumination — no spotlights anywhere.
    const ambient = new THREE.HemisphereLight(0xffe6c8, 0x3a2c1c, 0.85);
    const coveWash = new THREE.RectAreaLight(LIGHT_COLOR, 3.2, 12, 1.9);
    coveWash.position.set(2.6, 3.25, 0.62);
    coveWash.lookAt(2.6, 2.08, 0.02);
    const front = new THREE.RectAreaLight(FRONT_FILL_COLOR, 3.4, 10, 2.5);
    front.position.set(-0.9, 2.6, 7.0);
    front.lookAt(-0.9, 1.5, 0);
    // Broad floor wash so the black marble keeps readable gold veining instead of falling flat.
    const floorWash = new THREE.RectAreaLight(FRONT_FILL_COLOR, 1.6, 14, 4);
    floorWash.position.set(2.6, 3.4, 3.2);
    floorWash.lookAt(2.6, 0, 3.1);
    this.scene.add(ambient, coveWash, front, floorWash);
  }

  createRowWash(position, target, intensity) {
    const light = new THREE.RectAreaLight(LIGHT_COLOR, intensity, 12, 0.5);
    light.position.copy(position);
    light.lookAt(target);
    return light;
  }

  createWallLightPool(x, y, width, height, opacity) {
    if (!this.lightPoolTexture) this.lightPoolTexture = this.createLightPoolTexture();
    const material = new THREE.MeshBasicMaterial({
      map: this.lightPoolTexture,
      color: 0xffd9a8,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    pool.position.set(x, y, 0.006);
    return pool;
  }

  createWallShadeMaterial() {
    const canvas = document.createElement("canvas");
    canvas.width = 8;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, "rgba(8,5,3,0.07)");
    gradient.addColorStop(0.15, "rgba(8,5,3,0)");
    gradient.addColorStop(0.85, "rgba(8,5,3,0)");
    gradient.addColorStop(1, "rgba(8,5,3,0.1)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
  }

  createLightPoolTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createRadialGradient(256, 230, 12, 256, 256, 255);
    gradient.addColorStop(0, "rgba(255,226,151,0.95)");
    gradient.addColorStop(0.38, "rgba(255,188,99,0.48)");
    gradient.addColorStop(0.75, "rgba(255,168,70,0.12)");
    gradient.addColorStop(1, "rgba(255,168,70,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  bindEvents() {
    window.addEventListener("resize", () => this.resize());
    this.canvas.addEventListener("pointerdown", (event) => {
      this.dragging = this.state?.mode === "viewer" || this.state?.mode === "category";
      this.dragStartX = event.clientX;
      this.dragLastX = event.clientX;
      this.dragMoved = false;
    });
    this.canvas.addEventListener("pointermove", (event) => {
      if (!this.dragging) {
        this.updateHover(event);
        return;
      }
      const delta = event.clientX - this.dragLastX;
      this.dragLastX = event.clientX;
      if (Math.abs(event.clientX - this.dragStartX) > 4) {
        this.dragMoved = true;
        if (this.state?.mode === "category") this.setCategoryFrontalCamera();
      }
      if (this.state?.mode === "viewer" && this.viewerProduct) {
        this.viewerOrbit = THREE.MathUtils.clamp(this.viewerOrbit + delta * 0.006, -1.25, 1.25);
      } else if (this.state?.mode === "category") {
        this.scrollCategoryTo(this.scrollOffset - delta * 0.012);
      }
      this.updateHover(event);
    });
    this.canvas.addEventListener("pointerleave", () => {
      this.hoveredEntry = null;
      this.setHoveredHomeZone(null);
      this.canvas.style.cursor = "";
    });
    this.canvas.addEventListener("pointerup", (event) => {
      if (this.dragging && this.dragMoved) {
        this.dragging = false;
        return;
      }
      this.dragging = false;
      this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hit = this.raycaster.intersectObjects(this.clickable, true).find((item) => item.object.userData.action);
      if (!hit) return;
      this.pendingSelectionBay = findTransitionAncestor(hit.object);
      const { action, categoryId, productId } = hit.object.userData;
      if (action === "category") this.onCategorySelect(categoryId);
      if (action === "subcollection") this.onSubcollectionSelect(hit.object.userData.subcollectionId);
      if (action === "product") this.onProductOpen(productId);
    });
    this.canvas.addEventListener(
      "wheel",
      (event) => {
        if (this.state?.mode !== "category") return;
        event.preventDefault();
        this.scrollCategoryTo(this.scrollOffset + event.deltaY * 0.003);
      },
      { passive: false },
    );
  }

  setCategoryCamera() {
    const isPortrait = this.camera.aspect < 0.78;
    const camera = this.categoryCameraIsFrontal
      ? isPortrait
        ? CATEGORY_MOBILE_FRONTAL_CAMERA
        : CATEGORY_FRONTAL_CAMERA
      : isPortrait
        ? CATEGORY_MOBILE_CAMERA
        : CATEGORY_CAMERA;
    const look = this.categoryCameraIsFrontal
      ? isPortrait
        ? CATEGORY_MOBILE_FRONTAL_LOOK
        : CATEGORY_FRONTAL_LOOK
      : isPortrait
        ? CATEGORY_MOBILE_LOOK
        : CATEGORY_LOOK;
    this.targetCamera.copy(camera);
    this.targetLook.copy(look);
  }

  setCategoryFrontalCamera() {
    if (this.categoryCameraIsFrontal) return;
    this.categoryCameraIsFrontal = true;
    this.setCategoryCamera();
  }

  updateHover(event) {
    if (this.state?.mode === "home" && this.homeZones) {
      this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hit = this.raycaster.intersectObjects(this.homeClickTargets, false)[0];
      const entry = hit ? this.homeZones.get(hit.object.userData.categoryId) ?? null : null;
      this.setHoveredHomeZone(entry);
      this.canvas.style.cursor = entry ? "pointer" : "";
      return;
    }
    this.setHoveredHomeZone(null);
    if (this.state?.mode !== "category" || !this.gridBays) {
      this.hoveredEntry = null;
      return;
    }
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const entries = [...this.gridBays.values()];
    const hittable = entries.filter((entry) => entry.edgeScale > 0.62).map((entry) => entry.hit);
    const hit = this.raycaster.intersectObjects(hittable, true)[0];
    this.hoveredEntry = hit ? entries.find((entry) => entry.hit === hit.object) ?? null : null;
    this.canvas.style.cursor = this.hoveredEntry ? "pointer" : "";
  }

  setHoveredHomeZone(entry) {
    if (entry === this.hoveredHomeZone) return;
    this.hoveredHomeZone = entry;
    if (entry) this.prepareCategory(entry.group.userData.categoryId);
    this.onCategoryPreview?.(entry?.group.userData.categoryId ?? null);
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.fov = width < 760 ? 43 : 33;
    this.camera.updateProjectionMatrix();
    // fov + aspect are final above — refit the home dolly so the wall never clips at narrow
    // landscape aspects. Boot (no state yet) starts on home framing; category/viewer stay put.
    if (!this.state || this.state.mode === "home" || this.state.mode === "intro") {
      this.targetCamera.x = homeCameraX(this.camera.aspect);
      this.targetCamera.z = homeCameraZ(this.camera.aspect, THREE.MathUtils.degToRad(this.camera.fov));
      this.targetLook.x = this.targetCamera.x;
      this.setIntroLayout();
      this.setHoveredHomeZone(null);
      this.canvas.style.cursor = "";
    } else if (this.state.mode === "category") {
      this.setCategoryCamera();
      this.updateCategoryGrid();
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = Math.min(this.clock.getDelta(), 0.04);
    if (this.transition) this.updateTransition(delta);
    else {
      const cameraEase = 1 - Math.exp(-delta * 3.1);
      const lookEase = 1 - Math.exp(-delta * 3.6);
      this.camera.position.lerp(this.targetCamera, cameraEase);
      this.look.lerp(this.targetLook, lookEase);
    }
    if (this.viewerProduct) this.viewerProduct.rotation.y += (this.viewerOrbit - this.viewerProduct.rotation.y) * 0.12;
    if (this.homeZones) {
      this.homeZones.forEach((entry) => {
        const active = entry === this.hoveredHomeZone && this.state?.mode === "home" && !this.transition;
        const revealScale = smooth01(entry.revealProgress ?? 1);
        const targetScale = revealScale * (active ? 1.065 : 1);
        const targetZ = active ? 0.2 : 0;
        entry.group.visible = revealScale > 0.01;
        entry.group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.14);
        entry.group.position.z += (targetZ - entry.group.position.z) * 0.16;
      });
    }
    if (this.gridBays) {
      this.gridBays.forEach((entry) => {
        const edgeScale = entry.edgeScale ?? 1;
        const active = edgeScale > 0.72 && entry === this.hoveredEntry;
        const revealScale = smooth01(entry.revealProgress ?? 1);
        const targetBayScale = edgeScale * revealScale;
        const targetProductScale = entry.productBaseScale.clone().multiplyScalar(active ? 1.12 : 1);
        const targetProductZ = entry.productBaseZ + (active ? 0.16 : 0);
        entry.bay.visible = edgeScale > 0.035 || entry.bay.scale.x > 0.04;
        entry.bay.scale.lerp(new THREE.Vector3(targetBayScale, targetBayScale, targetBayScale), 0.18);
        entry.bay.position.z += (0 - entry.bay.position.z) * 0.18;
        entry.productDisplay.scale.lerp(targetProductScale, 0.2);
        entry.productDisplay.position.z += (targetProductZ - entry.productDisplay.position.z) * 0.2;
        if (entry.hoverGlow) entry.hoverGlow.visible = active;
      });
    }
    this.camera.lookAt(this.look);
    this.renderer.render(this.scene, this.camera);
  }

  updateTransition(delta) {
    const transition = this.transition;
    transition.elapsed = Math.max(transition.elapsed + delta, (performance.now() - transition.startedAt) / 1000);
    const elapsed = transition.elapsed;

    transition.outgoingItems.forEach(({ object, index, scale, position, isBay }) => {
      const settle = smooth01((elapsed - index * 0.012) / 0.34);
      object.scale.copy(scale).multiplyScalar(1 - settle * (isBay ? 0.18 : 0.08));
      object.position.copy(position);
      if (isBay) object.position.z -= settle * 0.18;
      object.visible = settle < 0.98;
    });

    if (transition.source && transition.sourceStart && transition.sourceEnd) {
      const move = smooth01((elapsed - 0.18) / 0.67);
      const detach = smooth01(elapsed / 0.18) * (1 - move);
      transition.source.position.lerpVectors(transition.sourceStart, transition.sourceEnd, move);
      transition.source.position.z += detach * 0.22 + Math.sin(move * Math.PI) * 0.2;
      transition.source.scale.lerpVectors(transition.sourceStartScale, transition.sourceEndScale, move);
      transition.source.visible = this.state?.mode === "category" ? elapsed < transition.duration - 0.08 : elapsed < 0.9;
    }

    if (transition.destinationBay) {
      const reveal = smooth01((elapsed - 0.82) / 0.34);
      transition.destinationBay.visible = reveal > 0;
      transition.destinationBay.scale.setScalar(Math.max(0.001, 0.9 + reveal * 0.1));
    }

    if (transition.destinationProduct) {
      transition.destinationProduct.visible = this.state?.mode === "category" ? elapsed >= transition.duration - 0.08 : elapsed >= 0.9;
    }

    if (this.state?.mode === "category" && this.categoryDescription) {
      const glyphs = this.categoryDescription.userData.revealGlyphs ?? [];
      const interval = Math.min(0.012, 0.85 / Math.max(1, glyphs.length));
      glyphs.forEach((glyph, index) => {
        const reveal = smooth01((elapsed - 1.02 - index * interval) / 0.12);
        glyph.visible = reveal > 0;
        glyph.scale.copy(glyph.userData.revealBaseScale).multiplyScalar(0.78 + reveal * 0.22);
        glyph.position.copy(glyph.userData.revealBasePosition);
        glyph.position.z += (1 - reveal) * 0.055;
      });
      const dividerAt = 1.02 + this.categoryDescription.userData.titleGlyphCount * interval + 0.08;
      if (this.categoryDescription.userData.revealDivider) {
        this.categoryDescription.userData.revealDivider.visible = elapsed >= dividerAt;
      }
    }

    const cameraProgress = smooth01((elapsed - 0.86) / 0.72);
    this.camera.position.lerpVectors(transition.cameraStart, transition.cameraEnd, cameraProgress);
    this.look.lerpVectors(transition.lookStart, transition.lookEnd, cameraProgress);

    if (this.state?.mode === "category" && this.gridBays) {
      this.gridBays.forEach((entry) => {
        entry.revealProgress = THREE.MathUtils.clamp((elapsed - 2.0 - entry.revealIndex * 0.045) / 0.25, 0, 1);
      });
    }

    if (this.state?.mode === "home" && this.homeZones) {
      this.homeZones.forEach((entry) => {
        entry.revealProgress = THREE.MathUtils.clamp((elapsed - 0.34 - entry.revealIndex * 0.14) / 0.34, 0, 1);
      });
    }

    if (elapsed >= transition.duration) {
      this.camera.position.copy(transition.cameraEnd);
      this.look.copy(transition.lookEnd);
      this.finishTransition();
      if (this.state?.mode === "home") this.clickable = [...this.homeClickTargets];
      if (this.state?.mode === "category") this.updateCategoryGrid();
    }
  }

  clearGroup(group) {
    while (group.children.length) {
      group.remove(group.children[0]);
    }
  }
}

function fit(maxWidth, maxHeight, aspect) {
  if (aspect >= maxWidth / maxHeight) {
    return { width: maxWidth, height: maxWidth / aspect };
  }
  return { width: maxHeight * aspect, height: maxHeight };
}

function disposeObject3D(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((material) => material.dispose());
      } else {
        child.material.dispose();
      }
    }
  });
}

function centerGeometry(geometry) {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  const x = (box.min.x + box.max.x) / 2;
  const y = (box.min.y + box.max.y) / 2;
  geometry.translate(-x, -y, 0);
  geometry.computeBoundingBox();
}

function smooth01(value) {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function gridEdgeScale(visibleX, rightEdge) {
  const leftScale = smooth01((visibleX - HERO_GRID_VANISH_X) / Math.max(0.001, GRID_EDGE_SCALE_DISTANCE));
  const rightScale = smooth01((rightEdge - visibleX) / GRID_EDGE_SCALE_DISTANCE);
  return Math.max(0.01, Math.min(leftScale, rightScale));
}

function findTransitionAncestor(object) {
  let current = object;
  while (current) {
    if (current.userData?.isBayPrefab || current.userData?.isHomeZone) return current;
    current = current.parent;
  }
  return null;
}

function wrapText(text, maxChars) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function splitShelfLabel(text, maxChars) {
  const clean = String(text).replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const words = clean.split(" ");
  if (words.length === 1 || clean.length <= maxChars) return [clean];

  let best = [clean];
  let bestScore = Infinity;
  for (let i = 1; i < words.length; i += 1) {
    const first = words.slice(0, i).join(" ");
    const second = words.slice(i).join(" ");
    const score = Math.max(first.length, second.length) + Math.abs(first.length - second.length) * 0.35;
    if (score < bestScore) {
      best = [first, second];
      bestScore = score;
    }
  }
  return best;
}
