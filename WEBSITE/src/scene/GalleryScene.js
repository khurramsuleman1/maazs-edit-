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
// Portrait cameras hug the D57 tall wall while using the device's real aspect ratio.
// FOV 43° keeps the product readable against the full-height wall without letterboxing.
const CATEGORY_MOBILE_CAMERA = new THREE.Vector3(0.9, 1.66, 4.7);
const CATEGORY_MOBILE_LOOK = new THREE.Vector3(0.9, 1.66, 0);
const CATEGORY_MOBILE_FRONTAL_CAMERA = new THREE.Vector3(0.9, 1.66, 4.7);
const CATEGORY_MOBILE_FRONTAL_LOOK = new THREE.Vector3(0.9, 1.66, 0);
const VIEWER_CAMERA = new THREE.Vector3(0, 1.78, 6.55);
const VIEWER_LOOK = new THREE.Vector3(0, 1.72, 0);
// D68: a selected mobile product is already centered in the final-product ring. The viewer
// inherits that exact camera/look instead of moving the product and then chasing it with camera.
const VIEWER_MOBILE_CAMERA = new THREE.Vector3(0.9, 1.66, 4.7);
const VIEWER_MOBILE_LOOK = new THREE.Vector3(0.9, 1.66, 0);
const MOBILE_PREVIEW_ASPECT = 390 / 844;
const MOBILE_BREAKPOINT = 760;
const MOBILE_HOME_CAMERA_Z = 4.35;
const MOBILE_HOME_Y = 1.5;

// Content spans the full logo and shelf composition with a little room for hover lift.
const HOME_HALF_W = 4.6;
const HOME_HALF_H = 1.58;

// Home dolly distance from the wall plane (z = 0) so the logo AND all four bays fit with a
// 5% margin at any landscape aspect — narrow landscape (16:10, 4:3) pulls back, ultra-wide
// eases in. Portrait does NOT force-fit the desktop composition (everything would go tiny),
// so it uses its dedicated vertical layout. Camera x/y and look stay locked.
function homeCameraZ(aspect, fovYRad) {
  if (aspect < 0.78) return MOBILE_HOME_CAMERA_Z;
  const halfTan = Math.tan(fovYRad / 2);
  const fitH = HOME_HALF_H / halfTan; // distance covering the vertical extent
  const fitW = HOME_HALF_W / (halfTan * aspect); // distance covering the horizontal extent
  const d = Math.max(fitH, fitW) * 1.05;
  return aspect >= 1.2 ? THREE.MathUtils.clamp(d, 9.4, 13.5) : THREE.MathUtils.clamp(d, 9.4, 10.5);
}

function homeCameraX(aspect) {
  return aspect < 0.78 ? -4 : HOME_CAMERA.x;
}

function homeCameraY(aspect) {
  return aspect < 0.78 ? MOBILE_HOME_Y : HOME_CAMERA.y;
}

function homeLookY(aspect) {
  return aspect < 0.78 ? MOBILE_HOME_Y : HOME_LOOK.y;
}

const SMALL_GRID = {
  startX: -0.4,
  stepX: 1.36,
  rowY: [2.47, 1.0],
};
// Portrait category products orbit through a shallow horizontal ring. The centred item is
// nearest the viewer; neighbours arc backwards, shrink, and rotate to preserve depth/readability.
const MOBILE_COLLECTION_RING = {
  ring: true,
  centerX: 0.9,
  centerY: 0.74,
  step: 1,
  angleStep: 0.72,
  radiusX: 1.12,
  radiusZ: 0.34,
  visibleSlots: 2.45,
  labelYPercent: 85.8,
  mountWidth: 1.02,
  mountHeight: 1.08,
  flatDisplayWidth: 0.76,
  flatDisplayHeight: 0.84,
  objectDisplayWidth: 0.68,
  objectDisplayHeight: 0.64,
};
// D62: once mobile browsing reaches actual products, the separate category hero is removed.
// The active ring item takes over the visual centre at a substantially larger display size.
const MOBILE_PRODUCT_RING = {
  ...MOBILE_COLLECTION_RING,
  productArray: true,
  centerY: 1.62,
  angleStep: 0.68,
  radiusX: 1.55,
  radiusZ: 0.42,
  visibleSlots: 1.45,
  scaleFalloff: 0.42,
  minScale: 0.3,
  // The active plaque sits under the centred product; arrows flank the product itself.
  labelYPercent: 70.5,
  mountWidth: 1.42,
  mountHeight: 1.5,
  flatDisplayWidth: 1.1,
  flatDisplayHeight: 1.24,
  objectDisplayWidth: 0.98,
  objectDisplayHeight: 0.96,
};
const HERO_BAY_RIGHT_WALL_X = -1.39;
const SMALL_BAY_HALF_WIDTH = 0.48;
const HERO_GRID_VANISH_X = HERO_BAY_RIGHT_WALL_X + SMALL_BAY_HALF_WIDTH + 0.08;
const HERO_GRID_FULL_X = SMALL_GRID.startX - 0.12;
const GRID_EDGE_SCALE_DISTANCE = HERO_GRID_FULL_X - HERO_GRID_VANISH_X;

// Blender parity: all colors below are the linear values from BAstore.blend converted to sRGB.
// Warm key (1, 0.72, 0.45) linear -> #ffddb3. Never eyeball these — recompute from the .blend.
const LIGHT_COLOR = 0xffddb3;
const FRONT_FILL_COLOR = 0xffeacb;
const ABSOLUTE_PRODUCT_BLACK = 0x000000;
const PRODUCT_WALL_CLEARANCE = 0.045;
const VIEWER_WALL_CLEARANCE = 0.08;
const PRODUCT_LATCH_DISTANCE = 0.82;
const LAYER_ASSEMBLE_LATCH_DISTANCE = 0.58;
const LAYER_ASSEMBLE_INTERVAL = 0.22;
const LAYER_ASSEMBLE_DURATION = 0.58;
const LAYER_EXPAND_GAP = 0.075;
const HOME_GALLERY_REVEAL_START = 1.24;
// One complete beat per section: piece lands (0.46s), its UI appears (0.42s), then the
// next section may start. The small final gap prevents two sections reading as one spawn.
const HOME_GALLERY_REVEAL_INTERVAL = 0.98;
const HOME_GALLERY_REVEAL_DURATION = 0.46;

// On-demand rendering thresholds. Below these deltas an eased value is treated as settled,
// letting the render loop stop drawing until the next real change (transition, input, or a
// resolved async asset). CAMERA_SETTLE_EPS is compared against squared distances.
const CAMERA_SETTLE_EPS = 1e-6;
const EASE_SETTLE_EPS = 1e-4;

const WALL_FONT = new FontLoader().parse(fontData);
RectAreaLightUniformsLib.init();

export class GalleryScene {
  constructor({ canvas, categories, onCategorySelect, onSubcollectionSelect, onProductSelect, onProductOpen, onCategoryPreview, onInteractionLock, onMobileLaneChange }) {
    this.canvas = canvas;
    this.categories = categories;
    this.onCategorySelect = onCategorySelect;
    this.onSubcollectionSelect = onSubcollectionSelect;
    this.onProductSelect = onProductSelect;
    this.onProductOpen = onProductOpen;
    this.onCategoryPreview = onCategoryPreview;
    this.onInteractionLock = onInteractionLock;
    this.onMobileLaneChange = onMobileLaneChange;
    this.textureLoader = new THREE.TextureLoader();
    this.svgLoader = new SVGLoader();
    this.stlLoader = new STLLoader();
    this.textureCache = new Map();
    this.svgTextCache = new Map();
    this.svgResolvedCache = new Map();
    this.stlCache = new Map();
    this.stlResolvedCache = new Map();
    this.categoryPreparationCache = new Map();
    this.textGeometryCache = new Map();
    this.assetPrewarmQueue = [];
    this.assetPrewarmStarted = false;
    this.idleTaskQueue = [];
    this.idleTaskScheduled = false;
    this.lightPoolTexture = null;
    this.clickable = [];
    this.pointer = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.clock = new THREE.Clock();
    // On-demand rendering state: draw only when something changed. Seeded true for the first frame.
    this.needsRender = true;
    this.renderCount = 0;
    this.targetCamera = HOME_CAMERA.clone();
    this.targetLook = HOME_LOOK.clone();
    this.look = HOME_LOOK.clone();
    this.scrollOffset = 0;
    this.maxScroll = 0;
    this.lastSignature = "";
    this.dragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragLastX = 0;
    this.dragLastY = 0;
    this.dragMoved = false;
    this.viewerOrbit = 0;
    this.hoveredEntry = null;
    this.hoveredHomeZone = null;
    this.pendingHoverPoint = null;
    this.hoverFramePending = false;
    this.gridTrack = null;
    this.pendingGridBuilds = new Map();
    this.gridBuildScheduled = false;
    this.gridBuildTimer = null;
    this.gridRevealCounter = 0;
    this.transition = null;
    this.pendingSelectionBay = null;
    this.categoryCameraIsFrontal = false;
    this.layerStackAnimations = new Set();
    this.layersExpanded = false;
    // Start responsive; the header toggle can then explicitly force either layout.
    this.previewMode = "auto";
    this.mobileLayout = false;
    this.renderViewport = null;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02;
    // Shadows are intentionally OFF: no light in the scene sets castShadow (the key lights are
    // Hemisphere/RectArea/Directional-without-shadows), so enabling the shadow map produced no
    // shadows while still compiling shadow-sampling code into every material. The mesh
    // castShadow/receiveShadow flags are kept, harmless while disabled, ready if a shadow-casting
    // light is ever approved in Blender.
    this.renderer.shadowMap.enabled = false;
    // Cap anisotropic filtering to the GPU max; applied per texture (lower on phones, see loadTexture).
    this.maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x120d09);
    this.scene.fog = new THREE.Fog(0x120d09, 10.5, 25);

    this.camera = new THREE.PerspectiveCamera(33, 1, 0.1, 100);
    this.camera.position.copy(HOME_CAMERA);

    this.materials = this.createMaterials();
    this.architecture = new THREE.Group();
    this.logoGroup = new THREE.Group();
    this.introGroup = new THREE.Group();
    this.homeGroup = new THREE.Group();
    this.categoryGroup = new THREE.Group();
    this.viewerGroup = new THREE.Group();
    this.transitionGroup = new THREE.Group();

    this.scene.add(this.architecture, this.logoGroup, this.introGroup, this.homeGroup, this.categoryGroup, this.viewerGroup, this.transitionGroup);
    this.createArchitecture();
    this.createMobileStage();
    this.createIntro();
    this.createHome();
    this.createLights();
    this.bindEvents();
    this.resize();
    this.animate();
    this.scheduleAssetPrewarm();
  }

  setState(state) {
    const signature = `${state.mode}:${state.activeCategoryId}:${state.activeSubcollectionId ?? "all"}:${state.activeProductId}`;
    if (signature === this.lastSignature) return;
    this.finishTransition();
    const previousState = this.state ? { ...this.state } : null;
    const sourceBay = this.pendingSelectionBay ?? this.findTransitionSource(previousState, state);
    const sourceProduct = this.findTransitionProduct(sourceBay);
    const destinationProductId = this.transitionDestinationProductId(state);
    const sourceProductId = sourceProduct?.userData?.productId;
    // Matching products have one owner throughout the handoff. Detach the real display object,
    // leave only an invisible transform anchor behind, and reparent that same object at the end.
    const source = sourceProduct && sourceProductId && sourceProductId === destinationProductId
      ? this.detachTransitionProduct(sourceProduct)
      : null;
    // Heavy scenes clear around the selected hero instead of cloning whole grids/walls.
    // The detached source is absent from this outgoing snapshot, so it cannot appear twice.
    const introToHome = previousState?.mode === "intro" && state.mode === "home";
    const outgoingClone =
      previousState && !introToHome
        ? this.cloneInWorld(this.activeGroup(previousState.mode))
        : null;
    this.pendingSelectionBay = null;
    this.lastSignature = signature;
    this.state = { ...state };

    this.introGroup.visible = state.mode === "intro";
    this.homeGroup.visible = state.mode === "home";
    this.categoryGroup.visible = state.mode === "category";
    this.viewerGroup.visible = state.mode === "viewer";
    // D55: the wall logo and 3D intro text are desktop-only — mobile branding is DOM UI.
    this.logoGroup.visible = (state.mode === "intro" || state.mode === "home") && !this.isMobileLayout();

    if (state.mode === "intro") {
      this.clickable = [];
      this.targetCamera.copy(HOME_CAMERA);
      this.targetCamera.x = this.isMobileLayout() ? -4 : homeCameraX(this.camera.aspect);
      this.targetCamera.y = this.isMobileLayout() ? MOBILE_HOME_Y : homeCameraY(this.camera.aspect);
      this.targetCamera.z = this.isMobileLayout()
        ? MOBILE_HOME_CAMERA_Z
        : homeCameraZ(this.camera.aspect, THREE.MathUtils.degToRad(this.camera.fov));
      this.targetLook.copy(HOME_LOOK);
      this.targetLook.x = this.targetCamera.x;
      this.targetLook.y = this.isMobileLayout() ? MOBILE_HOME_Y : homeLookY(this.camera.aspect);
      this.applyHomeLayout();
      this.setIntroLayout();
      this.resetHomeGalleryReveal();
      this.startTransition(previousState, outgoingClone, null, null, null);
      return;
    }

    if (state.mode === "home") {
      this.clickable = [...this.homeClickTargets];
      this.targetCamera.copy(HOME_CAMERA);
      this.targetCamera.x = this.isMobileLayout() ? -4 : homeCameraX(this.camera.aspect);
      this.targetCamera.y = this.isMobileLayout() ? MOBILE_HOME_Y : homeCameraY(this.camera.aspect);
      // Re-entering home: refit the dolly for the live viewport so logo + bays frame fully.
      this.targetCamera.z = this.isMobileLayout()
        ? MOBILE_HOME_CAMERA_Z
        : homeCameraZ(this.camera.aspect, THREE.MathUtils.degToRad(this.camera.fov));
      this.targetLook.copy(HOME_LOOK);
      this.targetLook.x = this.targetCamera.x;
      this.targetLook.y = this.isMobileLayout() ? MOBILE_HOME_Y : homeLookY(this.camera.aspect);
      this.applyHomeLayout();
      if (previousState?.mode === "intro") {
        this.introGroup.visible = true;
        this.prepareHomeGalleryReveal();
      } else {
        this.setLogoPlacement(this.galleryLogoPlacement());
        this.completeHomeGalleryReveal();
      }
      this.startTransition(
        previousState,
        outgoingClone,
        source,
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
      this.startTransition(previousState, outgoingClone, source, this.categoryBigBay, this.categoryBigProduct);
      return;
    }

    const { product, category } = getProduct(state.activeProductId);
    this.buildViewer(category, product);
    this.viewerOrbit = 0;
    this.targetCamera.copy(this.isMobileLayout() ? VIEWER_MOBILE_CAMERA : VIEWER_CAMERA);
    this.targetLook.copy(this.isMobileLayout() ? VIEWER_MOBILE_LOOK : VIEWER_LOOK);
    this.startTransition(previousState, outgoingClone, source, this.viewerBay, this.viewerProduct);
  }

  setPreviewMode(mode = "auto") {
    this.previewMode = ["mobile", "desktop"].includes(mode) ? mode : "auto";
    this.resize();
  }

  isMobileLayout() {
    if (this.previewMode === "mobile") return true;
    if (this.previewMode === "desktop") return false;
    return window.innerWidth <= MOBILE_BREAKPOINT;
  }

  isForcedMobilePreview() {
    return this.previewMode === "mobile" && window.innerWidth > MOBILE_BREAKPOINT;
  }

  mobilePreviewFrame(width, height) {
    const availableWidth = Math.max(1, width - 24);
    const availableHeight = Math.max(1, height - 24);
    const frameWidth = Math.min(availableWidth, availableHeight * MOBILE_PREVIEW_ASPECT);
    const frameHeight = frameWidth / MOBILE_PREVIEW_ASPECT;
    return {
      left: (width - frameWidth) / 2,
      top: (height - frameHeight) / 2,
      width: frameWidth,
      height: frameHeight,
    };
  }

  eventToPointer(event) {
    const rect = this.canvas.getBoundingClientRect();
    const viewport = this.renderViewport ?? { left: 0, top: 0, width: rect.width, height: rect.height };
    const x = event.clientX - rect.left - viewport.left;
    const y = event.clientY - rect.top - viewport.top;
    if (x < 0 || y < 0 || x > viewport.width || y > viewport.height) return false;
    this.pointer.x = (x / viewport.width) * 2 - 1;
    this.pointer.y = -(y / viewport.height) * 2 + 1;
    return true;
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
    clone.userData.usesSharedResources = true;
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

  transitionDestinationProductId(nextState) {
    if (!nextState || nextState.mode === "intro") return null;
    if (nextState.mode === "home") {
      return this.homeProducts?.get(nextState.activeCategoryId)?.userData?.productId ?? null;
    }
    return nextState.activeProductId ?? null;
  }

  transitionObjectSize(object) {
    if (object?.userData?.transitionWorldSize) return object.userData.transitionWorldSize.clone();
    return new THREE.Box3().setFromObject(object).getSize(new THREE.Vector3());
  }

  replaceProductReference(previous, replacement) {
    if (!previous || !replacement) return;
    this.homeProducts?.forEach((value, key) => {
      if (value === previous) this.homeProducts.set(key, replacement);
    });
    this.homeZones?.forEach((entry) => {
      entry.products?.forEach((item) => {
        if (item.object === previous) {
          item.object = replacement;
          item.baseScale = replacement.scale.clone();
          item.basePosition = replacement.position.clone();
        }
      });
    });
    this.homeGalleryRevealItems?.forEach((item) => {
      if (item.object === previous) item.object = replacement;
    });
    this.gridBays?.forEach((entry) => {
      if (entry.productDisplay === previous) {
        entry.productDisplay = replacement;
        entry.productBaseScale = replacement.scale.clone();
        entry.productBaseZ = replacement.position.z;
      }
    });
    if (this.categoryBigProduct === previous) this.categoryBigProduct = replacement;
    if (this.viewerProduct === previous) this.viewerProduct = replacement;
  }

  detachTransitionProduct(object) {
    if (!object?.parent) return null;
    object.updateWorldMatrix(true, true);
    const anchor = new THREE.Group();
    anchor.name = `transition-anchor:${object.userData.productId}`;
    anchor.position.copy(object.position);
    anchor.quaternion.copy(object.quaternion);
    anchor.scale.copy(object.scale);
    anchor.visible = false;
    anchor.userData = {
      transitionAnchor: true,
      transitionProduct: true,
      productId: object.userData.productId,
      transitionWorldSize: this.transitionObjectSize(object),
    };
    object.parent.add(anchor);
    this.replaceProductReference(object, anchor);
    object.userData.transitionReturnAnchor = anchor;
    this.transitionGroup.attach(object);
    object.visible = true;
    return object;
  }

  commitTransitionProduct(source, destinationProduct, preserveTransform = false) {
    const target = destinationProduct?.parent
      ? destinationProduct
      : source?.userData?.transitionReturnAnchor;
    if (!source || !target?.parent) return false;
    const parent = target.parent;
    const sourceSize = this.transitionObjectSize(source);
    const targetSize = this.transitionObjectSize(target);
    // SVG/STL placeholders can resolve while the object is travelling. Refit once at the
    // handoff boundary so the real reused geometry matches the destination's final footprint.
    const landingScaleCorrection = preserveTransform
      ? 1
      : THREE.MathUtils.clamp(
          Math.min(
            targetSize.x / Math.max(0.001, sourceSize.x),
            targetSize.y / Math.max(0.001, sourceSize.y),
          ),
          0.05,
          20,
        );
    source.scale.multiplyScalar(landingScaleCorrection);
    parent.attach(source);
    source.visible = true;
    source.userData.transitionProduct = true;
    source.userData.viewerProduct = Boolean(target.userData?.viewerProduct);
    delete source.userData.transitionReturnAnchor;
    this.replaceProductReference(target, source);
    parent.remove(target);
    if (!target.userData?.transitionAnchor) disposeObject3D(target);
    if (this.viewerProduct === source && this.viewerProductInfo) {
      this.viewerProductInfo.baseScale = source.scale.clone();
    }
    return true;
  }

  startTransition(previousState, outgoing, source, destinationBay, destinationProduct) {
    if (!previousState) return;
    this.onInteractionLock?.(true);
    const introToHome = previousState.mode === "intro" && this.state.mode === "home";
    const cameraEnd = this.targetCamera.clone();
    const lookEnd = this.targetLook.clone();
    const outgoingItems = outgoing ? this.collectOutgoingItems(outgoing) : [];
    const outgoingStagger = this.isMobileLayout() ? 0.12 : 0.07;
    const outgoingDuration = 0.34;
    const outgoingEndAt = outgoingItems.length
      ? (outgoingItems.length - 1) * outgoingStagger + outgoingDuration
      : 0;
    const stationaryMobileViewerHandoff = Boolean(
      this.isMobileLayout()
      && this.gridLayout?.productArray
      && source
      && (
        (previousState.mode === "category" && this.state.mode === "viewer")
        || (previousState.mode === "viewer" && this.state.mode === "category")
      ),
    );
    const sourceMoveAt = outgoingEndAt + (stationaryMobileViewerHandoff ? 0.02 : 0.12);
    const sourceMoveDuration = stationaryMobileViewerHandoff ? 0.001 : 0.72;
    const cameraMoveAt = stationaryMobileViewerHandoff
      ? sourceMoveAt
      : source
        ? sourceMoveAt + sourceMoveDuration + 0.1
        : outgoingEndAt + 0.14;
    const cameraMoveDuration = stationaryMobileViewerHandoff ? 0.001 : 0.68;
    const destinationRevealAt = stationaryMobileViewerHandoff
      ? outgoingEndAt + 0.08
      : cameraMoveAt + cameraMoveDuration + 0.1;
    const categoryTextAt = destinationRevealAt + 0.1;
    const gridRevealAt = categoryTextAt + (this.categoryDescription ? 0.5 : 0.22);
    const homeRevealAt = destinationRevealAt + 0.1;

    if (this.state.mode === "home") {
      const homePieceStart = introToHome ? HOME_GALLERY_REVEAL_START : homeRevealAt;
      const app = this.canvas.closest("#app");
      app?.style.setProperty("--home-ui-start", `${(homePieceStart + HOME_GALLERY_REVEAL_DURATION + 0.04).toFixed(2)}s`);
      if (!introToHome) {
        this.homeZones?.forEach((entry) => {
          entry.revealProgress = 0;
          entry.group.visible = false;
          entry.group.scale.setScalar(entry.layoutScale ?? 1);
          entry.products?.forEach((item) => {
            if (item.object.userData?.transitionAnchor || item.object.parent !== entry.group) return;
            item.object.position.copy(item.basePosition);
            item.object.scale.copy(item.baseScale).multiplyScalar(0.001);
          });
          entry.revealDecor?.forEach((item) => {
            item.object.position.copy(item.basePosition);
            item.object.scale.copy(item.baseScale).multiplyScalar(0.001);
          });
        });
      }
    }

    if (outgoing) this.transitionGroup.add(outgoing);
    if (source) this.transitionGroup.add(source);

    let sourceStart = null;
    let sourceEnd = null;
    let sourceStartScale = null;
    let sourceEndScale = null;
    let sourceStartQuaternion = null;
    let sourceEndQuaternion = null;
    if (source && destinationBay) {
      destinationBay.updateWorldMatrix(true, true);
      sourceStart = source.position.clone();
      sourceEnd = new THREE.Vector3();
      (destinationProduct ?? destinationBay).getWorldPosition(sourceEnd);
      sourceStartScale = source.scale.clone();
      sourceStartQuaternion = source.quaternion.clone();
      sourceEndQuaternion = new THREE.Quaternion();
      (destinationProduct ?? destinationBay).getWorldQuaternion(sourceEndQuaternion);
      const sourceSize = new THREE.Vector3();
      const destinationSize = new THREE.Vector3();
      sourceSize.copy(this.transitionObjectSize(source));
      destinationSize.copy(this.transitionObjectSize(destinationProduct ?? destinationBay));
      const uniformScale = stationaryMobileViewerHandoff
        ? 1
        : THREE.MathUtils.clamp(
            Math.min(
              destinationSize.x / Math.max(0.001, sourceSize.x),
              destinationSize.y / Math.max(0.001, sourceSize.y),
            ),
            0.05,
            20,
          );
      sourceEndScale = sourceStartScale.clone().multiplyScalar(uniformScale);
      destinationBay.visible = false;
      if (destinationProduct) destinationProduct.visible = false;
    }

    if (this.state.mode === "category" && this.gridBays) {
      [...this.gridBays.values()].forEach((entry) => {
        entry.revealProgress = 0;
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
        introToHome
          ? HOME_GALLERY_REVEAL_START
            + Math.max(0, this.homeGalleryRevealItems.length - 1) * HOME_GALLERY_REVEAL_INTERVAL
            + HOME_GALLERY_REVEAL_DURATION
            + 0.58
          : this.state.mode === "category"
          ? gridRevealAt + Math.min(1.4, (this.isMobileLayout() ? 5 : 10) * (this.isMobileLayout() ? 0.2 : 0.11)) + 0.58
          : this.state.mode === "viewer"
            ? destinationRevealAt + (stationaryMobileViewerHandoff ? 0.32 : 0.72)
            : this.state.mode === "home"
              ? homeRevealAt
                + Math.max(0, (this.homeZones?.size ?? 1) - 1) * HOME_GALLERY_REVEAL_INTERVAL
                + HOME_GALLERY_REVEAL_DURATION
                + 0.58
              : destinationRevealAt + 0.55,
      introToHome,
      stationaryMobileViewerHandoff,
      logoStart: introToHome ? this.introLogoPlacement() : null,
      logoEnd: introToHome ? this.galleryLogoPlacement() : null,
      outgoing,
      outgoingItems,
      outgoingStagger,
      outgoingDuration,
      sourceMoveAt,
      sourceMoveDuration,
      cameraMoveAt,
      cameraMoveDuration,
      destinationRevealAt,
      categoryTextAt,
      gridRevealAt,
      homeRevealAt,
      source,
      sourceStart,
      sourceEnd,
      sourceStartScale,
      sourceEndScale,
      sourceStartQuaternion,
      sourceEndQuaternion,
      destinationBay,
      destinationBayBaseScale: destinationBay?.scale.clone() ?? null,
      destinationProduct,
      destinationProductBasePosition: destinationProduct?.position.clone() ?? null,
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
    const { outgoing, source, destinationBay, destinationBayBaseScale, destinationProduct, destinationProductBasePosition, introToHome } = this.transition;
    if (outgoing) {
      this.transitionGroup.remove(outgoing);
      disposeObject3D(outgoing);
    }
    const reusedSource = source
      ? this.commitTransitionProduct(source, destinationProduct, this.transition.stationaryMobileViewerHandoff)
      : false;
    if (destinationBay) {
      destinationBay.visible = true;
      if (destinationBayBaseScale) destinationBay.scale.copy(destinationBayBaseScale);
      else destinationBay.scale.setScalar(1);
    }
    if (destinationProduct && !reusedSource) {
      destinationProduct.visible = true;
      if (destinationProductBasePosition) destinationProduct.position.copy(destinationProductBasePosition);
    }
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
    if (introToHome) {
      this.introGroup.visible = false;
      this.resetIntroCopy();
      this.setLogoPlacement(this.galleryLogoPlacement());
      this.completeHomeGalleryReveal();
    }
    this.transition = null;
    this.onInteractionLock?.(false);
  }

	  // D57: describe the centred item plus the visible ring neighbours so the DOM labels
	  // can follow the same left-to-right arc as their Three.js meshes.
	  getMobileLaneItem() {
	    if (!this.gridLayout?.ring || !this.categoryProducts?.length) return null;
	    const step = this.gridLayout.step;
	    const index = Math.min(
	      this.categoryProducts.length - 1,
	      Math.max(0, Math.round(this.scrollOffset / step)),
	    );
	    const ring = this.categoryProducts
	      .map((item, itemIndex) => ({ item, itemIndex, placement: this.mobileRingPosition(itemIndex) }))
	      .filter(({ placement }) => Math.abs(placement.slot) <= this.gridLayout.visibleSlots)
	      .map(({ item, itemIndex, placement }) => ({
	        item,
	        index: itemIndex,
	        active: itemIndex === index,
	        distance: Math.abs(placement.slot),
	        xPercent: 50 + Math.sin(placement.angle) * 54,
	        yPercent: (this.gridLayout.labelYPercent ?? 85.8) - Math.abs(placement.slot) * 2.7,
	        scale: placement.scale,
	      }));
	    return { item: this.categoryProducts[index], index, ring, isSubcollection: Boolean(this.categoryShowingSubcollections) };
	  }

	  scrollCategoryBy(direction) {
	    const step = this.gridLayout?.ring ? this.gridLayout.step : (this.gridLayout?.stepX ?? SMALL_GRID.stepX) * 3;
	    this.scrollCategoryTo(this.scrollOffset + direction * step);
	  }

  scrollCategoryTo(value) {
    if (this.state?.mode !== "category") return;
    const nextOffset = THREE.MathUtils.clamp(value, 0, this.maxScroll);
	    if (Math.abs(nextOffset - this.scrollOffset) < 0.001) return;
	    this.scrollOffset = nextOffset;
	    this.applyGridTrackPosition();
	    this.updateCategoryGrid();
	    this.requestRender();
	    if (this.gridLayout?.ring) this.onMobileLaneChange?.(this.getMobileLaneItem());
	  }

  snapCategoryRing() {
    if (!this.gridLayout?.ring) return;
    const step = this.gridLayout.step;
    this.scrollCategoryTo(Math.round(this.scrollOffset / step) * step);
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

  scheduleAssetPrewarm() {
    if (this.assetPrewarmStarted) return;
    this.assetPrewarmStarted = true;
    const seen = new Set();
    const pushProduct = (product) => {
      if (!product || seen.has(product.id)) return;
      seen.add(product.id);
      this.assetPrewarmQueue.push(product);
    };

    this.categories.forEach((category) => {
      pushProduct(getHeroProduct(category));
      category.subcollections?.forEach((subcollection) => {
        pushProduct(getSubcollectionHeroProduct(category, subcollection.id));
      });
    });
    this.categories.forEach((category) => category.products.forEach(pushProduct));

    window.setTimeout(() => this.scheduleIdleTask(() => this.pumpAssetPrewarm(), 700), 700);
  }

  pumpAssetPrewarm() {
    let count = 0;
    while (this.assetPrewarmQueue.length && count < 3) {
      this.prewarmProductAssets(this.assetPrewarmQueue.shift());
      count += 1;
    }
    if (this.assetPrewarmQueue.length) {
      this.scheduleIdleTask(() => this.pumpAssetPrewarm(), 700);
    }
  }

  prewarmProductAssets(product) {
    if (!product) return;
    if (product.kind === "wall-art" && product.image) {
      this.loadSvgText(product.image).catch(() => {});
    } else if (product.kind === "digital" && product.image) {
      this.loadTexture(product.image);
    } else if (product.kind === "layered") {
      product.layers?.forEach((path) => this.loadSvgText(path).catch(() => {}));
    } else if (product.kind === "object" && product.model) {
      this.loadStlGeometry(product.model).catch(() => {});
    }
  }

  scheduleIdleTask(task, timeout = 250) {
    this.idleTaskQueue.push(task);
    if (this.idleTaskScheduled) return;
    this.requestIdleDrain(timeout);
  }

  requestIdleDrain(timeout = 250) {
    this.idleTaskScheduled = true;
    const run = () => {
      this.idleTaskScheduled = false;
      const next = this.idleTaskQueue.shift();
      if (next) next();
      if (this.idleTaskQueue.length) this.requestIdleDrain(timeout);
    };
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(run, { timeout });
    } else {
      window.setTimeout(run, Math.min(timeout, 120));
    }
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
      black: new THREE.MeshStandardMaterial({ color: ABSOLUTE_PRODUCT_BLACK, roughness: 0.92, metalness: 0 }),
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
    // D64: the wall is the complete web backdrop. It extends below every camera frustum so
    // removing the floor never exposes a horizon strip or the scene background on phones.
    const wall = new THREE.Mesh(new THREE.BoxGeometry(18, 9.2, 0.16), this.materials.wall);
    wall.position.set(2.6, 2.6, -0.08);
    wall.receiveShadow = true;
    this.wallMesh = wall;
    this.architecture.add(wall);
  }

  // D57 mobile lighting rig. The shared wall remains visible; this group only adds
  // camera-facing key/fill/rim light so dark SVG/STL products stay readable in portrait.
  createMobileStage() {
    this.mobileStage = new THREE.Group();
    this.mobileStage.visible = false;
    this.mobileStage.userData.excludeFromTransition = true;

    const stageAmbient = new THREE.HemisphereLight(0xfff0d8, 0x3a281d, 0.82);
    const stageKey = new THREE.DirectionalLight(0xffead0, 2.35);
    stageKey.position.set(3.5, 6.5, 8.5);
    const stageFill = new THREE.DirectionalLight(0xffd7ae, 1.05);
    stageFill.position.set(-5.5, 2.6, 6.5);
    const stageRim = new THREE.DirectionalLight(0xffbd70, 0.78);
    stageRim.position.set(4.5, 4.2, -1.5);
    this.mobileStage.add(stageAmbient, stageKey, stageFill, stageRim);
    this.scene.add(this.mobileStage);
  }

  createIntro() {
    const logo = this.createLogoPlane(2.18, 2.18);
    logo.position.set(-3.65, 1.72, 0.045);
    this.wallLogo = logo;
    this.logoPool = this.createWallLightPool(-3.65, 1.82, 2.65, 3.05, 0.2);
    this.logoGroup.add(this.logoPool, logo);

    const copyGroup = new THREE.Group();
    this.introCopy = copyGroup;
    this.introCopyItems = [];
    const statement = this.createExtrudedText("OBJECTS WITH PRESENCE.", 0.18, 0.024, this.materials.wallText);
    statement.position.set(-0.95, 2.15, 0.045);
    const statementBox = statement.geometry.boundingBox;
    const statementWidth = statementBox.max.x - statementBox.min.x;
    if (statementWidth > 4.55) statement.scale.setScalar(4.55 / statementWidth);
    copyGroup.add(statement);
    this.registerIntroCopyItem(statement);

    const aboutLines = [
      "BLACK AESTHETICS CREATES DISTINCTIVE WALL ART,",
      "DIGITAL PRINTS, LAYERED PIECES AND 3D OBJECTS",
      "FOR SPACES WITH CHARACTER.",
    ];
    aboutLines.forEach((line, index) => {
      const text = this.createExtrudedText(line, 0.068, 0.016, this.materials.wallText);
      text.position.set(-0.92, 1.62 - index * 0.18, 0.04);
      copyGroup.add(text);
      this.registerIntroCopyItem(text);
    });
    this.introGroup.add(copyGroup);

  }

  setIntroLayout() {
    if (!this.wallLogo || !this.introCopy) return;
    const portrait = this.isMobileLayout();
    if (portrait) {
      // D55: portrait intro is fully DOM (logo image + copy in hud.js .m-intro);
      // the 3D copy and wall logo stay hidden so nothing fights the charcoal stage.
      this.introCopy.visible = false;
      return;
    }
    this.introCopy.visible = true;
    this.setLogoPlacement(this.introLogoPlacement());
    this.introCopy.position.set(0, 0, 0);
    this.introCopy.scale.setScalar(1);
    this.introCopyItems.forEach((item) => {
      item.userData.introBasePosition = item.userData.desktopBasePosition.clone();
    });
    this.resetIntroCopy();
  }

  registerIntroCopyItem(mesh) {
    mesh.userData.introBasePosition = mesh.position.clone();
    mesh.userData.desktopBasePosition = mesh.position.clone();
    mesh.userData.introBaseScale = mesh.scale.clone();
    this.introCopyItems.push(mesh);
  }

  resetIntroCopy() {
    this.introCopyItems?.forEach((item) => {
      item.visible = true;
      item.position.copy(item.userData.introBasePosition);
      item.scale.copy(item.userData.introBaseScale);
    });
  }

  introLogoPlacement() {
    if (this.isMobileLayout()) {
      // Smaller and lower than before: keeps the full circle inside the 9:16 frame
      // (visible top ≈ 3.21 at look-y 1.5) and clear of the HUD chip row.
      return {
        position: new THREE.Vector3(-4, 2.08, 0.045),
        scale: new THREE.Vector3(0.55, 0.55, 0.55),
        poolPosition: new THREE.Vector3(-4, 2.05, 0.02),
        poolScale: new THREE.Vector3(0.62, 0.62, 1),
      };
    }
    return {
      position: new THREE.Vector3(-3.65, 1.72, 0.045),
      scale: new THREE.Vector3(1, 1, 1),
      poolPosition: new THREE.Vector3(-3.65, 1.82, 0.02),
      poolScale: new THREE.Vector3(1, 1, 1),
    };
  }

  galleryLogoPlacement() {
    if (this.isMobileLayout()) {
      // Portrait Gallery View has no room for the wall logo (the DOM BA chip covers branding);
      // the intro→home transition shrinks it away instead of parking it behind the sections.
      return {
        position: new THREE.Vector3(-4, 3.3, 0.04),
        scale: new THREE.Vector3(0.001, 0.001, 0.001),
        poolPosition: new THREE.Vector3(-4, 3.3, 0.02),
        poolScale: new THREE.Vector3(0.001, 0.001, 1),
      };
    }
    return {
      position: new THREE.Vector3(-4.2, 1.78, 0.04),
      scale: new THREE.Vector3(0.624, 0.624, 0.624),
      poolPosition: new THREE.Vector3(-4.2, 1.76, 0.02),
      poolScale: new THREE.Vector3(0.58, 0.88, 1),
    };
  }

  setLogoPlacement(placement) {
    // D55: the wall logo never shows on the mobile stage — branding is the DOM header.
    this.logoGroup.visible = !this.isMobileLayout();
    this.wallLogo.position.copy(placement.position);
    this.wallLogo.scale.copy(placement.scale);
    if (this.logoPool) {
      this.logoPool.position.copy(placement.poolPosition);
      this.logoPool.scale.copy(placement.poolScale);
    }
  }

  createHome() {
    this.homeClickTargets = [];
    this.homeBays = new Map();
    this.homeProducts = new Map();
    this.homeZones = new Map();
    this.homeGalleryRevealItems = [];

    if (!this.wallLogo) {
      const logo = this.createLogoPlane(2.18, 2.18);
      logo.position.set(-3.65, 1.72, 0.045);
      this.wallLogo = logo;
      this.logoPool = this.createWallLightPool(-3.65, 1.82, 2.65, 3.05, 0.2);
      this.logoGroup.add(this.logoPool, logo);
    }

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
	    this.homeZones.get("3d-objects")?.revealDecor.push({
	      object: shelf,
	      baseScale: shelf.scale.clone(),
	      basePosition: shelf.position.clone(),
	    });
	    const panther = this.addHomeProduct(objects, "object-panther", { width: 0.92, height: 0.64, big: true, homeDark: true }, 0, 0.64, 0.76, true, 2.75);
	    panther.rotation.y = Math.PI / 2;

	    // D55: portrait section labels are DOM UI (hud.js .m-home-labels), not 3D text.

	    this.applyHomeLayout();
	    this.clickable = [...this.homeClickTargets];
	  }

	  createHomeZone(categoryId, x, width, height) {
	    const zone = new THREE.Group();
	    zone.position.set(x, 1.75, 0);
	    zone.userData = { isHomeZone: true, categoryId, desktopPosition: zone.position.clone() };
	    const hit = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.5), this.materials.hit);
	    hit.position.set(0, 0, 0.24);
	    hit.userData = { action: "category", categoryId };
	    zone.add(hit);
	    this.homeClickTargets.push(hit);
	    this.homeBays.set(categoryId, zone);
	    this.homeZones.set(categoryId, { group: zone, hit, products: [], revealDecor: [], layoutScale: 1 });
	    this.homeGroup.add(zone);
	    return zone;
	  }

  applyHomeLayout() {
    if (!this.homeZones) return;
    const mobile = this.isMobileLayout();
    // D67 portrait Gallery View: four vertical sections alternate right / left / right / left
    // around the camera axis. One hero per section keeps the path legible on a narrow phone.
    // Zone y compensates each hero's local offset so hero centres land evenly spaced.
    // Hero centres land at 25.25 / 46.25 / 67.25 / 88.25% of the 9:16 frame. The matching
    // DOM label shares that vertical centre but sits across the camera axis on the open side.
    const mobilePlacement = {
      "wall-art": { x: -3.68, y: 2.23, scale: 0.285 },
      "digital-art": { x: -4.3, y: 1.54, scale: 0.315 },
      "layered-art": { x: -3.68, y: 0.9, scale: 0.3 },
      // The panther block sits ~0.4 in front of the wall plane, so perspective drops it
      // lower/bigger than wall-plane math. Pulling it left and downscaling it protects the
      // right-side label lane while retaining its intentionally heavier silhouette.
      "3d-objects": { x: -4.28, y: 0.1, scale: 0.36 },
    };
    this.homeZones.forEach((entry, categoryId) => {
      const placement = mobilePlacement[categoryId];
      entry.layoutScale = mobile && placement ? placement.scale : 1;
      entry.revealIndex = ["wall-art", "digital-art", "layered-art", "3d-objects"].indexOf(categoryId);
      const position = mobile && placement ? new THREE.Vector3(placement.x, placement.y, 0) : entry.group.userData.desktopPosition;
      entry.group.position.copy(position);
      if (!this.transition) entry.group.scale.setScalar(entry.layoutScale);
      // Portrait sections show only the hero piece — the desktop side clusters would
      // shrink into unreadable clutter at section scale.
      entry.products.forEach((item) => {
        if (item.object.userData?.transitionAnchor || item.object.parent !== entry.group) {
          item.object.visible = false;
          return;
        }
        item.object.visible = !mobile || Boolean(item.object.userData.transitionProduct);
      });
    });
  }

  addHomeProduct(zone, productId, bounds, x, y, z, transitionProduct = false, scale = 1) {
    const product = this.createProductDisplay(getProduct(productId).product, bounds);
    product.position.set(x, y, z + PRODUCT_WALL_CLEARANCE);
    product.scale.setScalar(scale);
    product.userData.transitionProduct = transitionProduct;
    zone.add(product);
    if (transitionProduct) this.homeProducts.set(zone.userData.categoryId, product);
    const entry = this.homeZones.get(zone.userData.categoryId);
    entry?.products.push({
      object: product,
      baseScale: product.scale.clone(),
      basePosition: product.position.clone(),
    });
    return product;
  }

  prepareHomeGalleryReveal() {
    this.setLogoPlacement(this.introLogoPlacement());
    this.homeGalleryRevealItems = [];
    const mobile = this.isMobileLayout();
    const order = ["wall-art", "digital-art", "layered-art", "3d-objects"];
    order.forEach((categoryId) => {
      const zone = this.homeZones.get(categoryId);
	      if (!zone) return;
	      zone.revealProgress = 0;
	      zone.group.visible = false;
	      // Keep the section at its final wall transform. Scaling the entire zone made products
	      // with large local offsets (especially Wall Art and 3D Objects) travel across the screen.
	      zone.group.scale.setScalar(zone.layoutScale ?? 1);
      zone.products.forEach((item) => {
        if (item.object.userData?.transitionAnchor || item.object.parent !== zone.group) {
          item.object.visible = false;
          return;
        }
        // Portrait sections only ever show/reveal the hero piece.
        if (mobile && !item.object.userData.transitionProduct) {
          item.object.visible = false;
          return;
        }
        item.object.visible = !mobile || Boolean(item.object.userData.transitionProduct);
        item.object.position.copy(item.basePosition);
        item.object.scale.copy(item.baseScale).multiplyScalar(0.001);
      });
      zone.revealDecor?.forEach((item) => {
        item.object.position.copy(item.basePosition);
        item.object.scale.copy(item.baseScale).multiplyScalar(0.001);
      });
      // Reveal the complete section as a unit so shelves and lights cannot precede the piece.
      this.homeGalleryRevealItems.push(zone);
    });
  }

  completeHomeGalleryReveal() {
    const mobile = this.isMobileLayout();
    this.homeZones?.forEach((entry) => {
	      entry.revealProgress = 1;
	      entry.group.visible = true;
	      entry.group.scale.setScalar(entry.layoutScale ?? 1);
      entry.products.forEach((item) => {
        if (item.object.userData?.transitionAnchor || item.object.parent !== entry.group) {
          item.object.visible = false;
          return;
        }
        item.object.visible = !mobile || Boolean(item.object.userData.transitionProduct);
        item.object.position.copy(item.basePosition);
        item.object.scale.copy(item.baseScale);
      });
      entry.revealDecor?.forEach((item) => {
        item.object.position.copy(item.basePosition);
        item.object.scale.copy(item.baseScale);
      });
    });
  }

  resetHomeGalleryReveal() {
    this.completeHomeGalleryReveal();
    this.homeGalleryRevealItems = [];
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
    window.clearTimeout(this.gridBuildTimer);
    this.gridBuildTimer = null;
    this.gridBuildScheduled = false;
    this.gridRevealCounter = 0;
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
	    const mobile = this.isMobileLayout();
	    const mobileProductArray = mobile && !showingSubcollections;

	    this.categoryGroup.add(this.createWallLightPool(mobile ? 0.9 : -4.78, mobileProductArray ? 1.62 : mobile ? 2.1 : 2.12, mobileProductArray ? 2.35 : mobile ? 2.0 : 2.42, mobileProductArray ? 2.25 : mobile ? 1.8 : 1.9, 0.16));
	    // D55: portrait titles/plaques are DOM UI (hud.js .m-category); the 3D description
	    // panel and extruded labels are desktop-only.
	    if (!mobile) {
	      const desc = this.createDescriptionPanel(viewCopy, lead);
	      desc.position.set(-4.82, 2.54, 0.03);
	      this.categoryDescription = desc;
	      this.categoryGroup.add(desc);
	    } else {
	      this.categoryDescription = null;
	    }

	    let bigBay = null;
	    let bigProduct = null;
	    let bigHit = null;
	    if (!mobileProductArray) {
	      bigBay = this.createWallMount({
	      x: mobile ? 0.9 : -2.55,
	      y: mobile ? 2.05 : 1.735,
	      width: mobile ? 1.4 : 2.12,
	      height: mobile ? 1.3 : 2.35,
	      label: mobile ? null : lead.name.toUpperCase(),
	      labelSize: 0.13,
	      labelDepth: 0.04,
	      labelOffset: 0.11,
	    });
	      const isObjectCategory = category.id === "3d-objects";
	      bigProduct = this.createProductDisplay(lead, { width: mobile ? 1.0 : 1.64, height: mobile ? 1.18 : 1.92, big: true });
	    bigProduct.userData.transitionProduct = true;
	    bigProduct.position.set(0, isObjectCategory ? 0.1 : 0, (isObjectCategory ? (mobile ? 0.46 : 0.52) : 0.105) + PRODUCT_WALL_CLEARANCE);
	    if (isObjectCategory) {
	      bigBay.add(this.createFloatingShelf({ width: mobile ? 1.18 : 1.82, depth: mobile ? 0.58 : 0.72, thickness: 0.09, y: mobile ? -0.24 : -0.3, z: 0.42 }));
	    }
      bigBay.add(bigProduct);
      bigHit = new THREE.Mesh(new THREE.BoxGeometry(2.35, 2.75, 0.5), this.materials.hit);
    bigHit.position.set(0, 0, 0.28);
    bigHit.userData = { action: "product", productId: lead.id };
    bigBay.add(bigHit);
	      this.clickable.push(bigHit);
	      this.categoryGroup.add(bigBay);
	      this.categoryGroup.add(this.createWallLightPool(mobile ? 0.9 : -2.55, mobile ? 2.05 : 1.86, mobile ? 1.6 : 2.28, mobile ? 1.7 : 2.65, 0.16));
	    }
	    this.categoryBigBay = bigBay;
	    this.categoryBigProduct = bigProduct;
	    if (!mobile) {
	      this.categoryGroup.add(this.createRowWash(new THREE.Vector3(5.0, 3.1, 1.4), new THREE.Vector3(5.0, 2.35, 0.04), 2.2));
	      this.categoryGroup.add(this.createRowWash(new THREE.Vector3(5.0, 1.9, 1.6), new THREE.Vector3(5.0, 1.0, 0.04), 1.8));
	    }
	    this.categoryGroup.add(this.gridTrack);

    const products = showingSubcollections ? category.subcollections : getSubcollectionProducts(category, activeSubcollection?.id);
    if (this.gridBays) this.gridBays.forEach((entry) => this.disposeGridBay(entry.bay));
    this.categoryProducts = products;
    this.categoryShowingSubcollections = showingSubcollections;
	    this.gridLayout = mobile
	      ? (showingSubcollections ? MOBILE_COLLECTION_RING : MOBILE_PRODUCT_RING)
	      : !showingSubcollections && products.length <= 6
	        ? { startX: -0.18, stepX: 1.05, rowY: [2.46, 1.02] }
	        : SMALL_GRID;
    this.bigHit = bigHit;
    this.gridBays = new Map();
    this.gridHitEntries = [];
    this.gridHittables = [];
    this.pendingGridBuilds.clear();
	    const activeIndex = products.findIndex((item) => {
	      const itemProduct = showingSubcollections
	        ? getSubcollectionHeroProduct(category, item.id)
	        : item;
	      return itemProduct.id === this.state.activeProductId;
	    });
	    if (mobile && activeIndex >= 0) this.scrollOffset = activeIndex * this.gridLayout.step;
	    this.maxScroll = mobile
	      ? Math.max(0, (products.length - 1) * this.gridLayout.step)
	      : Math.max(0, (Math.ceil(products.length / 2) - 4) * this.gridLayout.stepX);
    // Windowed virtualization: only the product bays near the scroll window are built (see
    // updateCategoryGrid). With 148 Wall Art products, eagerly building every bay (a fetch + SVG
    // extrude each) was the load cost — now ~9 columns are live at a time.
    // Build the selected mobile ring item synchronously. It is the transition destination, so
    // the exact source mesh can land immediately while its neighbours stream in one at a time.
    if (mobileProductArray && activeIndex >= 0) {
      const entry = this.buildGridBay(products[activeIndex], activeIndex);
      const visible = this.visibleGridPosition(activeIndex);
      entry.edgeScale = visible.scale;
      entry.bay.position.set(visible.x, visible.y, visible.z);
      entry.bay.rotation.y = visible.rotationY;
      entry.targetPosition = entry.bay.position.clone();
      entry.targetRotationY = visible.rotationY;
      entry.revealProgress = 0;
      entry.revealIndex = this.gridRevealCounter++;
      this.gridBays.set(activeIndex, entry);
      this.categoryBigBay = entry.bay;
      this.categoryBigProduct = entry.productDisplay;
    }
	    this.applyGridTrackPosition();
    this.updateCategoryGrid();
    if (mobile) this.onMobileLaneChange?.(this.getMobileLaneItem());
  }

	  // Build one wall-mounted product group (extruded SVG / poster / STL) and return its group + hit mesh.
	  buildGridBay(item, index) {
	    const { x, y } = this.gridPositionForIndex(index);
	    const mobile = this.isMobileLayout();
	    const mobileLayout = mobile && this.gridLayout?.ring ? this.gridLayout : null;
	    const product = this.categoryShowingSubcollections ? getSubcollectionHeroProduct(getCategory(this.state.activeCategoryId), item.id) : item;
	    const bay = this.createWallMount({
	      x,
	      y,
	      width: mobileLayout?.mountWidth ?? 0.9,
	      height: mobileLayout?.mountHeight ?? 0.98,
	      // D55: portrait tile names render as the DOM lane plaque, not 3D text.
	      label: mobile ? null : (this.categoryShowingSubcollections ? item.label : product.name).toUpperCase(),
	      labelSize: 0.07,
	      labelDepth: 0.026,
	      labelOffset: 0.1,
	    });
    const isObjectProduct = product.kind === "object";
    // restY: shelf top in display space — shelf centre y 0.08 + half thickness 0.0325, minus the
    // display group's own y offset (0.08). Keeps STLs standing ON the slab, not through it.
	    const display = this.createProductDisplay(product, {
	      width: isObjectProduct ? (mobileLayout?.objectDisplayWidth ?? 0.62) : (mobileLayout?.flatDisplayWidth ?? 0.58),
	      height: isObjectProduct ? (mobileLayout?.objectDisplayHeight ?? 0.58) : (mobileLayout?.flatDisplayHeight ?? 0.68),
	      big: false,
	      ...(isObjectProduct ? { restY: 0.0325 } : {}),
	    });
    display.userData.transitionProduct = true;
    display.position.set(0, isObjectProduct ? 0.08 : 0, (isObjectProduct ? 0.44 : 0.105) + PRODUCT_WALL_CLEARANCE);
    if (isObjectProduct) {
	      bay.add(this.createFloatingShelf({ width: mobileLayout?.productArray ? 1.08 : mobile ? 0.68 : 0.76, depth: mobileLayout?.productArray ? 0.58 : mobile ? 0.46 : 0.5, thickness: mobileLayout?.productArray ? 0.075 : 0.065, y: 0.08, z: 0.32 }));
    }
    bay.add(display);
    bay.add(this.createWallLightPool(0, 0.16, 0.88, 1.1, 0.12));
    const hoverGlow = this.createWallLightPool(0, 0.12, 1.08, 1.28, 0.24);
    hoverGlow.position.z = 0.032;
    hoverGlow.visible = false;
    bay.add(hoverGlow);
    if (this.categoryShowingSubcollections && !mobile) {
      const count = this.createExtrudedText(`${item.productIds.length} PIECES`, 0.06, 0.012, this.materials.wallTextGold);
      centerGeometry(count.geometry);
      count.position.set(0, -0.34, 0.045);
      bay.add(count);
    }
    const hit = new THREE.Mesh(new THREE.BoxGeometry(mobileLayout?.mountWidth ?? 1.02, mobileLayout?.mountHeight ?? 1.28, 0.46), this.materials.hit);
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

  gridPositionForIndex(index) {
    const layout = this.gridLayout ?? SMALL_GRID;
    if (layout.ring) return { x: layout.centerX, y: layout.centerY };
    const row = index % 2;
    const col = Math.floor(index / 2);
    return { x: layout.startX + col * layout.stepX, y: layout.rowY[row] };
  }

  mobileRingPosition(index) {
    const layout = this.gridLayout?.ring ? this.gridLayout : MOBILE_COLLECTION_RING;
    const slot = index - this.scrollOffset / layout.step;
    const angle = slot * layout.angleStep;
    const distance = Math.abs(slot);
    return {
      slot,
      angle,
      x: layout.centerX + Math.sin(angle) * layout.radiusX,
      y: layout.centerY + Math.min(distance, layout.visibleSlots) * 0.08,
      z: 0.18 - (1 - Math.cos(angle)) * layout.radiusZ,
      rotationY: -angle * 0.42,
      scale: THREE.MathUtils.clamp(
        1 - distance * (layout.scaleFalloff ?? 0.2),
        layout.minScale ?? 0.42,
        1,
      ),
    };
  }

  visibleGridPosition(index) {
    if (this.gridLayout?.ring) return this.mobileRingPosition(index);
    const position = this.gridPositionForIndex(index);
    return { x: position.x - this.scrollOffset, y: position.y };
  }

  applyGridTrackPosition() {
    if (!this.gridTrack) return;
    this.gridTrack.position.set(this.gridLayout?.ring ? 0 : -this.scrollOffset, 0, 0);
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
	    this.applyGridTrackPosition();
	    const mobile = Boolean(this.gridLayout?.ring);
	    const rightEdge = this.isMobileLayout() ? 4.6 : 8.9;
	    this.categoryProducts.forEach((item, index) => {
	      const visible = this.visibleGridPosition(index);
	      const near = mobile
	        ? Math.abs(visible.slot) <= this.gridLayout.visibleSlots + 0.8
	        : visible.x >= HERO_GRID_VANISH_X - GRID_EDGE_SCALE_DISTANCE && visible.x <= rightEdge + GRID_EDGE_SCALE_DISTANCE;
	      if (near) {
	        if (!this.gridBays.has(index)) {
	          this.queueGridBayBuild(item, index);
	          return;
	        }
	        const entry = this.gridBays.get(index);
	        entry.edgeScale = mobile ? visible.scale : gridEdgeScale(visible.x, rightEdge);
	        if (mobile) {
	          entry.targetPosition = new THREE.Vector3(visible.x, visible.y, visible.z);
	          entry.targetRotationY = visible.rotationY;
	        }
	        entry.hit.visible = entry.edgeScale > 0.45;
	      } else {
        this.pendingGridBuilds.delete(index);
        if (!this.gridBays.has(index)) return;
        const entry = this.gridBays.get(index);
        this.gridTrack.remove(entry.bay);
        this.disposeGridBay(entry.bay);
        this.gridBays.delete(index);
      }
    });
    this.refreshGridHitTargets();
  }

  queueGridBayBuild(item, index) {
    if (this.pendingGridBuilds.has(index)) return;
    this.pendingGridBuilds.set(index, { item, index });
    this.scheduleGridBuildDrain();
  }

  scheduleGridBuildDrain() {
    if (this.gridBuildScheduled) return;
    this.gridBuildScheduled = true;
    const drain = () => requestAnimationFrame(() => {
        this.gridBuildScheduled = false;
        this.gridBuildTimer = null;
        this.buildNextQueuedGridBay();
      });
    if (this.isMobileLayout()) {
      this.gridBuildTimer = window.setTimeout(drain, 120);
    } else {
      drain();
    }
  }

	  buildNextQueuedGridBay() {
    if (this.state?.mode !== "category" || !this.categoryProducts || !this.gridBays) {
      this.pendingGridBuilds.clear();
      return;
    }
	    const mobile = Boolean(this.gridLayout?.ring);
	    const rightEdge = this.isMobileLayout() ? 4.6 : 8.9;
	    for (const [index, queued] of this.pendingGridBuilds) {
	      this.pendingGridBuilds.delete(index);
	      const visible = this.visibleGridPosition(index);
	      const near = mobile
	        ? Math.abs(visible.slot) <= this.gridLayout.visibleSlots + 0.8
	        : visible.x >= HERO_GRID_VANISH_X - GRID_EDGE_SCALE_DISTANCE && visible.x <= rightEdge + GRID_EDGE_SCALE_DISTANCE;
	      if (!near || this.gridBays.has(index)) continue;

	      const entry = this.buildGridBay(queued.item, index);
	      entry.edgeScale = mobile ? visible.scale : gridEdgeScale(visible.x, rightEdge);
      if (mobile) {
        entry.bay.position.set(visible.x, visible.y, visible.z);
        entry.bay.rotation.y = visible.rotationY;
        entry.targetPosition = entry.bay.position.clone();
        entry.targetRotationY = visible.rotationY;
      }
      entry.revealProgress = 0;
      entry.revealIndex = this.gridRevealCounter++;
      entry.bay.scale.setScalar(Math.max(0.01, entry.edgeScale * 0.01));
      entry.hit.visible = entry.edgeScale > 0.45;
      this.gridBays.set(index, entry);
      this.refreshGridHitTargets();
      break;
    }
    if (this.pendingGridBuilds.size) this.scheduleGridBuildDrain();
  }

  refreshGridHitTargets() {
    const entries = [...this.gridBays.values()];
    this.gridHitEntries = entries.filter((entry) => entry.edgeScale > 0.62);
    this.gridHittables = this.gridHitEntries.map((entry) => entry.hit);
    this.clickable = [this.bigHit, ...entries.map((entry) => entry.hit)].filter(Boolean);
  }

	  buildViewer(category, product) {
	    this.clearGroup(this.viewerGroup);
	    this.clickable = [];
	    const mobile = this.isMobileLayout();
	    // Portrait viewer (ref 05): product in the upper half above the bottom sheet; the
	    // 3D wall label is skipped — the sheet already carries the name (the old label at
	    // bay-top clipped above the wall into the roof band).
	    const bay = this.createWallMount({
	      x: mobile ? MOBILE_PRODUCT_RING.centerX : 0,
	      y: mobile ? MOBILE_PRODUCT_RING.centerY : 1.735,
	      width: mobile ? MOBILE_PRODUCT_RING.mountWidth : 2.32,
	      height: mobile ? MOBILE_PRODUCT_RING.mountHeight : 2.45,
	      label: mobile ? null : product.name.toUpperCase(),
	      labelSize: 0.12,
	      labelDepth: 0.042,
	      labelOffset: 0.11,
	      labelPlacement: "above",
	    });
	    const isObjectProduct = product.kind === "object";
	    // Match the active product-ring footprint exactly. The reused source therefore needs no
	    // landing refit, scale change, or screen-space correction when viewer controls open.
	    const viewerBounds = mobile
	      ? {
	          width: isObjectProduct ? MOBILE_PRODUCT_RING.objectDisplayWidth : MOBILE_PRODUCT_RING.flatDisplayWidth,
	          height: isObjectProduct ? MOBILE_PRODUCT_RING.objectDisplayHeight : MOBILE_PRODUCT_RING.flatDisplayHeight,
	          big: false,
	          ...(isObjectProduct ? { restY: 0.0325 } : {}),
	        }
	      : { width: 1.72, height: 1.96, big: true };
	    const display = this.createProductDisplay(product, viewerBounds);
	    display.userData.transitionProduct = true;
	    display.position.set(
	      0,
	      isObjectProduct ? (mobile ? 0.08 : 0.12) : 0,
	      mobile
	        ? (isObjectProduct ? 0.44 : 0.105) + PRODUCT_WALL_CLEARANCE
	        : (isObjectProduct ? 0.62 : 0.48) + VIEWER_WALL_CLEARANCE,
	    );
	    display.userData.viewerProduct = true;
	    if (isObjectProduct) {
	      bay.add(this.createFloatingShelf({
	        width: mobile ? 1.08 : 1.9,
	        depth: mobile ? 0.58 : 0.78,
	        thickness: mobile ? 0.075 : 0.09,
	        y: mobile ? 0.08 : -0.3,
	        z: mobile ? 0.32 : 0.43,
	      }));
	    }
    if (mobile) bay.position.z = 0.18;
    bay.add(display);
    this.viewerProduct = display;
    this.viewerProductInfo = { productId: product.id, baseScale: display.scale.clone() };
    this.applyLayerExpansionToObject(display, this.layersExpanded, true);
    this.viewerBay = bay;
	    this.viewerGroup.add(this.createWallLightPool(mobile ? 0.9 : 0, mobile ? 1.62 : 1.9, mobile ? 2.1 : 2.5, mobile ? 2.2 : 2.8, mobile ? 0.24 : 0.16), bay);
      if (mobile) {
        const viewerSoftbox = new THREE.RectAreaLight(0xfff0d8, 4.1, 3.4, 3.2);
        viewerSoftbox.position.set(1.6, 2.82, 3.7);
        viewerSoftbox.lookAt(0.9, 1.62, 0.45);
        const viewerRim = new THREE.PointLight(0xffbd70, 1.25, 5.5, 1.8);
        viewerRim.position.set(-0.6, 2.05, 1.8);
        this.viewerGroup.add(viewerSoftbox, viewerRim);
      }
	  }

  // D54/D59: the viewer mesh REPRESENTS the selected variant. Size scales the whole piece,
  // Thickness scales depth, Acrylic changes the finish, and eligible product colors tint only
  // product-owned materials. Shared wall/text/shelf materials are never mutated.
  applyViewerVariant(productId, { sizeRatio = 1, thicknessMul = 1, acrylic = false, color = null } = {}) {
    if (this.state?.mode !== "viewer") return;
    if (!this.viewerProduct || this.viewerProductInfo?.productId !== productId) return;
    const base = this.viewerProductInfo.baseScale;
    this.viewerProduct.scale.set(base.x * sizeRatio, base.y * sizeRatio, base.z * sizeRatio * thicknessMul);

    if (!this.sharedMaterials) this.sharedMaterials = new Set(Object.values(this.materials));
    this.viewerProduct.traverse((child) => {
      if (!child.isMesh) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      if (!child.userData.variantBaseMaterials) child.userData.variantBaseMaterials = [...materials];
      if (!child.userData.variantMaterialCache) child.userData.variantMaterialCache = new Map();
      const swapped = child.userData.variantBaseMaterials.map((original, index) => {
        if (!original?.isMeshStandardMaterial || this.sharedMaterials.has(original)) return original;
        if (!acrylic && !color) return original;
        const key = `${index}|${original.uuid}|${acrylic ? "acrylic" : "wood"}|${color ?? "base"}`;
        if (!child.userData.variantMaterialCache.has(key)) {
          const variant = original.clone();
          const absoluteBlack = color?.toLowerCase() === "#000000";
          if (acrylic) {
            variant.roughness = 0.12;
            variant.metalness = 0.08;
          }
          if (color) {
            variant.color.set(color);
            if (absoluteBlack) {
              // D66: selected black stays optically black even under the portrait key/softbox.
              // Keep only a restrained broad highlight so the extrusion remains dimensional.
              variant.roughness = acrylic ? 0.48 : 0.92;
              variant.metalness = 0;
              if ("specularIntensity" in variant) variant.specularIntensity = 0.12;
            }
          }
          child.userData.variantMaterialCache.set(key, variant);
        }
        return child.userData.variantMaterialCache.get(key);
      });
      child.material = Array.isArray(child.material) ? swapped : swapped[0];
    });
    this.requestRender();
  }

  setWallColor(color = "#ffffff") {
    if (!this.wallMesh || !/^#[0-9a-f]{6}$/i.test(color)) return;
    // The procedural plaster map retains its relief/detail; material color acts as a live tint.
    this.wallMesh.material.color.set(color);
    this.wallMesh.material.needsUpdate = true;
    this.requestRender();
  }

  setLayerExpanded(productId, expanded) {
    this.layersExpanded = expanded;
    if (this.state?.mode !== "viewer") return;
    if (!this.viewerProduct || this.viewerProductInfo?.productId !== productId) return;
    this.applyLayerExpansionToObject(this.viewerProduct, expanded);
    this.requestRender();
  }

  applyLayerExpansionToObject(root, expanded, immediate = false) {
    root?.traverse((object) => {
      if (object.userData?.layerStack) this.applyLayerExpansionToStack(object, expanded, immediate);
    });
  }

  applyLayerExpansionToStack(stack, expanded, immediate = false) {
    const layerGroups = stack.userData.layerGroups ?? [];
    stack.userData.layersExpanded = expanded;
    layerGroups.forEach((layerGroup, index) => {
      const depthIndex = layerGroup.userData.layerDepthIndex ?? index;
      const baseZ = layerGroup.userData.layerBaseZ ?? layerGroup.position.z;
      const targetZ = baseZ + (expanded ? depthIndex * LAYER_EXPAND_GAP : 0);
      layerGroup.userData.layerTargetZ = targetZ;
      if (immediate) layerGroup.position.z = targetZ;
    });
  }

  // Returns true while any layer stack is still assembling/settling, so the render loop
  // keeps drawing until the animation is at rest.
  updateLayeredStacks(delta) {
    let moving = false;
    this.layerStackAnimations.forEach((stack) => {
      if (!stack.parent) {
        this.layerStackAnimations.delete(stack);
        return;
      }
      stack.userData.assembleElapsed = (stack.userData.assembleElapsed ?? 0) + delta;
      const elapsed = stack.userData.assembleElapsed;
      (stack.userData.layerGroups ?? []).forEach((layerGroup, index) => {
        const reveal = smooth01((elapsed - (layerGroup.userData.assembleDelay ?? index * LAYER_ASSEMBLE_INTERVAL)) / LAYER_ASSEMBLE_DURATION);
        layerGroup.visible = reveal > 0.01;
        layerGroup.scale.setScalar(Math.max(0.001, reveal));
        const targetZ = layerGroup.userData.layerTargetZ ?? layerGroup.userData.layerBaseZ ?? layerGroup.position.z;
        const introLift = (1 - reveal) * (LAYER_ASSEMBLE_LATCH_DISTANCE + index * 0.035);
        const goalZ = targetZ + introLift;
        layerGroup.position.z += (goalZ - layerGroup.position.z) * 0.18;
        if (reveal < 0.999 || Math.abs(goalZ - layerGroup.position.z) > EASE_SETTLE_EPS) moving = true;
      });
    });
    return moving;
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
    group.userData.body = body;
    group.userData.titleWidth = Math.min(titleWidth, TITLE_MAX_W);
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
    let display;
    if (product.kind === "object") {
      display = this.createObjectProduct(product, bounds);
    } else {
      const aspect = product.aspect ?? 1;
      const fitted = fit(bounds.width, bounds.height, aspect);

      if (product.kind === "layered") {
        display = this.createLayeredProduct(product, bounds);
      } else if (product.kind === "digital") {
        display = this.createDigitalProduct(product, fitted);
      } else if (product.kind === "wall-art") {
        display = this.createWallArtProduct(product, bounds);
      } else {
        display = new THREE.Group();
        const plane = this.createImagePlane(product.image, fitted.width, fitted.height, { transparent: true, physical: false });
        display.add(plane);
      }
    }
    display.userData.productId = product.id;
    return display;
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
    group.userData.productId = product.id;
    const placeholder = this.createProceduralLayerStack(product, bounds);
    group.add(placeholder);

    if (!product.layers?.length) return group;
    const cachedLayers = product.layers.map((path) => this.svgResolvedCache.get(path));
    if (cachedLayers.every(Boolean)) {
      this.scheduleIdleTask(() => {
        if (!group.parent) return;
        group.remove(placeholder);
        disposeObject3D(placeholder);
        group.add(this.createLayeredSvgStack(product, bounds, cachedLayers));
        if (this.viewerProductInfo?.productId === product.id && this.layersExpanded) {
          this.applyLayerExpansionToObject(group, true);
        }
        this.requestRender();
      });
      return group;
    }
    Promise.all(product.layers.map((path) => this.loadSvgText(path)))
      .then((svgTexts) => {
        this.scheduleIdleTask(() => {
          if (!group.parent) return;
          const model = this.createLayeredSvgStack(product, bounds, svgTexts);
          group.remove(placeholder);
          disposeObject3D(placeholder);
          group.add(model);
          if (this.viewerProductInfo?.productId === product.id && this.layersExpanded) {
            this.applyLayerExpansionToObject(group, true);
          }
          this.requestRender();
        });
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

    // Explicit catalog order wins. It is back-to-front and avoids guessing from SVG path
    // complexity for pieces whose layer files were exported in front-detail order.
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
    const depthOf = new Array(svgTexts.length);
    const explicitOrder = Array.isArray(product.layerOrder)
      ? product.layerOrder.filter((index) => Number.isInteger(index) && index >= 0 && index < svgTexts.length)
      : null;
    if (explicitOrder?.length) {
      explicitOrder.forEach((idx, step) => {
        depthOf[idx] = step;
      });
      svgTexts.forEach((_, idx) => {
        if (depthOf[idx] === undefined) depthOf[idx] = depthOf.filter(Number.isFinite).length;
      });
    } else {
      const detailOrder = svgTexts.map((_, i) => i).filter((i) => !(hasBacking && i === backIndex));
      if (product.frontLayerFirst) detailOrder.reverse();
      if (hasBacking) depthOf[backIndex] = 0;
      detailOrder.forEach((idx, step) => {
        depthOf[idx] = (hasBacking ? 1 : 0) + step;
      });
    }
    const maxDepth = Math.max(1, ...depthOf.filter(Number.isFinite));
    const layerGroups = [];

    svgTexts.forEach((svgText, layerIndex) => {
      if (bounds.homeDark && isMandala && hasBacking && layerIndex === backIndex) return;
      const parsed = this.svgLoader.parse(svgText);
      const depthIndex = depthOf[layerIndex];
      const tint = depthIndex / maxDepth;
      const layerGroup = new THREE.Group();
      layerGroup.position.z = depthIndex * layerGap;
      layerGroup.userData = {
        isLayeredSvgLayer: true,
        layerDepthIndex: depthIndex,
        layerBaseZ: depthIndex * layerGap,
        layerTargetZ: depthIndex * layerGap,
        assembleDelay: depthIndex * LAYER_ASSEMBLE_INTERVAL,
      };
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
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          layerGroup.add(mesh);
        });
      });
      if (layerGroup.children.length) {
        content.add(layerGroup);
        layerGroups.push(layerGroup);
      }
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
    content.userData.layerStack = true;
    content.userData.layerGroups = layerGroups.sort((a, b) => a.userData.layerDepthIndex - b.userData.layerDepthIndex);
    content.userData.assembleElapsed = 0;
    this.applyLayerExpansionToStack(content, false, true);
    content.userData.layerGroups.forEach((layerGroup, index) => {
      const targetZ = layerGroup.userData.layerTargetZ ?? layerGroup.userData.layerBaseZ ?? layerGroup.position.z;
      layerGroup.position.z = targetZ + LAYER_ASSEMBLE_LATCH_DISTANCE + index * 0.035;
      layerGroup.visible = false;
      layerGroup.scale.setScalar(0.001);
    });
    this.layerStackAnimations.add(content);
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
    // D66 web presentation override: Wall Art is absolute neutral black, not the warm
    // #302c29 Blender wood swatch. Low specular response prevents warm lights lifting it brown.
    const material = new THREE.MeshPhysicalMaterial({
      color: ABSOLUTE_PRODUCT_BLACK,
      roughness: 0.92,
      metalness: 0,
      specularIntensity: 0.12,
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
        this.requestRender();
    };

    const buildWhenIdle = (svgText) => {
      this.scheduleIdleTask(() => {
        if (!group.parent) return;
        buildSvg(svgText);
      });
    };
    const cachedSvg = this.svgResolvedCache.get(product.image);
    if (cachedSvg) {
      buildWhenIdle(cachedSvg);
    } else {
      this.loadSvgText(product.image).then(buildWhenIdle).catch((error) => {
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
        this.requestRender();
      })
      .catch((error) => {
        console.warn(`[BA] Could not load STL for ${product.name}`, error);
      });
    return group;
  }

  createObjectFallback(product, bounds) {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: ABSOLUTE_PRODUCT_BLACK, roughness: 0.88, metalness: 0 });
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
      color: product.materialColor ?? ABSOLUTE_PRODUCT_BLACK,
      roughness: product.materialColor ? 0.5 : 0.88,
      metalness: product.materialColor ? 0.04 : 0,
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
          texture.anisotropy = Math.min(this.maxAnisotropy ?? 8, this.isMobileLayout() ? 4 : 8);
          material.map = texture;
          material.visible = true;
          material.needsUpdate = true;
          this.requestRender();
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
    const cacheKey = `${text}|${size}|${depth}`;
    let template = this.textGeometryCache.get(cacheKey);
    if (!template) {
      template = new TextGeometry(text, {
        font: WALL_FONT,
        size,
        height: depth,
        curveSegments: 2,
        bevelEnabled: false,
      });
      template.computeBoundingBox();
      this.textGeometryCache.set(cacheKey, template);
    }
    const geometry = template.clone();
    geometry.computeBoundingBox();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    return mesh;
  }

  loadTexture(path) {
    if (this.textureCache.has(path)) return this.textureCache.get(path);
    let texture;
    const readyPromise = new Promise((resolve, reject) => {
      texture = this.textureLoader.load(
        path,
        () => {
          // A resolved texture uploads on the next draw — kick one render (on-demand loop).
          this.requestRender();
          resolve(texture);
        },
        undefined,
        reject,
      );
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(this.maxAnisotropy ?? 8, this.isMobileLayout() ? 4 : 8);
    texture.userData.readyPromise = readyPromise;
    this.textureCache.set(path, texture);
    return texture;
  }

  createPlasterTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    // Flat parity base keeps the repeating texture seamless; irregular cloud/grain layers
    // carry the variation without producing horizontal bands at tile boundaries.
    ctx.fillStyle = "#c0aa89";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 36; i += 1) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = 80 + Math.random() * 230;
      const cloud = ctx.createRadialGradient(x, y, 0, x, y, radius);
      cloud.addColorStop(0, Math.random() > 0.5 ? "rgba(86,59,35,0.08)" : "rgba(255,239,207,0.1)");
      cloud.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = cloud;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }

    for (let i = 0; i < 5200; i += 1) {
      const alpha = 0.012 + Math.random() * 0.09;
      ctx.fillStyle = Math.random() > 0.5 ? `rgba(74,52,33,${alpha})` : `rgba(255,237,205,${alpha})`;
      const size = Math.random() * 2.4 + 0.35;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, size, size * (0.35 + Math.random()));
    }
    for (let i = 0; i < 1200; i += 1) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const length = 6 + Math.random() * 44;
      ctx.strokeStyle = Math.random() > 0.45 ? "rgba(78,52,31,0.13)" : "rgba(255,241,214,0.14)";
      ctx.lineWidth = 0.45 + Math.random() * 1.8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(
        x + length * 0.3,
        y + (Math.random() - 0.5) * 12,
        x + length * 0.7,
        y + (Math.random() - 0.5) * 12,
        x + length,
        y + (Math.random() - 0.5) * 7,
      );
      ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.set(1, 1);
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

  createLights() {
    // D57 replaces the old cove-sized wash with one tall soft source. The previous narrow
    // area light left a visible horizontal lighting boundary once the header was removed.
    const ambient = new THREE.HemisphereLight(0xffe6c8, 0x3a2c1c, 0.78);
    const wallWash = new THREE.RectAreaLight(LIGHT_COLOR, 2.35, 16, 8);
    wallWash.position.set(2.6, 3.8, 5.4);
    wallWash.lookAt(2.6, 2.8, 0.02);
    const front = new THREE.RectAreaLight(FRONT_FILL_COLOR, 2.65, 10, 4.4);
    front.position.set(-0.9, 2.8, 7.0);
    front.lookAt(-0.9, 1.5, 0);
    this.scene.add(ambient, wallWash, front);
  }

  createRowWash(position, target, intensity) {
    const light = new THREE.RectAreaLight(LIGHT_COLOR, intensity, 12, 0.5);
    light.position.copy(position);
    light.lookAt(target);
    light.userData.excludeFromTransition = true;
    return light;
  }

  createWallLightPool(x, y, width, height, opacity) {
    if (!this.lightPoolTexture) this.lightPoolTexture = this.createLightPoolTexture();
    const material = new THREE.MeshBasicMaterial({
      map: this.lightPoolTexture,
      color: 0xffd9a8,
      transparent: true,
      // D66: broad atmosphere, not a white hotspot behind the selected piece.
      opacity: opacity * 0.52,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(width * 1.35, height * 1.35), material);
    pool.position.set(x, y, 0.006);
    pool.userData.excludeFromTransition = true;
    return pool;
  }

  createLightPoolTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createRadialGradient(256, 238, 6, 256, 256, 255);
    gradient.addColorStop(0, "rgba(255,226,166,0.62)");
    gradient.addColorStop(0.36, "rgba(255,198,122,0.34)");
    gradient.addColorStop(0.76, "rgba(255,178,92,0.09)");
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
	      this.dragStartY = event.clientY;
	      this.dragLastX = event.clientX;
	      this.dragLastY = event.clientY;
	      this.dragMoved = false;
	    });
    this.canvas.addEventListener("pointermove", (event) => {
      if (!this.dragging) {
        this.queueHover(event);
        return;
      }
	      const delta = event.clientX - this.dragLastX;
	      this.dragLastX = event.clientX;
	      this.dragLastY = event.clientY;
	      if (Math.hypot(event.clientX - this.dragStartX, event.clientY - this.dragStartY) > 4) {
	        this.dragMoved = true;
	        if (this.state?.mode === "category") this.setCategoryFrontalCamera();
	      }
	      if (this.state?.mode === "viewer" && this.viewerProduct) {
	        this.viewerOrbit = THREE.MathUtils.clamp(this.viewerOrbit + delta * 0.006, -1.25, 1.25);
	        this.requestRender();
	      } else if (this.state?.mode === "category") {
	        const scrollDelta = this.gridLayout?.ring ? -delta * 0.009 : -delta * 0.012;
	        this.scrollCategoryTo(this.scrollOffset + scrollDelta);
	      }
    });
    this.canvas.addEventListener("pointerleave", () => {
      this.pendingHoverPoint = null;
      this.hoveredEntry = null;
      this.setHoveredHomeZone(null);
      this.canvas.style.cursor = "";
    });
    this.canvas.addEventListener("pointerup", (event) => {
      if (this.dragging && this.dragMoved) {
        if (this.state?.mode === "category") this.snapCategoryRing();
        this.dragging = false;
        return;
	      }
	      this.dragging = false;
	      if (!this.eventToPointer(event)) return;
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
        if (this.gridLayout?.ring) {
          window.clearTimeout(this.ringSnapTimer);
          this.ringSnapTimer = window.setTimeout(() => this.snapCategoryRing(), 140);
        }
      },
      { passive: false },
    );
  }

	  setCategoryCamera() {
	    const isPortrait = this.isMobileLayout();
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
	      if (!this.eventToPointer(event)) return;
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
	    if (!this.eventToPointer(event)) return;
	    this.raycaster.setFromCamera(this.pointer, this.camera);
    const entries = this.gridHitEntries ?? [];
    const hit = this.raycaster.intersectObjects(this.gridHittables ?? [], false)[0];
    const previousEntry = this.hoveredEntry;
    this.hoveredEntry = hit ? entries.find((entry) => entry.hit === hit.object) ?? null : null;
    if (this.hoveredEntry !== previousEntry) this.requestRender();
    this.canvas.style.cursor = this.hoveredEntry ? "pointer" : "";
  }

  setHoveredHomeZone(entry) {
    if (entry === this.hoveredHomeZone) return;
    this.hoveredHomeZone = entry;
    this.requestRender();
    this.onCategoryPreview?.(entry?.group.userData.categoryId ?? null);
  }

  queueHover(event) {
    this.pendingHoverPoint = { clientX: event.clientX, clientY: event.clientY };
    if (this.hoverFramePending) return;
    this.hoverFramePending = true;
    requestAnimationFrame(() => {
      this.hoverFramePending = false;
      if (!this.pendingHoverPoint) return;
      const point = this.pendingHoverPoint;
      this.pendingHoverPoint = null;
      this.updateHover(point);
    });
  }

	  resize() {
	    const width = window.innerWidth;
	    const height = window.innerHeight;
	    const wasMobile = this.mobileLayout;
	    const mobile = this.isMobileLayout();
	    this.mobileLayout = mobile;
	    // Real phones fill their actual viewport. Only a manually forced mobile preview on a
	    // laptop is framed to a representative 390×844 device, so the toggle previews reality.
	    this.renderViewport = this.isForcedMobilePreview()
	      ? this.mobilePreviewFrame(width, height)
	      : { left: 0, top: 0, width, height };
	    // Phones render far more physical pixels per CSS pixel; cap DPR lower there (desktop keeps
	    // 1.5 so the approved landscape renders are unchanged). setPixelRatio must precede setSize.
	    const targetPixelRatio = mobile ? Math.min(window.devicePixelRatio, 1.25) : Math.min(window.devicePixelRatio, 1.5);
	    if (this.renderer.getPixelRatio() !== targetPixelRatio) this.renderer.setPixelRatio(targetPixelRatio);
	    this.renderer.setSize(width, height, false);
	    this.camera.aspect = this.renderViewport.width / this.renderViewport.height;
	    this.camera.fov = mobile ? 43 : 33;
	    this.camera.updateProjectionMatrix();
	    // D64: the same tall textured wall is the only architecture on every breakpoint.
    // Portrait adds a lighting rig, never a replacement backdrop.
	    this.architecture.visible = true;
	    if (this.mobileStage) this.mobileStage.visible = mobile;
	    this.renderer.toneMappingExposure = mobile ? 1.12 : 1.02;
	    if (mobile) this.logoGroup.visible = false;
	    else if (this.state) this.logoGroup.visible = this.state.mode === "intro" || this.state.mode === "home";
	    if (wasMobile !== mobile) {
	      this.applyHomeLayout();
	      if (this.state?.mode === "category") {
	        const category = getCategory(this.state.activeCategoryId);
	        const { product } = getProduct(this.state.activeProductId);
	        this.buildCategory(category, product);
	      }
	      if (this.state?.mode === "viewer") {
	        const { product, category } = getProduct(this.state.activeProductId);
	        this.buildViewer(category, product);
	      }
	    }
	    // fov + aspect are final above — refit the home dolly so the wall never clips at narrow
	    // landscape aspects. Boot (no state yet) starts on home framing; category/viewer stay put.
	    if (!this.state || this.state.mode === "home" || this.state.mode === "intro") {
	      this.targetCamera.x = mobile ? -4 : homeCameraX(this.camera.aspect);
	      this.targetCamera.y = mobile ? MOBILE_HOME_Y : homeCameraY(this.camera.aspect);
	      this.targetCamera.z = mobile
	        ? MOBILE_HOME_CAMERA_Z
	        : homeCameraZ(this.camera.aspect, THREE.MathUtils.degToRad(this.camera.fov));
	      this.targetLook.x = this.targetCamera.x;
	      this.targetLook.y = mobile ? MOBILE_HOME_Y : homeLookY(this.camera.aspect);
	      this.applyHomeLayout();
	      this.setIntroLayout();
	      this.setHoveredHomeZone(null);
	      this.canvas.style.cursor = "";
	    } else if (this.state.mode === "category") {
	      this.setCategoryCamera();
	      this.updateCategoryGrid();
	    } else if (this.state.mode === "viewer") {
	      this.targetCamera.copy(mobile ? VIEWER_MOBILE_CAMERA : VIEWER_CAMERA);
	      this.targetLook.copy(mobile ? VIEWER_MOBILE_LOOK : VIEWER_LOOK);
	    }
	    this.requestRender();
	  }

  renderScene() {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    const viewport = this.renderViewport ?? { left: 0, top: 0, width, height };
    this.renderer.setScissorTest(false);
    this.renderer.setViewport(0, 0, width, height);
    this.renderer.clear(true, true, true);

    const bottom = height - viewport.top - viewport.height;
    this.renderer.setViewport(viewport.left, bottom, viewport.width, viewport.height);
    this.renderer.setScissor(viewport.left, bottom, viewport.width, viewport.height);
    this.renderer.setScissorTest(true);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setScissorTest(false);
  }

  requestRender() {
    this.needsRender = true;
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = Math.min(this.clock.getDelta(), 0.04);
    // `busy` = something is still moving this frame, so we must draw and keep drawing.
    let busy = false;

    if (this.transition) {
      this.updateTransition(delta);
      busy = true;
    } else {
      const cameraEase = 1 - Math.exp(-delta * 3.1);
      const lookEase = 1 - Math.exp(-delta * 3.6);
      this.camera.position.lerp(this.targetCamera, cameraEase);
      this.look.lerp(this.targetLook, lookEase);
      if (
        this.camera.position.distanceToSquared(this.targetCamera) > CAMERA_SETTLE_EPS ||
        this.look.distanceToSquared(this.targetLook) > CAMERA_SETTLE_EPS
      ) {
        busy = true;
      } else {
        // Snap to target so the settled check stays true and the loop can rest.
        this.camera.position.copy(this.targetCamera);
        this.look.copy(this.targetLook);
      }
    }
    if (this.viewerProduct) {
      this.viewerProduct.rotation.y += (this.viewerOrbit - this.viewerProduct.rotation.y) * 0.12;
      if (Math.abs(this.viewerOrbit - this.viewerProduct.rotation.y) > EASE_SETTLE_EPS) busy = true;
    }
	    if (this.homeZones) {
	      this.homeZones.forEach((entry) => {
	        const active = entry === this.hoveredHomeZone && this.state?.mode === "home" && !this.transition;
	        const revealScale = smooth01(entry.revealProgress ?? 1);
	        // Product roots reveal around their own pivots below. The zone itself stays at its
	        // final transform so the product cannot drift from a false spawn point.
	        const targetScale = (entry.layoutScale ?? 1) * (active ? 1.065 : 1);
        const targetZ = active ? 0.2 : 0;
        entry.group.visible = revealScale > 0.01;
        entry.group.scale.setScalar(entry.group.scale.x + (targetScale - entry.group.scale.x) * 0.14);
        entry.group.position.z += (targetZ - entry.group.position.z) * 0.16;
        if (
          (entry.revealProgress ?? 1) < 1 ||
          Math.abs(targetScale - entry.group.scale.x) > EASE_SETTLE_EPS ||
          Math.abs(targetZ - entry.group.position.z) > EASE_SETTLE_EPS
        ) busy = true;
        entry.products?.forEach((item) => {
          if (item.object.userData?.transitionAnchor || item.object.parent !== entry.group) return;
          item.object.position.copy(item.basePosition);
          item.object.scale.copy(item.baseScale).multiplyScalar(Math.max(0.001, revealScale));
        });
        entry.revealDecor?.forEach((item) => {
          item.object.position.copy(item.basePosition);
          item.object.scale.copy(item.baseScale).multiplyScalar(Math.max(0.001, revealScale));
        });
      });
    }
    if (this.gridBays) {
      this.gridBays.forEach((entry) => {
        if (!this.transition && entry.revealProgress < 1) {
          entry.revealProgress = Math.min(1, entry.revealProgress + delta * 3.6);
        }
        const edgeScale = entry.edgeScale ?? 1;
        const active = edgeScale > 0.72 && entry === this.hoveredEntry;
        const revealScale = smooth01(entry.revealProgress ?? 1);
        const targetBayScale = edgeScale * revealScale;
        const productScaleMul = active ? 1.12 : 1;
        const targetProductZ = entry.productBaseZ + (1 - revealScale) * PRODUCT_LATCH_DISTANCE + (active ? 0.16 : 0);
        entry.bay.visible = edgeScale > 0.035 || entry.bay.scale.x > 0.04;
        entry.bay.scale.setScalar(entry.bay.scale.x + (targetBayScale - entry.bay.scale.x) * 0.18);
        if (entry.targetPosition) {
          entry.bay.position.lerp(entry.targetPosition, 0.2);
          entry.bay.rotation.y += ((entry.targetRotationY ?? 0) - entry.bay.rotation.y) * 0.2;
          if (
            entry.bay.position.distanceToSquared(entry.targetPosition) > CAMERA_SETTLE_EPS ||
            Math.abs((entry.targetRotationY ?? 0) - entry.bay.rotation.y) > EASE_SETTLE_EPS
          ) busy = true;
        } else {
          entry.bay.position.z += (0 - entry.bay.position.z) * 0.18;
          if (Math.abs(entry.bay.position.z) > EASE_SETTLE_EPS) busy = true;
        }
        entry.productDisplay.scale.x += (entry.productBaseScale.x * productScaleMul - entry.productDisplay.scale.x) * 0.2;
        entry.productDisplay.scale.y += (entry.productBaseScale.y * productScaleMul - entry.productDisplay.scale.y) * 0.2;
        entry.productDisplay.scale.z += (entry.productBaseScale.z * productScaleMul - entry.productDisplay.scale.z) * 0.2;
        entry.productDisplay.position.z += (targetProductZ - entry.productDisplay.position.z) * 0.2;
        if (
          (entry.revealProgress ?? 1) < 1 ||
          Math.abs(targetBayScale - entry.bay.scale.x) > EASE_SETTLE_EPS ||
          Math.abs(entry.productBaseScale.x * productScaleMul - entry.productDisplay.scale.x) > EASE_SETTLE_EPS ||
          Math.abs(targetProductZ - entry.productDisplay.position.z) > EASE_SETTLE_EPS
        ) busy = true;
        if (entry.hoverGlow) entry.hoverGlow.visible = active;
      });
    }
	    if (this.updateLayeredStacks(delta)) busy = true;

	    if (busy) this.needsRender = true;
	    if (this.needsRender) {
	      this.camera.lookAt(this.look);
	      this.renderScene();
	      this.renderCount += 1;
	      this.needsRender = false;
	    }
	  }

  updateTransition(delta) {
    const transition = this.transition;
    transition.elapsed = Math.max(transition.elapsed + delta, (performance.now() - transition.startedAt) / 1000);
    const elapsed = transition.elapsed;

    if (transition.introToHome) {
      const logoMove = smooth01((elapsed - 0.28) / 0.82);
      this.wallLogo.position.lerpVectors(transition.logoStart.position, transition.logoEnd.position, logoMove);
      this.wallLogo.scale.lerpVectors(transition.logoStart.scale, transition.logoEnd.scale, logoMove);
      if (this.logoPool) {
        this.logoPool.position.lerpVectors(transition.logoStart.poolPosition, transition.logoEnd.poolPosition, logoMove);
        this.logoPool.scale.lerpVectors(transition.logoStart.poolScale, transition.logoEnd.poolScale, logoMove);
      }

      this.introCopyItems?.forEach((item, index) => {
        const hide = smooth01((elapsed - index * 0.12) / 0.26);
        item.visible = hide < 0.985;
        item.position.copy(item.userData.introBasePosition);
        item.position.z += hide * 0.09;
        item.scale.copy(item.userData.introBaseScale).multiplyScalar(Math.max(0.001, 1 - hide * 0.28));
      });

      this.homeGalleryRevealItems.forEach((entry, index) => {
        const reveal = smooth01(
          (elapsed - HOME_GALLERY_REVEAL_START - index * HOME_GALLERY_REVEAL_INTERVAL)
          / HOME_GALLERY_REVEAL_DURATION,
        );
        entry.revealProgress = reveal;
        entry.group.visible = reveal > 0.01;
        entry.products.forEach((item) => {
          if (!item.object.visible || item.object.parent !== entry.group) return;
          item.object.position.copy(item.basePosition);
        });
      });
    }

    transition.outgoingItems.forEach(({ object, index, scale, position, isBay }) => {
      const settle = smooth01((elapsed - index * transition.outgoingStagger) / transition.outgoingDuration);
      object.scale.copy(scale).multiplyScalar(1 - settle * (isBay ? 0.18 : 0.08));
      object.position.copy(position);
      if (isBay) object.position.z -= settle * 0.18;
      object.visible = settle < 0.98;
    });

    if (transition.source && transition.sourceStart && transition.sourceEnd) {
      const move = smooth01((elapsed - transition.sourceMoveAt) / transition.sourceMoveDuration);
      const detach = smooth01((elapsed - transition.sourceMoveAt) / 0.18) * (1 - move);
      transition.source.position.lerpVectors(transition.sourceStart, transition.sourceEnd, move);
      transition.source.position.z += detach * 0.22 + Math.sin(move * Math.PI) * 0.2;
      transition.source.scale.lerpVectors(transition.sourceStartScale, transition.sourceEndScale, move);
      if (transition.sourceStartQuaternion && transition.sourceEndQuaternion) {
        transition.source.quaternion.slerpQuaternions(transition.sourceStartQuaternion, transition.sourceEndQuaternion, move);
      }
      transition.source.visible = true;
    }

    // Home has its own per-section sequence. Applying the generic destination-bay reveal here
    // overwrote the Wall Art zone's 0.285 portrait scale with 0.9–1.0 until transition end.
    if (transition.destinationBay && this.state?.mode !== "home") {
      const reveal = smooth01((elapsed - transition.destinationRevealAt) / 0.24);
      transition.destinationBay.visible = reveal > 0;
      const base = transition.destinationBayBaseScale ?? new THREE.Vector3(1, 1, 1);
      transition.destinationBay.scale.copy(base).multiplyScalar(Math.max(0.001, 0.9 + reveal * 0.1));
    }

    if (this.state?.mode !== "home" && !transition.source && transition.destinationProduct && transition.destinationProductBasePosition) {
      const reveal = smooth01((elapsed - transition.destinationRevealAt) / 0.42);
      transition.destinationProduct.visible = reveal > 0;
      transition.destinationProduct.position.copy(transition.destinationProductBasePosition);
      transition.destinationProduct.position.z += (1 - reveal) * PRODUCT_LATCH_DISTANCE;
    } else if (this.state?.mode !== "home" && !transition.source && transition.destinationProduct) {
      transition.destinationProduct.visible = elapsed >= transition.destinationRevealAt;
    }

    if (this.state?.mode === "category" && this.categoryDescription) {
      const glyphs = this.categoryDescription.userData.revealGlyphs ?? [];
      const interval = Math.min(0.012, 0.85 / Math.max(1, glyphs.length));
      glyphs.forEach((glyph, index) => {
        const reveal = smooth01((elapsed - transition.categoryTextAt - index * interval) / 0.12);
        glyph.visible = reveal > 0;
        glyph.scale.copy(glyph.userData.revealBaseScale).multiplyScalar(0.78 + reveal * 0.22);
        glyph.position.copy(glyph.userData.revealBasePosition);
        glyph.position.z += (1 - reveal) * 0.055;
      });
      const dividerAt = transition.categoryTextAt + this.categoryDescription.userData.titleGlyphCount * interval + 0.08;
      if (this.categoryDescription.userData.revealDivider) {
        this.categoryDescription.userData.revealDivider.visible = elapsed >= dividerAt;
      }
    }

    const cameraProgress = smooth01((elapsed - transition.cameraMoveAt) / transition.cameraMoveDuration);
    this.camera.position.lerpVectors(transition.cameraStart, transition.cameraEnd, cameraProgress);
    this.look.lerpVectors(transition.lookStart, transition.lookEnd, cameraProgress);

    if (this.state?.mode === "category" && this.gridBays) {
      this.gridBays.forEach((entry) => {
        const interval = this.isMobileLayout() ? 0.2 : 0.11;
        entry.revealProgress = THREE.MathUtils.clamp((elapsed - transition.gridRevealAt - entry.revealIndex * interval) / 0.42, 0, 1);
      });
    }

    if (this.state?.mode === "home" && this.homeZones && !transition.introToHome) {
      this.homeZones.forEach((entry) => {
        entry.revealProgress = THREE.MathUtils.clamp(
          (elapsed - transition.homeRevealAt - entry.revealIndex * HOME_GALLERY_REVEAL_INTERVAL)
          / HOME_GALLERY_REVEAL_DURATION,
          0,
          1,
        );
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
  const disposeResources = !object.userData?.usesSharedResources;
  object.traverse((child) => {
    if (disposeResources && child.geometry) child.geometry.dispose();
    if (disposeResources && child.material) {
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
