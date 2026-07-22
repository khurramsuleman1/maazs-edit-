import { defineConfig } from "vite";

// The app was emitting a single ~1MB JS bundle (Three.js + the large product-data module +
// app code), all of which had to download and parse before the first frame. Splitting the two
// biggest, most stable dependencies into their own chunks lets the browser download them in
// parallel, parse incrementally, and — because their content hashes rarely change — keep them
// cached across app deploys.
export default defineConfig({
  build: {
    target: "es2020",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/three")) return "three";
          // shopifyVariants.js (~6.9k lines) + catalog.js: bulky, changes independently of app logic.
          if (id.includes("/src/data/")) return "catalog";
          return undefined;
        },
      },
    },
  },
});
