// Black Aesthetics — entry point.
// Boots the renderer, scene, and scroll controller, then reveals the world.
// Read AGENTS.md before extending this. Full behavior spec: ba_spec_v2.md.
//
// This is a skeleton: wire real implementations into the modules under src/.
// Keep main.js thin — it orchestrates, it does not contain scene detail.

import { createScene } from './scene/environment.js';
import { mountHud } from './ui/hud.js';

const canvas = document.getElementById('app');

async function boot() {
  // 1. Build the small-room storefront and product viewer.
  const world = await createScene(canvas);

  // 2. Layer the minimal luxury storefront UI over the 3D room.
  mountHud(world);

  // 3. Asset-ready cut: hide splash, reveal world (§4 — a cut, not a fade).
  const splash = document.getElementById('splash');
  if (splash) splash.style.display = 'none';

  // 4. Render loop.
  const tick = () => {
    world.update();
    world.renderer.render(world.scene, world.camera);
    requestAnimationFrame(tick);
  };
  tick();
}

boot().catch((err) => console.error('[BA] boot failed:', err));
