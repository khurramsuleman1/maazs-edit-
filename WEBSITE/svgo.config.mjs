// Conservative, geometry-preserving SVGO config for the extruded wall-art SVGs + logo.
// Keeps viewBox (SVGLoader and the logo canvas rasterizer need it) and disables mergePaths
// (combining subpaths can change holes/winding in the extruded result). Precision 3 trims
// coordinate noise without visibly altering the approved silhouettes.
export default {
  multipass: true,
  floatPrecision: 3,
  plugins: [
    {
      name: "preset-default",
      params: {
        overrides: {
          removeViewBox: false,
          mergePaths: false,
          convertPathData: { floatPrecision: 3 },
          cleanupNumericValues: { floatPrecision: 3 },
          // Keep IDs/refs intact in case any path references a gradient/clip.
          cleanupIds: false,
        },
      },
    },
  ],
};
