import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { categories } from '../data/storefront.js';

const HOME_CAMERA = new THREE.Vector3(0, 1.32, 7.1);
const HOME_TARGET = new THREE.Vector3(0, 1.24, -1.62);
// Blender BA_REAL_CAMERA is a 44mm lens → 44.5° horizontal FOV. We lock the web
// camera's horizontal FOV to the same so the home framing matches the .blend.
const BLENDER_HFOV_DEG = 44.5;
const PRODUCT_CAMERA_OFFSET = new THREE.Vector3(0.3, 0.15, 2.9);
const RIGHT_WALL_VIEWER = {
  position: new THREE.Vector3(1.7, 1.42, 0.62),
  focus: new THREE.Vector3(1.7, 1.42, 0.62),
  angle: -0.07,
};
// Collection array is staged in front of the right display wall and faces the
// viewer. Selecting a product hands off to RIGHT_WALL_VIEWER (same side of room).
const RIGHT_STAGE_CENTER = new THREE.Vector3(1.62, 1.32, 1.02);
const RIGHT_STAGE_CAMERA = new THREE.Vector3(1.58, 1.36, 6.1);
const RIGHT_STAGE_LOOK = new THREE.Vector3(1.62, 1.24, 0.9);
const WALL_ART_THICKNESS_M = 0.005;
const LAYER_THICKNESS_M = 0.003;
const DIGITAL_POSTER_THICKNESS_M = 0.003;
const LAYERED_MODEL_PATHS = {
  'bear-layered': '/models/layered/bear-layered.glb',
  'eclipse-mandala': '/models/layered/eclipse-mandala.glb',
  'mandala-layered': '/models/layered/mandala-layered.glb',
  'wolf-layered': '/models/layered/wolf-layered.glb',
};
const textureLoader = new THREE.TextureLoader();
const gltfLoader = new GLTFLoader();
const svgLoader = new SVGLoader();

// Real product artwork (served from /public). Cached so repeated products share one texture.
const textureCache = new Map();
function loadProductTexture(path) {
  if (textureCache.has(path)) return textureCache.get(path);
  const texture = textureLoader.load(path);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  textureCache.set(path, texture);
  return texture;
}
function imageMaterial(path, { transparent = false } = {}) {
  return new THREE.MeshStandardMaterial({
    map: loadProductTexture(path),
    transparent,
    alphaTest: transparent ? 0.5 : 0,
    roughness: 0.58,
    metalness: 0.04,
  });
}

function acrylicImageMaterial(path) {
  return new THREE.MeshPhysicalMaterial({
    map: loadProductTexture(path),
    roughness: 0.18,
    metalness: 0.02,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
  });
}

function cutoutImageMaterial(path, color = new THREE.Color(0x090909)) {
  const texture = loadProductTexture(path);
  return new THREE.ShaderMaterial({
    uniforms: {
      map: { value: texture },
      ink: { value: color },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D map;
      uniform vec3 ink;
      varying vec2 vUv;
      void main() {
        vec4 texel = texture2D(map, vUv);
        float backgroundDistance = distance(texel.rgb, vec3(0.57, 0.57, 0.57));
        float alpha = texel.a * smoothstep(0.12, 0.28, backgroundDistance);
        if (alpha < 0.04) discard;
        gl_FragColor = vec4(mix(texel.rgb, ink, 0.18), alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
  });
}

export async function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.82;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x332d26);
  scene.fog = new THREE.Fog(0x332d26, 16, 34);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 100);
  camera.position.copy(HOME_CAMERA);

  // Lock the camera's *horizontal* FOV to Blender's 44mm lens so the home view
  // frames the room exactly like the .blend, regardless of window aspect.
  // (three.js .fov is vertical, so we derive it from the target hfov + aspect.)
  function applyBlenderFov() {
    const hfov = THREE.MathUtils.degToRad(BLENDER_HFOV_DEG);
    const vfov = 2 * Math.atan(Math.tan(hfov / 2) / Math.max(camera.aspect, 0.0001));
    camera.fov = THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(vfov), 24, 46);
    camera.updateProjectionMatrix();
  }

  const state = {
    mode: 'home',
    activeCategory: null,
    activeProduct: null,
    hoveredCategory: null,
    selectedFilter: 'All',
    autoRotate: true,
    exploded: false,
    lightMode: 'gallery',
  };

  const listeners = new Set();
  const pointer = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const targetCamera = HOME_CAMERA.clone();
  const targetLook = HOME_TARGET.clone();
  const look = HOME_TARGET.clone();
  const clickable = [];
  const categoryGroups = new Map();
  const categoryHighlights = new Map();
  const categoryProductGroups = new Map();
  let viewerGroup = null;
  let dragging = false;
  let dragX = 0;

  const approvedGallery = await loadApprovedGallery();
  const room = approvedGallery.scene;
  scene.add(room);
  const galleryWolf = createGalleryLayeredWolfDisplay(approvedGallery.wolfAnchor);
  scene.add(galleryWolf);
  scene.add(createReferenceWallSkins());
  scene.add(createReferenceFloor());
  scene.add(createFloorReflectionOverlay());

  const lights = createLighting();
  scene.add(lights.group);

  // Blender BA_REAL_CAMERA (0,7.8,1.22) aimed (0,0.55,1.08) mapped through the
  // GLB import transform: web = (-1.28·Bx, 1.28·Bz, 1.28·By).
  HOME_CAMERA.set(0, 1.56, 9.98);
  HOME_TARGET.set(0, 1.38, 0.7);
  camera.near = approvedGallery.camera?.near || 0.1;
  camera.far = approvedGallery.camera?.far || 200;
  applyBlenderFov();
  camera.position.copy(HOME_CAMERA);
  targetCamera.copy(HOME_CAMERA);
  targetLook.copy(HOME_TARGET);
  look.copy(HOME_TARGET);

  categories.forEach((category, index) => {
    const group = createCategoryZone(category, index);
    group.userData.targetOpacity = 0;
    group.userData.opacity = 0;
    setGroupOpacity(group, 0);
    categoryGroups.set(category.id, group);
    scene.add(group);
    clickable.push(group.userData.hitTarget);

    const highlight = createCategoryHighlight(category);
    categoryHighlights.set(category.id, highlight);
    scene.add(highlight);
  });

  function emit() {
    const snapshot = {
      ...state,
      categories,
      activeCategory: state.activeCategory,
      activeProduct: state.activeProduct,
    };
    listeners.forEach((listener) => listener(snapshot));
  }

  function enterCategory(categoryId, filter = 'All') {
    const category = categories.find((item) => item.id === categoryId);
    if (!category) return;

    state.mode = 'category';
    state.activeCategory = category;
    state.activeProduct = null;
    state.hoveredCategory = null;
    state.selectedFilter = filter;
    state.exploded = false;

    disposeViewer();
    room.visible = true;
    room.userData.targetOpacity = 1;
    // Tuck the home display zones + hover frames away; the collection takes over.
    categoryGroups.forEach((group) => {
      group.userData.targetOpacity = 0;
      group.userData.targetScale = 1;
      group.userData.targetX = group.userData.homeX;
    });
    categoryHighlights.forEach((highlight) => {
      highlight.userData.targetOpacity = 0;
      highlight.userData.targetScale = 1;
    });

    showCategoryProducts(category, filter);
    targetCamera.copy(RIGHT_STAGE_CAMERA);
    targetLook.copy(RIGHT_STAGE_LOOK);
    emit();
  }

  function hoverCategory(categoryId) {
    const category = categories.find((item) => item.id === categoryId);
    state.hoveredCategory = category ?? null;
    if (state.mode !== 'home') return;

    // Home stays a clean static composition: feedback is the gold highlight frame
    // (driven from update via state.hoveredCategory) plus a gentle camera lean.
    categoryGroups.forEach((group) => {
      group.visible = true;
      group.userData.targetOpacity = 0;
      group.userData.targetScale = 1;
      group.userData.targetX = group.userData.homeX;
    });
    targetCamera.copy(HOME_CAMERA);
    targetLook.copy(category?.wallPosition ? new THREE.Vector3(...category.wallPosition).lerp(HOME_TARGET, 0.5) : HOME_TARGET);
    emit();
  }

  function clearCategoryHover() {
    state.hoveredCategory = null;
    if (state.mode !== 'home') return;
    categoryGroups.forEach((group) => {
      group.userData.targetOpacity = 0;
      group.userData.targetScale = 1;
    });
    targetCamera.copy(HOME_CAMERA);
    targetLook.copy(HOME_TARGET);
    emit();
  }

  function showCategoryProducts(category, filter = 'All') {
    categoryProductGroups.forEach((group) => {
      scene.remove(group);
      group.traverse((child) => {
        child.geometry?.dispose?.();
        if (child.material?.dispose) child.material.dispose();
      });
    });
    categoryProductGroups.clear();
    clickable.splice(0, clickable.length, ...[...categoryGroups.values()].map((group) => group.userData.hitTarget));

    const group = createCollectionStage(category, filter);
    categoryProductGroups.set(category.id, group);
    scene.add(group);
    group.userData.hitTargets.forEach((target) => clickable.push(target));
  }

  function setFilter(filter) {
    if (!state.activeCategory) return;
    state.selectedFilter = filter;
    showCategoryProducts(state.activeCategory, filter);
    emit();
  }

  function openProduct(productId, categoryId = state.activeCategory?.id ?? state.hoveredCategory?.id) {
    const category = categories.find((item) => item.id === categoryId) ?? state.activeCategory;
    if (!category) return;
    const product = category.products.find((item) => item.id === productId);
    if (!product) return;

    state.mode = 'product';
    state.activeCategory = category;
    state.activeProduct = product;
    state.hoveredCategory = null;
    state.exploded = false;
    categoryProductGroups.forEach((group) => (group.visible = false));
    room.visible = true;
    room.userData.targetOpacity = 1;
    categoryGroups.forEach((group, id) => {
      group.visible = id === category.id;
      group.userData.targetOpacity = 0;
      group.userData.targetScale = id === category.id ? 1.04 : 1;
    });

    disposeViewer();
    viewerGroup = createProductViewer(product, category);
    scene.add(viewerGroup);

    const focus = viewerGroup.userData.focus;
    targetLook.copy(focus);
    targetCamera.copy(focus).add(PRODUCT_CAMERA_OFFSET);
    emit();
  }

  function back() {
    if (state.mode === 'product' && state.activeCategory) {
      const categoryId = state.activeCategory.id;
      enterCategory(categoryId, state.selectedFilter);
      return;
    }
    goHome();
  }

  function goHome() {
    state.mode = 'home';
    state.activeCategory = null;
    state.activeProduct = null;
    state.hoveredCategory = null;
    state.selectedFilter = 'All';
    state.exploded = false;
    room.visible = true;
    room.userData.targetOpacity = 1;
    disposeViewer();
    categoryProductGroups.forEach((group) => {
      scene.remove(group);
      group.traverse((child) => {
        child.geometry?.dispose?.();
        if (child.material?.dispose) child.material.dispose();
      });
    });
    categoryProductGroups.clear();
    clickable.splice(0, clickable.length, ...[...categoryGroups.values()].map((group) => group.userData.hitTarget));
    categoryGroups.forEach((group) => {
      group.visible = true;
      group.userData.targetOpacity = 0;
      group.userData.targetScale = 1;
      group.userData.targetX = group.userData.homeX;
      group.rotation.set(0, 0, 0);
    });
    categoryHighlights.forEach((group) => {
      group.userData.targetOpacity = 0;
      group.userData.targetScale = 1;
    });
    targetCamera.copy(HOME_CAMERA);
    targetLook.copy(HOME_TARGET);
    emit();
  }

  function setControl(control) {
    if (control === 'rotate') state.autoRotate = !state.autoRotate;
    if (control === 'layers') state.exploded = !state.exploded;
    if (control === 'light') {
      state.lightMode = state.lightMode === 'gallery' ? 'inspect' : 'gallery';
      lights.key.intensity = state.lightMode === 'gallery' ? 30 : 38;
      lights.fill.intensity = state.lightMode === 'gallery' ? 0.9 : 1.25;
    }
    if (control === 'reset' && state.activeProduct) {
      viewerGroup.rotation.set(0, 0, 0);
      state.exploded = false;
    }
    emit();
  }

  function disposeViewer() {
    if (!viewerGroup) return;
    scene.remove(viewerGroup);
    viewerGroup.traverse((child) => {
      child.geometry?.dispose?.();
      if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose?.());
      else child.material?.dispose?.();
    });
    viewerGroup = null;
  }

  function onPointerDown(event) {
    if (state.mode === 'product') {
      dragging = true;
      dragX = event.clientX;
    }
  }

  function onPointerMove(event) {
    pointer.x = (event.clientX / innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / innerHeight) * 2 + 1;
    if (state.mode === 'home' && !dragging) {
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(clickable, true);
      const hit = hits.find((item) => item.object.userData.action === 'category');
      if (hit) hoverCategory(hit.object.userData.categoryId);
      else if (state.hoveredCategory && !event.target.closest?.('#ui')) clearCategoryHover();
    }
    if (!dragging || !viewerGroup) return;
    const delta = event.clientX - dragX;
    dragX = event.clientX;
    viewerGroup.rotation.y += delta * 0.008;
  }

  function onPointerUp(event) {
    if (dragging) {
      dragging = false;
      return;
    }
    pointer.x = (event.clientX / innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(clickable, true);
    const hit = hits.find((item) => item.object.userData.action);
    if (!hit) return;
    const { action, categoryId, productId } = hit.object.userData;
    if (action === 'category' && state.mode === 'home') enterCategory(categoryId);
    if (action === 'product') openProduct(productId);
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    applyBlenderFov();
    renderer.setSize(innerWidth, innerHeight);
  });

  function update() {
    camera.position.lerp(targetCamera, 0.055);
    look.lerp(targetLook, 0.065);
    camera.lookAt(look);

    const time = performance.now() * 0.001;
    if (room.visible || room.userData.opacity > 0.01) {
      const roomOpacity = THREE.MathUtils.lerp(room.userData.opacity ?? 1, room.userData.targetOpacity ?? 1, 0.08);
      setGroupOpacity(room, roomOpacity);
      room.visible = roomOpacity > 0.025 || state.mode === 'home';
    }

    categoryGroups.forEach((group, id) => {
      const selected = state.activeCategory?.id === id;
      const floatY = state.mode === 'home' ? 0 : Math.sin(time + group.userData.phase) * (selected ? 0.018 : 0.026);
      group.position.y = THREE.MathUtils.lerp(group.position.y, floatY, 0.12);
      group.position.x = THREE.MathUtils.lerp(group.position.x, group.userData.targetX ?? group.userData.homeX, 0.08);
      const nextScale = THREE.MathUtils.lerp(group.scale.x, group.userData.targetScale ?? 1, 0.07);
      group.scale.setScalar(nextScale);
      const opacity = THREE.MathUtils.lerp(group.userData.opacity ?? 1, group.userData.targetOpacity ?? 1, 0.08);
      setGroupOpacity(group, opacity);
      if (state.mode !== 'home' && !selected && opacity < 0.025) group.visible = false;
    });

    categoryHighlights.forEach((highlight, id) => {
      const hovered = state.hoveredCategory?.id === id && state.mode === 'home';
      highlight.userData.targetOpacity = hovered ? 1 : 0;
      highlight.userData.targetScale = hovered ? 1.045 : 1;
      highlight.scale.setScalar(THREE.MathUtils.lerp(highlight.scale.x, highlight.userData.targetScale, 0.1));
      setGroupOpacity(highlight, THREE.MathUtils.lerp(highlight.userData.opacity ?? 0, highlight.userData.targetOpacity, 0.12));
    });

    categoryProductGroups.forEach((group) => {
      group.children.forEach((child, index) => {
        if (!child.userData.floats) return;
        if (child.userData.targetScale) {
          const scale = THREE.MathUtils.lerp(child.scale.x, child.userData.targetScale, 0.08);
          child.scale.setScalar(scale);
        }
        const homeY = child.userData.homeY ?? child.position.y;
        child.position.y = homeY + Math.sin(time * 1.2 + index) * 0.018;
        child.rotation.y = Math.sin(time * 0.55 + index) * 0.055;
      });
    });

    if (viewerGroup) {
      if (state.autoRotate && !dragging) viewerGroup.rotation.y += 0.004;
      viewerGroup.userData.layers?.forEach((layer, index) => {
        const targetZ = state.exploded ? index * -0.08 : layer.userData.restZ ?? layer.position.z;
        layer.position.z += (targetZ - layer.position.z) * 0.08;
      });
    }

    const baseKey = state.lightMode === 'gallery' ? 30 : 38;
    lights.key.intensity = state.mode === 'home' ? baseKey : baseKey + Math.sin(time * 0.7) * 0.6;
  }

  emit();

  return {
    renderer,
    scene,
    camera,
    update,
    enterCategory,
    hoverCategory,
    clearCategoryHover,
    setFilter,
    openProduct,
    back,
    goHome,
    setControl,
    onStateChange(listener) {
      listeners.add(listener);
      listener({ ...state, categories });
      return () => listeners.delete(listener);
    },
  };
}

async function loadApprovedGallery() {
  const gltf = await gltfLoader.loadAsync('/models/ba-gallery-approved.glb');
  const gallery = gltf.scene;
  gallery.name = 'BA_GALLERY_APPROVED_GLTF';
  gallery.rotation.y = Math.PI;
  gallery.scale.setScalar(1.28);
  gallery.userData.targetOpacity = 1;
  gallery.userData.opacity = 1;
  const materials = createReferenceMaterials();

  gallery.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.material = materialForApprovedObject(child, materials);
      normalizeApprovedGalleryMesh(child);
    }
    if (child.isLight) {
      child.visible = false;
      child.intensity = 0;
    }
  });

  gallery.updateMatrixWorld(true);
  const wolfBox = new THREE.Box3();
  let hasWolfBox = false;
  gallery.traverse((child) => {
    if (!child.isMesh || !child.name.match(/BA_REAL_WOLF_L\d+/i)) return;
    wolfBox.expandByObject(child);
    hasWolfBox = true;
  });
  const wolfAnchor = hasWolfBox
    ? {
      center: wolfBox.getCenter(new THREE.Vector3()),
      size: wolfBox.getSize(new THREE.Vector3()),
    }
    : null;
  let camera = null;
  gallery.traverse((child) => {
    if (child.isCamera && (!camera || child.name === 'BA_REAL_CAMERA')) camera = child;
  });
  return { scene: gallery, camera, wolfAnchor };
}

function normalizeApprovedGalleryMesh(object) {
  const layerMatch = object.name.match(/BA_REAL_WOLF_L(\d+)/i);
  if (layerMatch) {
    object.visible = false;
    object.castShadow = false;
    object.receiveShadow = false;
    return;
  }

  const name = object.name.toUpperCase();
  const sourceName = Array.isArray(object.material)
    ? object.material.map((material) => material?.name).join(' ').toUpperCase()
    : object.material?.name?.toUpperCase() ?? '';
  const key = `${name} ${sourceName}`;
  if (key.includes('WALL') || key.includes('CONCRETE') || key.includes('REVEAL')) {
    object.receiveShadow = false;
  }
  if (
    key.includes('LABEL')
    || key.includes('LEDGE')
    || key.includes('SHELF')
    || key.includes('SKIRTING')
    || key.includes('UNDERLIGHT')
    || key.includes('COVE')
    || key.includes('LOGO')
  ) {
    object.castShadow = false;
    object.receiveShadow = false;
  }
}

function materialForApprovedObject(object, materials) {
  const name = object.name;
  const sourceName = Array.isArray(object.material)
    ? object.material.map((material) => material?.name).join(' ')
    : object.material?.name ?? '';
  const key = `${name} ${sourceName}`;

  if (key.includes('DIGITAL') || key.includes('IRONMAN')) return object.material;
  if (key.includes('WALLART') || key.includes('HORSE') || key.includes('LOGO') || key.includes('LABEL')) return materials.blackSatin;
  if (key.includes('WOLF')) return galleryWolfLayerMaterial(object, materials);
  if (key.includes('SPHERE') || key.includes('BLACK_OBJ')) return materials.blackObject;
  if (key.includes('SHELF') || key.includes('LEDGE') || key.includes('SKIRTING') || key.includes('GREY_WOOD')) return materials.blackFixture;
  if (key.includes('UNDERLIGHT') || key.includes('COVE')) return materials.warmEmitter;
  if (key.includes('ROOF') || key.includes('CEIL')) return materials.ceilingPlaster;
  if (key.includes('FLOOR')) return materials.floorStone;
  if (key.includes('WALL') || key.includes('CONCRETE') || key.includes('REVEAL')) return materials.wallPlaster;
  return object.material;
}

function createReferenceMaterials() {
  const wallMap = createNoiseTexture({
    base: '#7f725f',
    speck: 'rgba(28, 24, 20, 0.12)',
    vein: 'rgba(200, 186, 160, 0)',
    width: 1024,
    height: 1024,
    veinCount: 0,
  });
  const floorMap = createNoiseTexture({
    base: '#453b31',
    speck: 'rgba(226, 204, 168, 0.09)',
    vein: 'rgba(24, 20, 16, 0.055)',
    width: 1024,
    height: 1024,
    veinCount: 8,
  });

  wallMap.wrapS = wallMap.wrapT = THREE.ClampToEdgeWrapping;
  wallMap.repeat.set(1, 1);
  floorMap.wrapS = floorMap.wrapT = THREE.RepeatWrapping;
  floorMap.repeat.set(3.2, 3.2);

  return {
    wallPlaster: new THREE.MeshStandardMaterial({
      color: 0x867660,
      map: wallMap,
      roughness: 0.82,
      metalness: 0.02,
    }),
    ceilingPlaster: new THREE.MeshStandardMaterial({
      color: 0x2a2118,
      map: wallMap,
      roughness: 0.82,
      metalness: 0.04,
    }),
    // Blender BA_MAT_WOOD_FLOOR: warm matte wood (albedo ~0.28,0.18,0.10,
    // roughness 0.55, metallic 0) — NOT a polished mirror.
    floorStone: new THREE.MeshStandardMaterial({
      color: 0x6f4d2c,
      map: floorMap,
      roughness: 0.5,
      metalness: 0.04,
      envMapIntensity: 0.4,
    }),
    blackFixture: new THREE.MeshStandardMaterial({ color: 0x070604, roughness: 0.4, metalness: 0.18 }),
    blackObject: new THREE.MeshPhysicalMaterial({ color: 0x020202, roughness: 0.28, metalness: 0.34, clearcoat: 0.5 }),
    blackRelief: new THREE.MeshStandardMaterial({ color: 0x030302, roughness: 0.48, metalness: 0.16 }),
    wolfLayerMaterials: [
      new THREE.MeshStandardMaterial({ color: 0x060504, roughness: 0.5, metalness: 0.08, side: THREE.DoubleSide }),
      new THREE.MeshStandardMaterial({ color: 0x24211d, roughness: 0.54, metalness: 0.06, side: THREE.DoubleSide }),
      new THREE.MeshStandardMaterial({ color: 0x5d5549, roughness: 0.58, metalness: 0.05, side: THREE.DoubleSide }),
      new THREE.MeshStandardMaterial({ color: 0x948873, roughness: 0.62, metalness: 0.04, side: THREE.DoubleSide }),
    ],
    blackSatin: new THREE.MeshBasicMaterial({ color: 0x020202 }),
    warmEmitter: new THREE.MeshStandardMaterial({
      color: 0xffd49a,
      emissive: 0xffba75,
      emissiveIntensity: 4.2,
      roughness: 0.2,
    }),
  };
}

function galleryWolfLayerMaterial(object, materials) {
  const match = object.name.match(/BA_REAL_WOLF_L(\d+)/i);
  if (!match) return materials.blackRelief;
  const index = Math.max(0, Math.min(materials.wolfLayerMaterials.length - 1, Number(match[1]) - 1));
  return materials.wolfLayerMaterials[index];
}

function createReferenceFloor() {
  const group = new THREE.Group();
  const floorMap = createFloorTileTexture();
  floorMap.wrapS = floorMap.wrapT = THREE.RepeatWrapping;
  floorMap.repeat.set(1.15, 1.0);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(9.6, 6.2),
    // Matte warm wood to match Blender BA_MAT_WOOD_FLOOR (a light sheen only,
    // not the previous chrome-grey mirror that washed the home view out).
    new THREE.MeshPhysicalMaterial({
      color: 0x66472a,
      map: floorMap,
      roughness: 0.46,
      metalness: 0.05,
      clearcoat: 0.18,
      clearcoatRoughness: 0.4,
      reflectivity: 0.3,
      envMapIntensity: 0.45,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0.018, 2.05);
  floor.receiveShadow = true;
  group.add(floor);

  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(8.8, 1.1),
    new THREE.MeshBasicMaterial({
      color: 0xffb873,
      transparent: true,
      opacity: 0.035,
      depthWrite: false,
    }),
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.set(0, 0.022, -0.65);
  group.add(glow);

  return group;
}

function createGalleryLayeredWolfDisplay(anchor) {
  const group = new THREE.Group();
  group.position.copy(anchor?.center ?? new THREE.Vector3(1.52, 1.28, -1.16));
  group.position.x = anchor?.center?.x ?? 1.69;
  group.position.y = anchor?.center?.y ?? 1.43;
  group.position.z = (anchor?.center?.z ?? 0.34) + 0.22;
  group.scale.setScalar(1);
  group.rotation.y = -0.07;
  group.add(createLayeredImageStack('/products/layered/wolf.png', {
    width: 0.72,
    height: 0.82,
    layers: 5,
    gap: 0.022,
  }));

  return group;
}

function createLayeredImageStack(path, { width = 0.78, height = 0.86, layers = 5, gap = 0.018 } = {}) {
  const group = new THREE.Group();
  group.userData.layers = [];

  for (let i = 0; i < layers; i += 1) {
    const t = i / Math.max(layers - 1, 1);
    const color = new THREE.Color().lerpColors(new THREE.Color(0x070604), new THREE.Color(0x9a907c), t);
    const material = cutoutImageMaterial(path, color);
    material.side = THREE.DoubleSide;
    const layer = new THREE.Mesh(
      new THREE.PlaneGeometry(width - i * 0.018, height - i * 0.018),
      material,
    );
    layer.position.z = i * -gap;
    layer.userData.layer = true;
    layer.userData.restZ = layer.position.z;
    layer.userData.thicknessM = LAYER_THICKNESS_M;
    layer.castShadow = true;
    group.userData.layers.push(layer);
    group.add(layer);
  }

  return group;
}

function createCategoryHighlight(category) {
  const layout = categoryWallLayout(category.id);
  const group = new THREE.Group();
  group.position.set(layout.x, layout.y, layout.z);
  group.rotation.y = layout.angle;
  group.userData.opacity = 0;
  group.userData.targetOpacity = 0;
  group.userData.targetScale = 1;

  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffc987,
    transparent: true,
    opacity: 0.001,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(layout.width, layout.height), glowMaterial);
  glow.position.z = 0.006;
  glow.renderOrder = 8;
  group.add(glow);

  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xffe0a8,
    transparent: true,
    opacity: 0.001,
    depthTest: false,
  });
  const halfW = layout.width * 0.5;
  const halfH = layout.height * 0.5;
  const borderGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-halfW, -halfH, 0.012),
    new THREE.Vector3(halfW, -halfH, 0.012),
    new THREE.Vector3(halfW, halfH, 0.012),
    new THREE.Vector3(-halfW, halfH, 0.012),
    new THREE.Vector3(-halfW, -halfH, 0.012),
  ]);
  const border = new THREE.Line(borderGeometry, lineMaterial);
  border.renderOrder = 9;
  group.add(border);

  const wash = new THREE.PointLight(0xffbf78, 0, 2.4);
  wash.position.set(0, 0.1, 0.52);
  group.add(wash);
  group.userData.light = wash;
  return group;
}

function categoryWallLayout(categoryId) {
  const layouts = {
    'wall-art': { x: -3.1, y: 1.34, z: 1.05, angle: 0.1, width: 1.18, height: 1.42 },
    'digital-art': { x: -1.69, y: 1.42, z: 0.48, angle: 0.04, width: 1.18, height: 1.48 },
    'layered-art': { x: 1.69, y: 1.43, z: 0.56, angle: -0.07, width: 1.2, height: 1.48 },
    '3d-objects': { x: 2.98, y: 1.48, z: 1.18, angle: -0.1, width: 1.32, height: 1.58 },
  };
  return layouts[categoryId] ?? { x: 0, y: 1.3, z: -1.36, angle: 0, width: 1.3, height: 1.5 };
}

function createReferenceWallSkins() {
  const group = new THREE.Group();
  const texture = createNoiseTexture({
    base: '#8d806e',
    speck: 'rgba(31, 27, 22, 0.07)',
    vein: 'rgba(200, 186, 160, 0)',
    width: 1024,
    height: 1024,
    veinCount: 0,
  });
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1, 1);

  const material = new THREE.MeshStandardMaterial({
    color: 0x8f816d,
    map: texture,
    roughness: 0.9,
    metalness: 0.01,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  [
    { x: 0, y: 1.24, z: -1.885, width: 1.9, height: 2.18, angle: 0 },
    { x: -1.52, y: 1.24, z: -1.665, width: 2.08, height: 2.18, angle: -0.26 },
    { x: 1.52, y: 1.24, z: -1.665, width: 2.08, height: 2.18, angle: 0.26 },
    { x: -3.05, y: 1.24, z: -1.065, width: 1.9, height: 2.18, angle: -0.52 },
    { x: 3.05, y: 1.24, z: -1.065, width: 1.9, height: 2.18, angle: 0.52 },
  ].forEach((segment) => {
    const skin = new THREE.Mesh(new THREE.PlaneGeometry(segment.width, segment.height), material);
    const normal = new THREE.Vector3(Math.sin(segment.angle), 0, Math.cos(segment.angle));
    skin.position.set(segment.x, segment.y, segment.z).addScaledVector(normal, 0.18);
    skin.rotation.y = segment.angle;
    skin.receiveShadow = false;
    group.add(skin);
  });

  return group;
}

function createFloorReflectionOverlay() {
  const canvas = document.createElement('canvas');
  canvas.width = 1400;
  canvas.height = 700;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const glow = ctx.createRadialGradient(canvas.width / 2, 90, 20, canvas.width / 2, 130, 620);
  glow.addColorStop(0, 'rgba(255, 224, 182, 0.2)');
  glow.addColorStop(0.5, 'rgba(255, 188, 126, 0.075)');
  glow.addColorStop(1, 'rgba(255, 178, 103, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 5; i += 1) {
    const x = 170 + i * 250;
    const gradient = ctx.createLinearGradient(x, 0, x + 80, canvas.height);
    gradient.addColorStop(0, 'rgba(255, 233, 198, 0.1)');
    gradient.addColorStop(0.42, 'rgba(255, 198, 140, 0.04)');
    gradient.addColorStop(1, 'rgba(255, 190, 125, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, 0, 82, canvas.height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const overlay = new THREE.Mesh(
    new THREE.PlaneGeometry(9.4, 4.4),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.06,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  overlay.rotation.x = -Math.PI / 2;
  overlay.position.set(0, 0.032, 1.4);
  return overlay;
}

function createFloorTileTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1400;
  canvas.height = 900;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#4c4237');
  gradient.addColorStop(0.52, '#3c342d');
  gradient.addColorStop(1, '#29231f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 3200; i += 1) {
    const alpha = Math.random() * 0.055;
    ctx.fillStyle = `rgba(218, 202, 174, ${alpha})`;
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }

  ctx.strokeStyle = 'rgba(12, 10, 9, 0.28)';
  ctx.lineWidth = 1.5;
  [0.25, 0.5, 0.75].forEach((x) => {
    ctx.beginPath();
    ctx.moveTo(canvas.width * x, 0);
    ctx.lineTo(canvas.width * x + 18, canvas.height);
    ctx.stroke();
  });
  [0.42, 0.74].forEach((y) => {
    ctx.beginPath();
    ctx.moveTo(0, canvas.height * y);
    ctx.lineTo(canvas.width, canvas.height * y + 10);
    ctx.stroke();
  });

  ctx.fillStyle = 'rgba(255, 225, 180, 0.035)';
  ctx.fillRect(0, 0, canvas.width, canvas.height * 0.28);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function createNoiseTexture({ base, speck, vein, width, height, veinCount = 18 }) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 3600; i += 1) {
    const alpha = Math.random() * 0.18;
    ctx.fillStyle = speck.replace(/[\d.]+\)$/u, `${alpha})`);
    ctx.fillRect(Math.random() * width, Math.random() * height, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }

  if (veinCount > 0) {
    ctx.strokeStyle = vein;
    ctx.lineWidth = 0.8;
    for (let i = 0; i < veinCount; i += 1) {
      const y = Math.random() * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= width; x += 80) {
        ctx.lineTo(x, y + Math.sin(x * 0.012 + i) * 5 + Math.random() * 2);
      }
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function createRoom() {
  const group = new THREE.Group();
  group.userData.targetOpacity = 1;
  group.userData.opacity = 1;
  const wallMaterial = new THREE.MeshStandardMaterial({
    map: createRoomTexture(),
    roughness: 0.86,
    metalness: 0.02,
    color: 0xd8cbbb,
  });
  const sideMaterial = new THREE.MeshStandardMaterial({ color: 0xcfc1ae, roughness: 0.86 });
  const darkShelfMaterial = new THREE.MeshStandardMaterial({ color: 0x171513, roughness: 0.54, metalness: 0.12 });
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xb9ac99, roughness: 0.27, metalness: 0.14 });

  const wallSegments = [
    { x: 0, z: -2, width: 1.9, angle: 0 },
    { x: -1.52, z: -1.78, width: 2.08, angle: -0.26 },
    { x: 1.52, z: -1.78, width: 2.08, angle: 0.26 },
    { x: -3.05, z: -1.18, width: 1.9, angle: -0.52 },
    { x: 3.05, z: -1.18, width: 1.9, angle: 0.52 },
    { x: -4.14, z: 0.24, width: 2.82, angle: Math.PI / 2 },
    { x: 4.14, z: 0.24, width: 2.82, angle: Math.PI / 2 },
  ];
  wallSegments.forEach((segment) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(segment.width, 3.05, 0.12), wallMaterial);
    wall.position.set(segment.x, 1.52, segment.z);
    wall.rotation.y = segment.angle;
    wall.receiveShadow = true;
    group.add(wall);
  });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.08, 5.7), floorMaterial);
  floor.position.set(0, -0.06, 0.65);
  floor.receiveShadow = true;
  group.add(floor);

  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.12, 5.7), new THREE.MeshStandardMaterial({ color: 0xb7a890, roughness: 0.9 }));
  ceiling.position.set(0, 3.05, 0.65);
  group.add(ceiling);

  const falseCeiling = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.08, 1.55), new THREE.MeshStandardMaterial({ color: 0xc8bba6, roughness: 0.72 }));
  falseCeiling.position.set(0, 2.82, -0.72);
  group.add(falseCeiling);

  const backCove = new THREE.Mesh(new THREE.BoxGeometry(5.55, 0.06, 0.07), emissiveStripMaterial());
  backCove.position.set(0, 2.76, -1.48);
  group.add(backCove);

  const floorCove = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.04, 0.04), emissiveStripMaterial(0xffdfad, 1.15));
  floorCove.position.set(0, 0.03, -1.88);
  group.add(floorCove);

  const leftTrack = createCeilingTrack(-3.25);
  const rightTrack = createCeilingTrack(3.25);
  group.add(leftTrack, rightTrack);

  const logo = createLogoPlane(1.08, 1.08);
  logo.position.set(0, 2.34, -1.925);
  group.add(logo);

  const centerPlinth = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.9, 0.38), darkShelfMaterial);
  centerPlinth.position.set(-0.35, 0.44, -1.2);
  centerPlinth.castShadow = true;
  centerPlinth.receiveShadow = true;
  const lowBlock = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.52, 0.48), darkShelfMaterial);
  lowBlock.position.set(0.35, 0.25, -1.12);
  lowBlock.castShadow = true;
  lowBlock.receiveShadow = true;
  const vase = new THREE.Mesh(new THREE.SphereGeometry(0.16, 32, 20), darkShelfMaterial);
  vase.scale.set(0.74, 1.55, 0.74);
  vase.position.set(-0.35, 0.99, -1.2);
  vase.castShadow = true;
  group.add(centerPlinth, lowBlock, vase);

  return group;
}

function createRoomTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#f5f3ee');
  gradient.addColorStop(0.58, '#e6e1d8');
  gradient.addColorStop(1, '#d7d0c6');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(55, 49, 43, 0.1)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 7; i += 1) {
    const x = 88 + i * 142;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + Math.sin(i) * 8, canvas.height);
    ctx.stroke();
  }

  for (let i = 0; i < 900; i += 1) {
    const alpha = Math.random() * 0.045;
    ctx.fillStyle = `rgba(28, 25, 22, ${alpha})`;
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.fillRect(46, 58, 932, 322);
  ctx.strokeStyle = 'rgba(40, 34, 30, 0.09)';
  ctx.strokeRect(46, 58, 932, 322);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function createLogoPlane(width, height) {
  const texture = textureLoader.load('/logo-blackaesthetics.svg', (loaded) => {
    loaded.needsUpdate = true;
  });
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
}

function emissiveStripMaterial(color = 0xffedcd, intensity = 1.35) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: intensity,
    roughness: 0.3,
    metalness: 0,
  });
}

function createCeilingTrack(x) {
  const group = new THREE.Group();
  const trackMat = new THREE.MeshStandardMaterial({ color: 0x171513, roughness: 0.34, metalness: 0.42 });
  const lightMat = emissiveStripMaterial(0xffd59b, 1.7);
  const track = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 5.0), trackMat);
  track.position.set(x, 3.42, 0.6);
  group.add(track);

  [-1.25, -0.25, 0.75, 1.75].forEach((z) => {
    const spot = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.04, 18), lightMat);
    spot.rotation.x = Math.PI / 2;
    spot.position.set(x, 3.36, z);
    group.add(spot);
  });
  return group;
}

function createLighting() {
  const group = new THREE.Group();
  const hemi = new THREE.HemisphereLight(0xffead5, 0x120d0a, 0.2);
  const key = new THREE.SpotLight(0xffd6a4, 46, 10.5, Math.PI / 6.8, 0.78, 1.15);
  key.position.set(-2.5, 3.85, 2.7);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = 0.0012;
  key.shadow.normalBias = 0.035;

  const fill = new THREE.DirectionalLight(0xc7b194, 0.12);
  fill.position.set(3.8, 2.4, 4.2);

  const rim = new THREE.SpotLight(0xffc993, 28, 8.5, Math.PI / 5.8, 0.66, 1.2);
  rim.position.set(3.2, 3.2, 1.0);

  const cove = new THREE.RectAreaLight(0xffc58d, 48, 6.2, 0.22);
  cove.position.set(0, 2.7, 0.8);
  cove.lookAt(0, 1.6, -0.6);

  const floorWash = new THREE.RectAreaLight(0xffd9b2, 2.4, 6.4, 2.6);
  floorWash.position.set(0, 1.05, 2.55);
  floorWash.lookAt(0, 0.1, -0.8);

  group.add(hemi, key, fill, rim, cove, floorWash);
  return { group, key, fill, rim };
}

function createCategoryDisplay(category) {
  if (category.id === '3d-objects') return createObjectShelfDisplay(category);
  return createPanelDisplay(category);
}

function createPanelDisplay(category) {
  const group = new THREE.Group();
  const [, y, z] = category.wallPosition;
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x171513, roughness: 0.48, metalness: 0.14 });

  const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.075, 0.34), darkMat);
  shelf.position.set(0, y - 0.75, z + 0.35);
  shelf.castShadow = true;
  shelf.receiveShadow = true;
  group.add(shelf);

  const heroShape = category.id === 'layered-art' ? 'layered' : category.id === 'digital-art' ? 'poster' : 'wallPanel';
  const hero = createProductMesh({ shape: heroShape, id: `${category.id}-hero` }, category, true);
  hero.position.set(-0.18, y - 0.05, z + 0.34);
  hero.scale.setScalar(category.id === 'wall-art' ? 0.88 : 0.82);
  group.add(hero);

  if (category.id === 'wall-art') {
    const smallA = createProductMesh({ shape: 'wallPanel' }, category);
    smallA.position.set(0.46, y + 0.25, z + 0.33);
    smallA.scale.setScalar(0.42);
    const smallB = createProductMesh({ shape: 'wallPanel' }, category);
    smallB.position.set(0.46, y - 0.38, z + 0.33);
    smallB.scale.setScalar(0.42);
    group.add(smallA, smallB);
  }
  return group;
}

function createObjectShelfDisplay(category) {
  const group = new THREE.Group();
  const [, y, z] = category.wallPosition;
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x171513, roughness: 0.48, metalness: 0.14 });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xd8cbbb, roughness: 0.86 });

  [-0.34, 0.32].forEach((offset, index) => {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.075, 0.34), darkMat);
    shelf.position.set(0, y + offset, z + 0.34);
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    group.add(shelf);

    const object = createProductMesh({ shape: index === 0 ? 'sculpture' : 'lamp' }, category, true);
    object.position.set(index === 0 ? -0.1 : 0.12, y + offset + 0.35, z + 0.36);
    object.scale.setScalar(index === 0 ? 0.7 : 0.54);
    group.add(object);
  });

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.46, 0.6), wallMat);
  plinth.position.set(0, y - 0.92, z + 0.34);
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  const lowObject = createProductMesh({ shape: 'sculpture' }, category, true);
  lowObject.position.set(-0.18, y - 0.57, z + 0.48);
  lowObject.scale.setScalar(0.55);
  group.add(lowObject);
  return group;
}

function createCategoryZone(category, index) {
  const group = new THREE.Group();
  const [x, y, z] = category.wallPosition;
  group.position.set(x, 0, 0);
  group.userData.homeX = x;
  group.userData.targetX = x;
  group.userData.phase = index * 0.8;
  group.userData.targetOpacity = 1;
  group.userData.opacity = 1;
  group.userData.targetScale = 1;

  const stage = createCategoryDisplay(category);
  stage.position.set(0, 0, 0);
  group.add(stage);

  const label = createWallLabel(category.name, category.id === '3d-objects' ? 1.05 : 0.92);
  label.position.set(0, y + 0.95, z + 0.16);
  group.add(label);

  // Align the (invisible) click/hover box with the *approved GLB* display, not the
  // legacy storefront wallPosition — same anchor the gold highlight frame uses, so
  // hovering/clicking a wall in 3D selects the art the user is actually pointing at.
  const layout = categoryWallLayout(category.id);
  const hitTarget = new THREE.Mesh(
    new THREE.BoxGeometry(layout.width + 0.2, layout.height + 0.5, 0.5),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  hitTarget.position.set(layout.x - group.userData.homeX, layout.y, layout.z + 0.2);
  hitTarget.rotation.y = layout.angle;
  hitTarget.userData = { action: 'category', categoryId: category.id };
  group.add(hitTarget);
  group.userData.hitTarget = hitTarget;

  return group;
}

function createCollectionStage(category, filter) {
  const group = new THREE.Group();
  group.userData.kind = 'collection';
  const products = filter === 'All' ? category.products : category.products.filter((product) => product.type === filter);
  const visibleProducts = products.length ? products : category.products;
  const hitTargets = [];

  // Warm presentation backdrop behind the floating array, parallel to the right wall.
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(2.9, 2.5),
    new THREE.MeshStandardMaterial({
      color: 0x1a1714,
      roughness: 0.92,
      metalness: 0.02,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    }),
  );
  backdrop.position.set(RIGHT_STAGE_CENTER.x, RIGHT_STAGE_CENTER.y - 0.02, RIGHT_STAGE_CENTER.z - 0.55);
  group.add(backdrop);

  const count = visibleProducts.length;
  const cols = count > 4 ? 3 : Math.min(count, 2) || 1;
  const rows = Math.ceil(count / cols);
  const spacingX = 0.66;
  const spacingY = 0.78;

  visibleProducts.forEach((product, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const itemsInRow = Math.min(cols, count - row * cols);
    const colOffset = (itemsInRow - 1) / 2;
    const rowOffset = (rows - 1) / 2;

    const item = new THREE.Group();
    const x = RIGHT_STAGE_CENTER.x + (col - colOffset) * spacingX;
    const y = RIGHT_STAGE_CENTER.y + (rowOffset - row) * spacingY;
    item.position.set(x, y, RIGHT_STAGE_CENTER.z);
    item.userData.homeY = y;
    item.userData.targetScale = 0.5;
    item.userData.floats = true;
    item.scale.setScalar(0.04); // animates up to targetScale (spec §10: float into place)

    const mesh = createProductMesh(product, category);
    mesh.castShadow = true;
    item.add(mesh);

    const label = createTextPlate(product.name, 1.1, 0.13);
    label.position.set(0, -0.56, 0.05);
    item.add(label);

    const hit = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.5, 0.5),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
    );
    hit.userData = { action: 'product', productId: product.id };
    item.add(hit);
    hitTargets.push(hit);
    group.add(item);
  });

  group.userData.hitTargets = hitTargets;
  return group;
}

function createProductViewer(product, category) {
  const group = new THREE.Group();
  group.position.copy(RIGHT_WALL_VIEWER.position);
  group.rotation.y = RIGHT_WALL_VIEWER.angle;
  group.scale.setScalar(product.shape === 'layered' ? (LAYERED_MODEL_PATHS[product.id] ? 0.78 : 1.64) : 1.46);
  group.userData.focus = RIGHT_WALL_VIEWER.focus.clone();
  const mesh = createProductMesh(product, category, true);
  mesh.castShadow = true;
  group.add(mesh);
  if (product.shape === 'layered' && LAYERED_MODEL_PATHS[product.id]) {
    group.rotation.y = RIGHT_WALL_VIEWER.angle - 0.04;
  }
  group.userData.layers = mesh.userData.layers ?? [];
  if (!mesh.userData.layers) {
    mesh.traverse((child) => {
      if (child.userData.layer) group.userData.layers.push(child);
    });
  }
  return group;
}

function createProductMesh(product, category, detailed = false) {
  const color = category?.color ?? 0x111111;
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.48, metalness: 0.18 });
  const accent = new THREE.MeshStandardMaterial({ color: 0xf5f0e7, roughness: 0.42, metalness: 0.05 });
  const group = new THREE.Group();

  if (product.shape === 'poster') {
    const acrylic = new THREE.Mesh(
      new THREE.BoxGeometry(0.82, 1.08, DIGITAL_POSTER_THICKNESS_M),
      [
        new THREE.MeshPhysicalMaterial({
          color: 0x050505,
          roughness: 0.12,
          metalness: 0.12,
          clearcoat: 1,
          clearcoatRoughness: 0.06,
        }),
        new THREE.MeshPhysicalMaterial({
          color: 0x050505,
          roughness: 0.12,
          metalness: 0.12,
          clearcoat: 1,
          clearcoatRoughness: 0.06,
        }),
        new THREE.MeshPhysicalMaterial({
          color: 0x050505,
          roughness: 0.12,
          metalness: 0.12,
          clearcoat: 1,
          clearcoatRoughness: 0.06,
        }),
        new THREE.MeshPhysicalMaterial({
          color: 0x050505,
          roughness: 0.12,
          metalness: 0.12,
          clearcoat: 1,
          clearcoatRoughness: 0.06,
        }),
        product.image ? acrylicImageMaterial(product.image) : createArtworkMaterial(product.id),
        new THREE.MeshPhysicalMaterial({
          color: 0x050505,
          roughness: 0.12,
          metalness: 0.12,
          clearcoat: 1,
          clearcoatRoughness: 0.06,
        }),
      ],
    );
    const gloss = new THREE.Mesh(
      new THREE.PlaneGeometry(0.82, 1.08),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.12,
        roughness: 0.02,
        transmission: 0.18,
        clearcoat: 1,
      }),
    );
    gloss.position.z = DIGITAL_POSTER_THICKNESS_M * 0.58;
    group.add(acrylic, gloss);
    return group;
  }

  if (product.shape === 'layered') {
    if (product.id === 'wolf-layered' && product.image) {
      return createLayeredImageStack(product.image, {
        width: detailed ? 0.88 : 0.78,
        height: detailed ? 0.98 : 0.86,
        layers: detailed ? 7 : 5,
        gap: detailed ? 0.022 : 0.018,
      });
    }
    if (LAYERED_MODEL_PATHS[product.id]) {
      return createLayeredBlenderProduct(product);
    }

    const layerCount = detailed ? 7 : 5;
    for (let i = 0; i < layerCount; i += 1) {
      const t = i / Math.max(layerCount - 1, 1);
      const layerColor = new THREE.Color().lerpColors(new THREE.Color(0x050505), new THREE.Color(0x5d5d5d), t);
      const layer = product.image ? new THREE.Mesh(
        new THREE.PlaneGeometry(0.78 - i * 0.035, 0.86 - i * 0.035),
        cutoutImageMaterial(product.image, layerColor),
      ) : new THREE.Mesh(
        new THREE.BoxGeometry(0.8 - i * 0.045, 0.88 - i * 0.045, LAYER_THICKNESS_M),
        new THREE.MeshStandardMaterial({
          color: layerColor,
          roughness: 0.58,
          metalness: 0.08,
        }),
      );
      layer.position.z = i * -0.014;
      layer.userData.layer = true;
      layer.userData.restZ = layer.position.z;
      layer.userData.thicknessM = LAYER_THICKNESS_M;
      group.add(layer);
    }
    if (!product.image) {
      const cutout = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.018, 12, 42), accent);
      cutout.position.z = LAYER_THICKNESS_M;
      group.add(cutout);
    }
    return group;
  }

  if (product.shape === 'sculpture' || product.shape === 'lamp') {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.18, 28), material);
    const body = product.shape === 'lamp'
      ? new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.72, 32), material)
      : new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, detailed ? 2 : 1), material);
    body.position.y = 0.46;
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.08, 0.58), accent);
    plinth.position.y = -0.19;
    group.add(plinth, base, body);
    return group;
  }

  if (product.image) {
    const svgMesh = createSvgExtrusion(product.image, {
      targetWidth: 0.74,
      targetHeight: 0.86,
      depth: WALL_ART_THICKNESS_M,
      material: new THREE.MeshStandardMaterial({ color: 0x030303, roughness: 0.36, metalness: 0.18 }),
    });
    group.add(svgMesh);
  } else {
    const line = new THREE.Mesh(new THREE.TorusKnotGeometry(0.19, 0.012, 82, 8), accent);
    line.position.z = WALL_ART_THICKNESS_M;
    group.add(line);
  }
  return group;
}

function createLayeredBlenderProduct(product) {
  const group = new THREE.Group();
  group.userData.layers = [];
  group.userData.modelPath = LAYERED_MODEL_PATHS[product.id];

  const placeholder = new THREE.Mesh(
    new THREE.BoxGeometry(0.74, 0.82, LAYER_THICKNESS_M),
    new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.52,
      metalness: 0.08,
      transparent: true,
      opacity: 0.22,
    }),
  );
  placeholder.userData.layer = true;
  placeholder.userData.restZ = 0;
  placeholder.userData.thicknessM = LAYER_THICKNESS_M;
  group.userData.layers.push(placeholder);
  group.add(placeholder);

  gltfLoader.loadAsync(group.userData.modelPath).then((gltf) => {
    group.remove(placeholder);
    placeholder.geometry.dispose();
    placeholder.material.dispose();

    const model = gltf.scene;
    const layers = [];
    model.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
      child.userData.layer = true;
      child.userData.thicknessM = LAYER_THICKNESS_M;
      layers.push(child);
    });

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    model.position.sub(center);
    const dominant = Math.max(size.x, size.y);
    model.scale.setScalar(dominant > 0 ? 0.82 / dominant : 1);

    model.updateMatrixWorld(true);
    group.userData.layers.splice(0, group.userData.layers.length);
    layers
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
      .forEach((layer, index, sortedLayers) => {
        const t = index / Math.max(sortedLayers.length - 1, 1);
        const color = new THREE.Color().lerpColors(new THREE.Color(0x0a0a0a), new THREE.Color(0x8a8377), t);
        layer.material = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.5 + t * 0.1,
          metalness: 0.08,
          side: THREE.DoubleSide,
        });
        layer.position.z = index * -0.018;
        layer.userData.restZ = layer.position.z;
        group.userData.layers.push(layer);
      });

    group.add(model);
  }).catch((error) => {
    console.warn(`Failed to load layered Blender product ${product.id}`, error);
  });

  return group;
}

function createSvgExtrusion(path, { targetWidth, targetHeight, depth, material }) {
  const group = new THREE.Group();
  group.userData.svgPath = path;

  const fallback = new THREE.Mesh(new THREE.BoxGeometry(targetWidth, targetHeight, depth), material);
  fallback.scale.set(0.96, 0.96, 1);
  group.add(fallback);

  fetch(path)
    .then((response) => response.text())
    .then((svgText) => {
      const data = svgLoader.parse(svgText);
      const content = new THREE.Group();
      data.paths.forEach((svgPath) => {
        const shapes = SVGLoader.createShapes(svgPath);
        shapes.forEach((shape) => {
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
      content.position.z = depth * -0.5;

      group.remove(fallback);
      fallback.geometry.dispose();
      group.add(content);
    })
    .catch((error) => {
      console.warn(`[BA] Could not build SVG mesh for ${path}`, error);
    });

  return group;
}

function createArtworkMaterial(seed) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#eee7d8';
  ctx.lineWidth = 9;
  const offset = seed.length * 7;
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.arc(128, 160, 34 + i * 22, (offset + i) * 0.17, Math.PI * 1.45 + i * 0.2);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(196, 161, 88, 0.82)';
  ctx.fillRect(58, 238, 140, 6);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: texture, roughness: 0.52, metalness: 0.06 });
}

function createBannerPlate(title, message) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 260;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, 'rgba(17, 16, 14, 0.92)');
  gradient.addColorStop(0.62, 'rgba(17, 16, 14, 0.76)');
  gradient.addColorStop(1, 'rgba(17, 16, 14, 0.24)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(247, 236, 212, 0.24)';
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

  ctx.fillStyle = '#f8efdf';
  ctx.font = '600 58px Helvetica, Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(title, 48, 42, 850);

  ctx.fillStyle = 'rgba(248, 239, 223, 0.72)';
  ctx.font = '400 30px Helvetica, Arial, sans-serif';
  wrapCanvasText(ctx, message, 52, 128, 720, 38, 2);

  ctx.fillStyle = 'rgba(199, 164, 91, 0.92)';
  ctx.fillRect(52, 218, 210, 5);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
  return new THREE.Mesh(new THREE.PlaneGeometry(2.34, 0.58), material);
}

function createWallLabel(text, width) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 150;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#171513';
  ctx.font = '400 44px Helvetica, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, 58, canvas.width - 38);
  ctx.fillStyle = 'rgba(184, 145, 69, 0.95)';
  ctx.fillRect(154, 106, 204, 5);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
  return new THREE.Mesh(new THREE.PlaneGeometry(width, width * 0.29), material);
}

function createTextPlate(text, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(18, 17, 15, 0.78)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(255, 244, 220, 0.34)';
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
  ctx.fillStyle = '#f6f0e6';
  ctx.font = '500 34px Helvetica, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2, canvas.width - 42);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
  return new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = text.split(' ');
  let line = '';
  let lineCount = 0;
  words.forEach((word, index) => {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      if (lineCount < maxLines) ctx.fillText(line, x, y + lineCount * lineHeight, maxWidth);
      line = word;
      lineCount += 1;
    } else {
      line = testLine;
    }
    if (index === words.length - 1 && lineCount < maxLines) {
      ctx.fillText(line, x, y + lineCount * lineHeight, maxWidth);
    }
  });
}

function setGroupOpacity(group, opacity) {
  group.userData.opacity = opacity;
  group.traverse((child) => {
    if (child.isLight) {
      child.intensity = opacity * 2.2;
      return;
    }
    if (!child.material) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      if (!material || material.opacity === 0) return;
      material.transparent = opacity < 0.98;
      material.opacity = opacity;
    });
  });
}
