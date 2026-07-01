// Black Aesthetics — product catalog (real test set).
// Hand-curated static data. Each product carries an `image` (served from /public)
// used as the 3D texture; 3D-object products use procedural geometry (no image yet).
// Wall positions / camera positions map to the room in scene/environment.js.

export const categories = [
  {
    id: 'wall-art',
    name: 'Wall Art',
    intro: 'Thick black laser-cut silhouettes converted from SVG paths.',
    color: 0x0f0f0f,
    wallPosition: [-2.7, 1.34, -1.92],
    cameraPosition: [-2.45, 1.38, 2.42],
    filters: ['Animals', 'Mythology', 'Space'],
    products: [
      { id: 'athena-lines', name: 'Athena', price: 'PKR 3,800', type: 'Mythology', shape: 'wallPanel', image: '/products/wall-art/athena.svg' },
      { id: 'astronaut-cut', name: 'Astronaut', price: 'PKR 4,000', type: 'Space', shape: 'wallPanel', image: '/products/wall-art/astronaut.svg' },
      { id: 'lion-cut', name: 'Lion', price: 'PKR 4,200', type: 'Animals', shape: 'wallPanel', image: '/products/wall-art/lion.svg' },
      { id: 'wolf-cut', name: 'Wolf', price: 'PKR 4,200', type: 'Animals', shape: 'wallPanel', image: '/products/wall-art/wolf.svg' },
      { id: 'elephant-cut', name: 'Elephant', price: 'PKR 4,500', type: 'Animals', shape: 'wallPanel', image: '/products/wall-art/elephant.svg' },
    ],
  },
  {
    id: 'digital-art',
    name: 'Digital Art',
    intro: 'Artwork sealed under glossy black acrylic with image texture.',
    color: 0x171717,
    wallPosition: [-0.9, 1.34, -1.92],
    cameraPosition: [-0.82, 1.38, 2.35],
    filters: ['Anime', 'Comics'],
    products: [
      { id: 'ironman-print', name: 'Iron Man', price: 'PKR 1,500', type: 'Comics', shape: 'poster', image: '/products/digital/ironman.jpg' },
      { id: 'joker-print', name: 'Joker — Dark Knight', price: 'PKR 1,500', type: 'Comics', shape: 'poster', image: '/products/digital/joker.jpg' },
      { id: 'naruto-print', name: 'Naruto in the Dark', price: 'PKR 1,400', type: 'Anime', shape: 'poster', image: '/products/digital/naruto.jpg' },
      { id: 'panther-print', name: 'Neon Black Panther', price: 'PKR 1,500', type: 'Comics', shape: 'poster', image: '/products/digital/neon-black-panther.jpg' },
      { id: 'rengoku-print', name: 'Rengoku', price: 'PKR 1,400', type: 'Anime', shape: 'poster', image: '/products/digital/rengoku.jpg' },
    ],
  },
  {
    id: 'layered-art',
    name: 'Layered Art',
    intro: 'Ordered front-to-back layer stacks with visible shadow gaps.',
    color: 0x111111,
    wallPosition: [0.9, 1.34, -1.92],
    cameraPosition: [0.82, 1.38, 2.35],
    filters: ['Animals', 'Mandala'],
    products: [
      { id: 'bear-layered', name: 'Geometric Bear', price: 'PKR 4,100', type: 'Animals', shape: 'layered', image: '/products/layered/bear.png' },
      { id: 'eclipse-mandala', name: 'Eclipse Mandala', price: 'PKR 4,500', type: 'Mandala', shape: 'layered', image: '/products/layered/eclipse-mandala.png' },
      { id: 'mandala-layered', name: 'Mandala', price: 'PKR 4,300', type: 'Mandala', shape: 'layered', image: '/products/layered/mandala.png' },
      { id: 'wolf-layered', name: 'Wolf', price: 'PKR 4,300', type: 'Animals', shape: 'layered', image: '/products/layered/wolf.png' },
    ],
  },
  {
    id: '3d-objects',
    name: '3D ART',
    intro: 'Temporary sculptural dummies until approved GLBs pass the gate.',
    color: 0x151515,
    wallPosition: [2.7, 1.42, -1.92],
    cameraPosition: [2.45, 1.42, 2.42],
    filters: ['Prints', 'Lamps', 'Accessories'],
    products: [
      { id: 'panther-mini', name: 'Panther', price: 'PKR 2,800', type: 'Prints', shape: 'sculpture' },
      { id: 'fidget-spinner', name: 'Fidget Spinner', price: 'PKR 1,200', type: 'Accessories', shape: 'sculpture' },
      { id: 'batman-figure', name: 'Batman Figure', price: 'PKR 3,500', type: 'Prints', shape: 'sculpture' },
      { id: 'lamp-shade', name: 'Lamp Shade', price: 'PKR 3,200', type: 'Lamps', shape: 'lamp' },
      { id: 'corner-holder', name: 'Frame Corner Holder', price: 'PKR 900', type: 'Accessories', shape: 'sculpture' },
    ],
  },
];

export const allProducts = categories.flatMap((category) =>
  category.products.map((product) => ({ ...product, categoryId: category.id, categoryName: category.name })),
);
