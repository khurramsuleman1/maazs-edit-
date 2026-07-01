// Scroll → camera controller (lerp-based). (ba_spec_v2 §7–§9)
// Scroll moves the camera down through Zone 1 (Hero) → Zone 2 (Category Showcase).
// Zones 3–4 are entered via click, not scroll.
// Skeleton: implement easing + zone boundaries here.

export function createScrollController(world) {
  let targetY = 0;

  addEventListener('wheel', (e) => {
    targetY += e.deltaY * 0.001;
    targetY = Math.max(0, Math.min(targetY, 1)); // clamp to scroll range
  }, { passive: true });

  // Lerp the camera toward targetY each frame by wrapping world.update.
  const baseUpdate = world.update;
  world.update = () => {
    const cam = world.camera;
    cam.position.y += ((1.5 - targetY * 4) - cam.position.y) * 0.05; // ease
    baseUpdate();
  };

  return { get progress() { return targetY; } };
}
