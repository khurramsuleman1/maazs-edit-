import { COMMERCE } from "./shopifyVariants.js";

const slug = (value) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const layeredSvg = (slugName, count) =>
  Array.from({ length: count }, (_, index) => `/products/layered/svg/${slugName}/layer-${String(index + 1).padStart(2, "0")}.svg`);

const wallArtNames = [
  "Elegant Horse Head",
  "Athena",
  "Astronaut",
  "Lion",
  "Wolf",
  "Elephant",
  "Abstract Cat",
  "Adera",
  "Amy Winehouse",
  "Baby Groot",
  "Batman DC Superhero",
  "Batman and Joker",
  "Bee",
  "Bob Marley",
  "Boba Fett",
  "Bull",
  "Butterfly",
  "Cat",
  "Circle of Life",
  "Climber",
  "Cowboy",
  "Decor Horse",
  "Deer Head",
  "Dolphin",
  "Eagle",
  "Family Tree",
  "Flower Floral",
  "Flower of Life",
  "Fox",
  "Geometric Heart",
  "Geometric Horse",
  "Gojo",
  "Hamsa",
  "Horse",
  "Kakashi",
  "Leaf Set V1",
  "Leaf Set V2",
  "Love Heart",
  "Marilyn Monroe",
  "Markhor with Snake",
  "Monstera",
  "Mountain Tree",
  "Ninja",
  "Owl",
  "Pulp Fiction V.1",
  "Ronaldo",
  "Shark",
  "Spiderman",
  "Tiger",
  "Tree of Life",
  "Venom",
  "World Map Route",
  "Light House",
  "Abstract faces",
  "Abstract faces Variant 2",
  "Africans",
  "Amor",
  "Ananas",
  "angel",
  "Arbor",
  "Aren't pandas",
  "Aries",
  "Aristoteles",
  "Atlas",
  "Audrey Hepburn",
  "Boat",
  "Butterfly-1",
  "Butterfly-2",
  "Casual Astro",
  "cat-1",
  "cat-2",
  "Circle of Life 12x12",
  "Creation Of Adam new",
  "Daupor",
  "Decor Wall Frames",
  "deer",
  "deer 1",
  "deer 3",
  "deer in forest",
  "Deer-4",
  "Dekoratif Tablo",
  "Deter",
  "Dragon Ball Goku 1",
  "Eagle 1",
  "Emotions Set",
  "ethnic ornaments",
  "Existen",
  "Faglar",
  "flamingo",
  "Forrest wolf",
  "fox-1",
  "Gandalf Staff",
  "Geometric Set",
  "Geometric Set Variant 2",
  "Geometric Set Variant 3",
  "Geometric Set Variant 4",
  "Globe",
  "Heart",
  "Heartbeat Set",
  "Horse 2",
  "Indigenous v.3",
  "Inner Tribal",
  "jocker",
  "Jojo",
  "JOYRESIDE Deer",
  "Juice WRLD",
  "Khaleesi",
  "Lady Diana",
  "League of Legends",
  "Leon & Mathilda",
  "Lightning Bolt",
  "Lily",
  "lines metal wall art",
  "Love",
  "Love heart Tree",
  "Love tree",
  "Loving Decoration Frame",
  "Lucid",
  "Mangrove Tree",
  "Mantra",
  "Marla Singer new",
  "Marvel",
  "Messi",
  "Michelangelo's David",
  "MK4 Toyota",
  "Mode",
  "Ninja Avatar",
  "Nissan",
  "Poseidon",
  "Pulp Fiction v.2",
  "Rabbits",
  "Ripples Set",
  "Seahorses",
  "Siamese twin",
  "Silva 4",
  "Spider",
  "STORMTROOPER",
  "Terra",
  "The Notorious big biggle",
  "Themis V.1",
  "Totoro and Mei",
  "Tribal Moon",
  "trio bike",
  "Tupac-2pac",
  "Wander",
  "Welter's Monkey",
  "Wolf 4",
  "Wolf-1",
];

const wallArtProducts = wallArtNames.map((name) => ({
  id: `wall-${slug(name)}`,
  name,
  image: `/products/wall-art/${slug(name)}.svg`,
  kind: "wall-art",
  aspect: 1,
  material: "Laser-cut wall art",
  price: "PKR 4,500",
}));

const digitalProducts = [
  ["Ironman", "ironman.jpg", 0.667],
  ["Joker", "joker.jpg", 0.667],
  ["Joker Dark Knight", "joker-dark-knight.png", 0.667],
  ["Naruto In The Dark", "naruto-in-the-dark.jpg", 0.667],
  ["Neon Black Panther", "neon-black-panther.png", 1.5],
  ["Rengoku Demon Slayer", "rengoku-demon-slayer.jpg", 1.5],
  ["Itachi Red", "itachi-red.jpg", 0.667],
  ["Itachi Red PNG", "itachi-red-png.png", 0.667],
  ["Pain", "pain.jpg", 0.667],
  ["Pain PNG", "pain-png.png", 0.667],
  ["Minato", "minato.jpg", 1.5],
  ["Madara Sharingan", "madara-sharingan.jpg", 0.667],
  ["Obito Art Portrait", "obito-art-portrait.jpg", 0.667],
  ["Ronaldo", "ronaldo.jpg", 1.5],
  ["Ferrari", "ferrari.jpg", 1.5],
  ["Leopard Greyscale", "leopard-greyscale.jpg", 1.5],
  ["Whirling Dervish", "whirling-dervish.jpg", 0.667],
  ["Lighthouse Stained Glass", "lighthouse-stained-glass.jpg", 0.667],
  ["Lady Stained Glass", "lady-stained-glass.png", 0.667],
  ["Piano Stained Glass", "piano-stained-glass.jpg", 0.667],
  ["Roman Colosseum I", "roman-colosseum-i.jpg", 0.6],
  ["Roman Colosseum II", "roman-colosseum-ii.jpg", 0.5],
  ["Roman Colosseum III", "roman-colosseum-iii.jpg", 0.6],
  ["Neon Smoking Lady", "neon-smoking-lady.jpg", 0.667],
  ["Smoking Lady Neon", "smoking-lady-neon.jpg", 0.667],
  ["Scarlet Haze", "scarlet-haze.jpg", 0.667],
  ["Electric Grace", "electric-grace.jpg", 0.667],
  ["Shaan", "shaan.jpg", 0.667],
  ["Smoking Lady Variant", "smoking-lady-variant.jpg", 0.667],
  ["Smoking Lady 12x18", "smoking-lady-12x18.jpg", 0.667],
].map(([name, file, aspect]) => ({
  id: `digital-${slug(name)}`,
  name,
  image: `/products/digital/final/${file.replace(/\.(?:jpe?g|png)$/i, ".webp")}`,
  kind: "digital",
  aspect,
  material: "Poster — final print on black sheet",
  price: "PKR 2,500",
}));

// D63 customization heroes reuse existing approved/data product geometry as a visual example.
// They are distinct local products so selecting the category hero opens a dedicated customization
// viewer without pretending the example artwork itself is the customer's final design.
const customWallArtProduct = {
  ...wallArtProducts[0],
  id: "custom-wall-art",
  name: "Customize Your Wall Art",
  custom: true,
  material: "Your design, laser-cut to order",
  price: "Custom quote",
  customDescription: "Upload or describe your own artwork, logo, name, or silhouette, then choose its size, depth, material, and color.",
};

const customDigitalArtProduct = {
  ...digitalProducts[0],
  id: "custom-digital-art",
  name: "Customize Your Digital Art",
  custom: true,
  material: "Your artwork, printed to order",
  price: "Custom quote",
  customDescription: "Turn your photo, illustration, or design into a made-to-order mounted print with your preferred size and finish.",
};

const byKeywords = (products, keywords) => {
  const terms = keywords.map((keyword) => keyword.toLowerCase());
  return products.filter((product) => {
    const haystack = `${product.id} ${product.name}`.toLowerCase();
    return terms.some((term) => haystack.includes(term));
  });
};

const buildSubcollections = (products, definitions) =>
  definitions
    .map((definition) => {
      const matched = byKeywords(products, definition.keywords);
      const productIds = [...new Set(matched.map((product) => product.id))];
      return {
        ...definition,
        productIds,
        coverProductId: definition.coverProductId ?? productIds[0],
      };
    })
    .filter((definition) => definition.productIds.length > 0);

const wallArtSubcollections = buildSubcollections(wallArtProducts, [
  {
    id: "animals",
    label: "Animals",
    handle: "animal-2d-wall-art",
    description: "Wildlife, pets, birds, and nature-led silhouettes.",
    keywords: ["horse", "wolf", "elephant", "cat", "bee", "bull", "butterfly", "deer", "dolphin", "eagle", "fox", "owl", "pandas", "rabbit", "seahorses", "shark", "spider", "tiger"],
  },
  {
    id: "anime-manga",
    label: "Anime / Manga",
    handle: "anime-manga-2d-1",
    description: "Anime, manga, and gaming-inspired cut art.",
    keywords: ["gojo", "kakashi", "jojo", "goku", "dragon ball", "league of legends", "ninja", "venom"],
  },
  {
    id: "comics-superheroes",
    label: "Comics & Heroes",
    handle: "comics-superheroes-2d",
    description: "Superheroes, comic icons, and cinematic character pieces.",
    keywords: ["batman", "joker", "jocker", "boba fett", "spiderman", "marvel", "stormtrooper", "baby groot", "venom"],
  },
  {
    id: "minimalistic",
    label: "Minimalistic",
    handle: "minimalistic",
    description: "Clean forms, abstract geometry, and modern wall silhouettes.",
    keywords: ["abstract", "geometric", "circle", "flower", "heart", "leaf", "lines", "love", "mode", "decor", "ripples", "lightning", "globe"],
  },
  {
    id: "personalities",
    label: "Personalities",
    handle: "personalities",
    description: "Musicians, athletes, actors, and cultural personalities.",
    keywords: ["amy", "audrey", "bob marley", "marilyn", "ronaldo", "messi", "lady diana", "notorious", "tupac", "juice", "aristoteles", "david"],
  },
  {
    id: "movies-pop",
    label: "Movies & Pop",
    handle: "movies",
    description: "Film, fantasy, and pop-culture wall pieces.",
    keywords: ["pulp", "gandalf", "khaleesi", "leon", "mathilda", "marla", "totoro", "cowboy", "stormtrooper"],
  },
  {
    id: "cars",
    label: "Cars",
    handle: "cars",
    description: "Automotive silhouettes and garage wall pieces.",
    keywords: ["mk4", "toyota", "nissan"],
  },
  {
    id: "cultural",
    label: "Cultural Arts",
    handle: "cultural-arts-2d",
    description: "Heritage, myth, classical, and ornamental designs.",
    keywords: ["africans", "ethnic", "indigenous", "tribal", "themis", "poseidon", "atlas", "hamsa", "creation", "michelangelo", "mantra"],
  },
]);

const digitalSubcollections = buildSubcollections(digitalProducts, [
  {
    id: "anime-naruto",
    label: "Anime / Naruto",
    handle: "anime",
    description: "Naruto, Demon Slayer, and anime poster prints.",
    keywords: ["naruto", "rengoku", "itachi", "pain", "minato", "madara", "obito"],
  },
  {
    id: "comics-movies",
    label: "Comics & Movies",
    handle: "comics-superheroes-movies-digital-ae",
    description: "Hero, villain, and cinematic poster artwork.",
    keywords: ["ironman", "joker", "panther"],
  },
  {
    id: "stained-classical",
    label: "Stained / Classical",
    handle: "stained-glass-style",
    description: "Stained glass, architecture, and classical mood prints.",
    keywords: ["stained", "colosseum", "lighthouse", "piano", "lady"],
  },
  {
    id: "cultural-digital",
    label: "Cultural Arts",
    handle: "cultural-arts-digital",
    description: "Cultural and expressive art prints.",
    keywords: ["whirling", "shaan"],
  },
  {
    id: "cars-sports",
    label: "Cars & Sports",
    handle: "cars",
    description: "Automotive and sports poster prints.",
    keywords: ["ferrari", "ronaldo"],
  },
  {
    id: "neon-ladies",
    label: "Smoking Lady",
    handle: "smoking-lady",
    description: "Neon, smoke, and dramatic portrait prints.",
    keywords: ["smoking", "neon", "scarlet", "electric"],
  },
]);

export const categories = [
  {
    id: "wall-art",
    label: "Wall Art",
    shortLabel: "Wall",
    collection: "2D Wall-Art",
    handle: "2d-wallart",
    description: "Thick laser-cut sheet silhouettes mounted into lit gallery recesses, with black forms standing proud from the pale bay wall.",
    heroProductId: "custom-wall-art",
    subcollections: wallArtSubcollections,
    products: [customWallArtProduct, ...wallArtProducts],
  },
  {
    id: "digital-art",
    label: "Digital Art",
    shortLabel: "Digital",
    collection: "Digital Art",
    handle: "poster-art",
    description: "Poster prints — each final print file is the front-face texture of a black sheet panel, hung with gold corner pins like a real mounted poster.",
    heroProductId: "custom-digital-art",
    subcollections: digitalSubcollections,
    products: [customDigitalArtProduct, ...digitalProducts],
  },
  {
    id: "layered-art",
    label: "Layered Art",
    shortLabel: "Layered",
    collection: "Layered Art",
    handle: "layered-art",
    description: "Approved Blender layer stacks rebuilt from SVG cut layers, with each sheet extruded and stepped forward like a real layered wall panel.",
    heroProductId: "custom-layered-art",
    products: [
      {
        id: "custom-layered-art",
        name: "Customize Your Layered Art",
        custom: true,
        layers: layeredSvg("wolf", 4),
        frontLayerFirst: true,
        kind: "layered",
        aspect: 1.15,
        material: "Your design, built in dimensional layers",
        price: "Custom quote",
        customDescription: "Create a layered piece from your image, logo, name, or idea, then choose the finished size and material treatment.",
      },
      {
        id: "layered-wolf",
        name: "Layered Wolf",
        layers: layeredSvg("wolf", 4),
        frontLayerFirst: true,
        kind: "layered",
        aspect: 1.15,
        material: "Four-layer wall panel",
        price: "PKR 7,500",
      },
      {
        id: "layered-bear",
        name: "Layered Bear",
        layers: layeredSvg("bear", 6),
        kind: "layered",
        aspect: 1.15,
        material: "Layered wall panel",
        price: "PKR 7,500",
      },
      {
        id: "layered-mandala",
        name: "Mandala",
        layers: layeredSvg("mandala", 6),
        kind: "layered",
        aspect: 1.15,
        material: "Layered mandala panel",
        price: "PKR 8,500",
      },
      {
        id: "layered-eclipse",
        name: "Eclipse Mandala",
        layers: layeredSvg("eclipse-mandala", 6),
        frontLayerFirst: true,
        layerOrder: [5, 4, 3, 2, 1, 0],
        kind: "layered",
        aspect: 1.15,
        material: "Layered mandala panel",
        price: "PKR 8,500",
      },
      {
        id: "layered-motorcycle",
        name: "Motorcycle Wall Panel",
        layers: layeredSvg("motorcycle", 5),
        layerOrder: [4, 3, 2, 1, 0],
        kind: "layered",
        aspect: 0.92,
        material: "Layered wall panel",
        price: "PKR 8,500",
      },
    ],
  },
  {
    id: "3d-objects",
    label: "3D Objects",
    shortLabel: "3D",
    collection: "3D Prints",
    handle: "3d-prints",
    description: "Real 3D-print products — each piece is its actual decimated print model, displayed on floating gallery shelves.",
    heroProductId: "custom-3d-object",
    products: [
      {
        id: "custom-3d-object",
        name: "Customize Your 3D Object",
        custom: true,
        kind: "object",
        shape: "panther",
        model: "/products/3d/panther.stl",
        modelFit: 0.84,
        modelLift: -0.08,
        material: "Your model or idea, prepared for 3D printing",
        price: "Custom quote",
        customDescription: "Start from an STL, reference image, or written idea and choose the scale and print color for a made-to-order object.",
      },
      {
        id: "object-panther",
        name: "Panther",
        kind: "object",
        shape: "panther",
        model: "/products/3d/panther.stl",
        modelFit: 0.84,
        modelLift: -0.08,
        material: "3D print source: panter.stl",
        price: "Quote",
      },
      {
        id: "object-fidget-central-gear",
        name: "Fidget Central Gear",
        kind: "object",
        shape: "spinner",
        model: "/products/3d/fidget-central-gear.stl",
        modelRotation: [0, 0, 0],
        modelFit: 0.74,
        modelLift: -0.04,
        material: "3D print source: central-gear.stl",
        price: "Quote",
      },
      {
        id: "object-batarang-6mm",
        name: "Batarang 6mm",
        kind: "object",
        shape: "spinner",
        model: "/products/3d/batarang-6mm.stl",
        modelRotation: [0, 0, 0],
        modelFit: 0.78,
        modelLift: -0.02,
        material: "3D print source: beyond.stl",
        price: "Quote",
      },
      {
        id: "object-batman-bookmark",
        name: "Batman Bookmark",
        kind: "object",
        shape: "stand",
        model: "/products/3d/batman-bookmark.stl",
        modelRotation: [0, 0, 0],
        modelFit: 0.82,
        modelLift: -0.02,
        material: "3D print source: batman-bookmark.stl",
        price: "Quote",
      },
      {
        id: "object-picture-frame-corner-2mm",
        name: "Picture Frame Corner 2mm",
        kind: "object",
        shape: "stand",
        model: "/products/3d/picture-frame-corner-2mm.stl",
        modelRotation: [0, 0, 0],
        modelFit: 0.72,
        material: "3D print source: pictureframecorner-1.8mm.stl",
        price: "Quote",
      },
      {
        id: "object-picture-frame-corner-3mm",
        name: "Picture Frame Corner 3mm",
        kind: "object",
        shape: "stand",
        model: "/products/3d/picture-frame-corner-3mm.stl",
        modelRotation: [0, 0, 0],
        modelFit: 0.72,
        material: "3D print source: pictureframecorner-2.8mm.stl",
        price: "Quote",
      },
      {
        id: "object-mini-joker",
        name: "Mini Joker 80mm",
        kind: "object",
        shape: "figure",
        model: "/products/3d/mini-joker.stl",
        modelFit: 0.8,
        modelLift: -0.06,
        material: "3D print source: joker-stl.stl",
        price: "Quote",
      },
      {
        id: "object-mini-superman",
        name: "Mini Superman 80mm",
        kind: "object",
        shape: "superhero",
        model: "/products/3d/mini-superman.stl",
        modelFit: 0.8,
        modelLift: -0.06,
        material: "3D print source: superman-normal-v4-stl-1.stl",
        price: "Quote",
      },
      {
        id: "object-flexi-cat",
        name: "Flexi Cat",
        kind: "object",
        shape: "chain",
        model: "/products/3d/flexi-cat.stl",
        modelRotation: [0, 0, 0],
        modelFit: 0.86,
        modelLift: -0.04,
        material: "3D print source: Flexi Cat V2_1 Buchto.stl",
        price: "Quote",
      },
      {
        id: "object-lamp-base",
        name: "Lamp Base",
        kind: "object",
        shape: "lamp",
        model: "/products/3d/lamp-base.stl",
        modelFit: 0.74,
        modelLift: -0.05,
        material: "3D print source: Lamp-Base.stl",
        price: "Quote",
      },
      {
        id: "object-led-lamp-shade",
        name: "LED Lamp Shade",
        kind: "object",
        shape: "lamp",
        model: "/products/3d/led-lamp-shade.stl",
        modelFit: 0.76,
        modelLift: -0.05,
        material: "3D print source: LED Lamp 001-1.stl",
        price: "Quote",
      },
      {
        id: "object-batman-figure-130mm",
        name: "Batman Figure 130mm",
        kind: "object",
        shape: "figure",
        model: "/products/3d/batman-figure-130mm.stl",
        modelFit: 0.82,
        modelLift: -0.06,
        material: "3D print source: Batman Figure.stl",
        price: "Quote",
      },
      {
        id: "object-batman-stand-150mm",
        name: "Batman Stand 150mm",
        kind: "object",
        shape: "stand",
        model: "/products/3d/batman-stand-150mm.stl",
        modelFit: 0.82,
        modelLift: -0.06,
        material: "3D print source: Batman_Stand.stl",
        price: "Quote",
      },
      {
        id: "object-mini-batman-90mm",
        name: "Mini Batman 90mm",
        kind: "object",
        shape: "figure",
        model: "/products/3d/mini-batman-90mm.stl",
        modelFit: 0.8,
        modelLift: -0.06,
        material: "3D print source: final-batman-v3.stl",
        price: "Quote",
      },
      {
        id: "object-mini-armored-batman-90mm",
        name: "Mini Armored Batman 90mm",
        kind: "object",
        shape: "superhero",
        model: "/products/3d/mini-armored-batman-90mm.stl",
        modelFit: 0.8,
        modelLift: -0.06,
        material: "3D print source: armored-batman-v2-stl (1).stl",
        price: "Quote",
      },
    ],
  },
];

// Matched products carry their REAL live-Shopify starting price ("from" = cheapest variant)
// so search results and list surfaces agree with the store. Panel prices are computed per
// selection in hud.js from the same COMMERCE data.
for (const category of categories) {
  for (const product of category.products) {
    const commerce = COMMERCE[product.id];
    if (!commerce?.variants?.length) continue;
    const min = Math.min(...commerce.variants.map((variant) => variant.price));
    product.price = `PKR ${Math.round(min).toLocaleString("en-US")}`;
    product.shopifyHandle = commerce.handle;
  }
}

export function getCategory(categoryId) {
  return categories.find((category) => category.id === categoryId) ?? categories[0];
}

export function getProduct(productId) {
  for (const category of categories) {
    const product = category.products.find((item) => item.id === productId);
    if (product) {
      return { product, category };
    }
  }

  return { product: categories[0].products[0], category: categories[0] };
}

export function getHeroProduct(category) {
  return category.products.find((product) => product.id === category.heroProductId) ?? category.products[0];
}

export function getSubcollection(category, subcollectionId) {
  return category.subcollections?.find((subcollection) => subcollection.id === subcollectionId) ?? null;
}

export function getSubcollectionProducts(category, subcollectionId) {
  const subcollection = getSubcollection(category, subcollectionId);
  if (!subcollection) return category.products;
  const productById = new Map(category.products.map((product) => [product.id, product]));
  return subcollection.productIds.map((productId) => productById.get(productId)).filter(Boolean);
}

export function getSubcollectionHeroProduct(category, subcollectionId) {
  const subcollection = getSubcollection(category, subcollectionId);
  if (!subcollection) return getHeroProduct(category);
  const products = getSubcollectionProducts(category, subcollection.id);
  return products.find((product) => product.id === subcollection.coverProductId) ?? products[0] ?? getHeroProduct(category);
}
