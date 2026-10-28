export type CategorySlug = "hombres" | "mujeres" | "juniors" | "accesorios";

export type ProductColor = {
  name: string;
  hex: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: CategorySlug;
  subcategory: string;
  price: number;
  comparePrice?: number;
  model: string;
  images: string[];
  colors: ProductColor[];
  sizes: string[];
  rating: number;
  reviews: number;
  isNew?: boolean;
  isFeatured?: boolean;
  isUnique?: boolean;
  isActive?: boolean;
  description?: string;
  stock?: number;
  sold?: boolean;
};

export type Category = {
  slug: CategorySlug;
  name: string;
  filters: string[];
  image: string;
};

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=80`;

export const categories: Category[] = [
  {
    slug: "hombres",
    name: "Hombres",
    filters: ["Todo", "Básicos", "Playeras", "Polos", "Camisa"],
    image: img("photo-1617137968427-85924c800a22"),
  },
  {
    slug: "mujeres",
    name: "Mujeres",
    filters: ["Todo", "Vestidos", "Blusas", "Pantalones"],
    image: img("photo-1483985988355-763728e1935b"),
  },
  {
    slug: "juniors",
    name: "Juniors",
    filters: ["Todo", "Playeras", "Hoodies", "Jeans"],
    image: img("photo-1556821840-3a63f95609a7"),
  },
  {
    slug: "accesorios",
    name: "Accesorios",
    filters: ["Todo", "Bolsos", "Joyería", "Cinturones"],
    image: img("photo-1490481651871-ab68de25d43d"),
  },
];

const sizes = ["CH", "M", "G", "XG"];

export const products: Product[] = [
  {
    id: "playera-warriors",
    slug: "playera-warriors",
    name: "Playera Warriors NBA",
    brand: "Calvin Klein",
    category: "hombres",
    subcategory: "Playeras",
    price: 169,
    comparePrice: 349,
    model: "3128395",
    images: [
      "/product/warriors-1.jpg",
      "/product/warriors-2.jpg",
      "/product/warriors-3.jpg",
      "/product/warriors-4.jpg",
      "/product/warriors-5.jpg",
    ],
    colors: [
      { name: "Azul", hex: "#1E3A6E" },
      { name: "Negro", hex: "#1D1B19" },
      { name: "Arena", hex: "#E6D7C3" },
    ],
    sizes,
    rating: 5,
    reviews: 18,
    isNew: true,
  },
  {
    id: "camisa-slim",
    slug: "camisa-slim-fit",
    name: "Camisa Slim Fit",
    brand: "Hugo Boss",
    category: "hombres",
    subcategory: "Camisa",
    price: 1299,
    comparePrice: 1850,
    model: "4482101",
    images: [
      img("photo-1603252109303-2751441dd157"),
      img("photo-1594938298603-c8148c4dae35"),
      img("photo-1620799140188-3b2a02fd9a77"),
    ],
    colors: [
      { name: "Blanco", hex: "#F4F1EA" },
      { name: "Azul", hex: "#2C3E6B" },
    ],
    sizes,
    rating: 4,
    reviews: 11,
  },
  {
    id: "chino",
    slug: "pantalon-chino",
    name: "Pantalón Chino",
    brand: "Calvin Klein",
    category: "hombres",
    subcategory: "Básicos",
    price: 899,
    comparePrice: 1199,
    model: "2201844",
    images: [
      img("photo-1473966968600-fa801b869a1a"),
      img("photo-1541099649105-f69ad21f3246"),
    ],
    colors: [
      { name: "Arena", hex: "#C4B39A" },
      { name: "Negro", hex: "#1D1B19" },
    ],
    sizes,
    rating: 5,
    reviews: 9,
  },
  {
    id: "polo",
    slug: "polo-clasico",
    name: "Polo Clásico",
    brand: "Lacoste",
    category: "hombres",
    subcategory: "Polos",
    price: 749,
    comparePrice: 1099,
    model: "7712033",
    images: [
      img("photo-1586363104862-3a5e2ab60d99"),
      img("photo-1618354691373-d851c5c3a990"),
    ],
    colors: [
      { name: "Azul", hex: "#1F4E79" },
      { name: "Blanco", hex: "#F7F4EF" },
    ],
    sizes,
    rating: 4,
    reviews: 14,
    isNew: true,
  },
  {
    id: "chaqueta",
    slug: "chaqueta-ligera",
    name: "Chaqueta Ligera",
    brand: "The North Face",
    category: "hombres",
    subcategory: "Básicos",
    price: 1899,
    comparePrice: 2490,
    model: "9034412",
    images: [
      img("photo-1591047139829-d91aecb6caea"),
      img("photo-1551028719-00167b16eac5"),
    ],
    colors: [
      { name: "Azul", hex: "#243E73" },
      { name: "Negro", hex: "#1D1B19" },
    ],
    sizes,
    rating: 5,
    reviews: 7,
  },
  {
    id: "vestido",
    slug: "vestido-floral",
    name: "Vestido Floral",
    brand: "Carolina Herrera",
    category: "mujeres",
    subcategory: "Vestidos",
    price: 1590,
    comparePrice: 2100,
    model: "1182730",
    images: [
      img("photo-1496747611176-843222e1e57c"),
      img("photo-1515886657613-9f3515b0c78f"),
    ],
    colors: [
      { name: "Arena", hex: "#D8C3A5" },
      { name: "Negro", hex: "#1D1B19" },
    ],
    sizes,
    rating: 5,
    reviews: 16,
    isNew: true,
  },
  {
    id: "blusa",
    slug: "blusa-seda",
    name: "Blusa Seda",
    brand: "Tommy Hilfiger",
    category: "mujeres",
    subcategory: "Blusas",
    price: 980,
    comparePrice: 1400,
    model: "5520198",
    images: [
      img("photo-1434389677669-e08b4cac3105"),
      img("photo-1485968579580-b6d095142e6e"),
    ],
    colors: [
      { name: "Blanco", hex: "#F6F3EE" },
      { name: "Negro", hex: "#1D1B19" },
    ],
    sizes,
    rating: 4,
    reviews: 8,
  },
  {
    id: "jeans-mujer",
    slug: "jeans-recto",
    name: "Jeans Recto",
    brand: "Adidas",
    category: "mujeres",
    subcategory: "Pantalones",
    price: 1290,
    comparePrice: 1690,
    model: "6402281",
    images: [
      img("photo-1541099649105-f69ad21f3246"),
      img("photo-1584370848010-d7fe6bc767ec"),
    ],
    colors: [
      { name: "Azul", hex: "#3E4C66" },
      { name: "Negro", hex: "#1D1B19" },
    ],
    sizes,
    rating: 4,
    reviews: 12,
  },
  {
    id: "hoodie",
    slug: "hoodie-campus",
    name: "Hoodie Campus",
    brand: "Adidas",
    category: "juniors",
    subcategory: "Hoodies",
    price: 890,
    comparePrice: 1200,
    model: "3309182",
    images: [
      img("photo-1556821840-3a63f95609a7"),
      img("photo-1509942774463-acf339cf87d5"),
    ],
    colors: [
      { name: "Gris", hex: "#8E8A84" },
      { name: "Negro", hex: "#1D1B19" },
    ],
    sizes,
    rating: 5,
    reviews: 6,
    isNew: true,
  },
  {
    id: "playera-junior",
    slug: "playera-rayas",
    name: "Playera Rayas",
    brand: "Tommy Hilfiger",
    category: "juniors",
    subcategory: "Playeras",
    price: 499,
    comparePrice: 790,
    model: "2207710",
    images: [
      img("photo-1523381210434-271e8be1f52b"),
      img("photo-1576566588028-4147f3842f27"),
    ],
    colors: [
      { name: "Arena", hex: "#E4D5C4" },
      { name: "Azul", hex: "#2A4D7A" },
    ],
    sizes,
    rating: 4,
    reviews: 5,
  },
  {
    id: "jeans-junior",
    slug: "jeans-junior",
    name: "Jeans Junior",
    brand: "Calvin Klein",
    category: "juniors",
    subcategory: "Jeans",
    price: 799,
    comparePrice: 1090,
    model: "8811204",
    images: [
      img("photo-1542272604-787c3835535d"),
      img("photo-1541099649105-f69ad21f3246"),
    ],
    colors: [{ name: "Azul", hex: "#3A4E6E" }],
    sizes,
    rating: 4,
    reviews: 4,
  },
  {
    id: "bolsa",
    slug: "bolsa-estructurada",
    name: "Bolsa Estructurada",
    brand: "Calvin Klein",
    category: "accesorios",
    subcategory: "Bolsos",
    price: 2190,
    comparePrice: 2890,
    model: "1503321",
    images: [
      img("photo-1590874103328-eac38a683ce7"),
      img("photo-1584917865442-de89df76afd3"),
    ],
    colors: [
      { name: "Negro", hex: "#1D1B19" },
      { name: "Arena", hex: "#C9B59A" },
    ],
    sizes: ["Única"],
    rating: 5,
    reviews: 10,
    isNew: true,
  },
  {
    id: "cadena",
    slug: "cadena-dorada",
    name: "Cadena Dorada",
    brand: "Swarovski",
    category: "accesorios",
    subcategory: "Joyería",
    price: 1450,
    comparePrice: 1890,
    model: "6601944",
    images: [
      img("photo-1515562141207-7a88fb7ce338"),
      img("photo-1611652022419-a9419f74343d"),
    ],
    colors: [{ name: "Dorado", hex: "#C39A6E" }],
    sizes: ["Única"],
    rating: 5,
    reviews: 13,
    stock: 1,
  },
  {
    id: "cinturon",
    slug: "cinturon-piel",
    name: "Cinturón Piel",
    brand: "Hugo Boss",
    category: "accesorios",
    subcategory: "Cinturones",
    price: 890,
    comparePrice: 1200,
    model: "4419088",
    images: [
      img("photo-1553062407-98eeb64c6a62"),
      img("photo-1624222247344-550fb60583fd"),
    ],
    colors: [
      { name: "Negro", hex: "#1D1B19" },
      { name: "Arena", hex: "#A68B62" },
    ],
    sizes: ["Única"],
    rating: 4,
    reviews: 6,
  },
];

export const brands = [
  "Calvin Klein",
  "Adidas",
  "Hugo Boss",
  "Dolce & Gabbana",
  "Carolina Herrera",
  "Tommy Hilfiger",
  "The North Face",
  "Lululemon",
  "Swarovski",
];

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug);
}

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function productStock(product: { stock?: number; isUnique?: boolean }) {
  if (product.isUnique) return product.stock === 0 ? 0 : 1;
  return product.stock ?? 8;
}

export function productsByCategory(slug: CategorySlug) {
  return products.filter((product) => product.category === slug);
}

export function relatedProducts(
  cart: { productId: string; slug: string }[],
  limit = 3,
  catalog: Product[] = products,
) {
  const inCart = new Set(cart.map((line) => line.productId));
  const owned = cart
    .map((line) => catalog.find((product) => product.slug === line.slug) ?? getProduct(line.slug))
    .filter((product): product is Product => Boolean(product));
  const categories = new Set(owned.map((product) => product.category));
  const groups = new Set(owned.map((product) => `${product.category}:${product.subcategory}`));
  const cartHasOffer = owned.some((product) => (product.comparePrice ?? 0) > product.price);

  return catalog
    .filter((product) => product.isActive !== false && !inCart.has(product.id))
    .map((product) => {
      const offer = (product.comparePrice ?? 0) > product.price;
      let score = 0;
      if (categories.has(product.category)) score += 2;
      if (groups.has(`${product.category}:${product.subcategory}`)) score += 2;
      if (cartHasOffer && offer) score += 1;
      if (cart.length > 0 && owned.length === 0 && offer) score += 1;
      return { product, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.product.price - b.product.price)
    .slice(0, limit)
    .map((item) => item.product);
}

export const heroImage = img("photo-1490481651871-ab68de25d43d");
export const aboutImage = img("photo-1503342217505-b0a15ec3261c");
export const offersImage = img("photo-1489987707025-afc232f7ea0f");
export const essentialsImage = img("photo-1523381210434-271e8be1f52b");
export const newImage = img("photo-1487222477894-8943e31ef7b2");

export const stories = [
  {
    quote:
      "La calidad se nota al primer uso. El proceso fue sencillo y el envío llegó rápido.",
    name: "Andrea S.",
  },
  {
    quote:
      "Encontré la talla sin complicarme. Se siente como comprar en tienda, desde casa.",
    name: "Luis M.",
  },
];

export const reasons = [
  {
    title: "Compra digital",
    text: "Tu proceso de compra optimizado, seguro y sin complicaciones.",
    icon: "phone" as const,
    dark: true,
  },
  {
    title: "Envío nacional",
    text: "Llegamos a todo México rápido y garantizado.",
    icon: "truck" as const,
    dark: false,
  },
  {
    title: "Premium quality",
    text: "Solo lo mejor de marcas internacionales selectas.",
    icon: "gem" as const,
    dark: true,
  },
  {
    title: "Asesoría",
    text: "Atención personalizada para que elijas siempre bien.",
    icon: "message" as const,
    dark: false,
  },
];

export const legalPages: Record<string, { title: string; paragraphs: string[] }> = {
  envios: {
    title: "Envíos",
    paragraphs: [
      "Enviamos a todo México. El envío es gratis en compras de $799 pesos o más.",
      "Preparamos tu pedido entre 1 y 2 días hábiles. El tiempo de llegada depende de tu ciudad y te lo confirmamos al salir.",
      "Recibirás el número de guía cuando el paquete esté en camino.",
    ],
  },
  devoluciones: {
    title: "Devoluciones",
    paragraphs: [
      "Tienes 30 días después de recibir tu pedido para pedir un cambio o una devolución.",
      "La prenda debe estar sin uso, con etiquetas y en su empaque. Los accesorios de joyería se revisan al llegar.",
      "Escríbenos por WhatsApp con tu número de pedido y te decimos cómo enviarla.",
    ],
  },
  faq: {
    title: "FAQ",
    paragraphs: [
      "¿Cómo elijo mi talla? En cada prenda está la guía de tallas. Si dudas entre dos, escribe y te orientamos.",
      "¿Puedo comprar sin crear cuenta? En esta etapa recorres la tienda, guardas favoritos y armas tu carrito en este dispositivo.",
      "¿Las marcas son originales? Sí. Trabajamos con marcas premium seleccionadas.",
      "¿Cuándo se cobra? El pago se conecta en el siguiente paso. Por ahora tu carrito queda guardado aquí.",
    ],
  },
  privacidad: {
    title: "Privacidad",
    paragraphs: [
      "Distinto usa los datos de tu pedido para enviarlo y atenderte. No los vendemos.",
      "En esta versión, el carrito y los me gusta viven en tu navegador. No hay una cuenta conectada todavía.",
    ],
  },
  terminos: {
    title: "Términos",
    paragraphs: [
      "Al usar Distinto aceptas que los precios y la disponibilidad se confirman al pagar.",
      "Las fotos son de referencia. El color puede variar un poco según la pantalla.",
      "El envío gratis aplica a partir de $799 pesos en el subtotal, antes de cualquier cupón futuro.",
    ],
  },
  cookies: {
    title: "Cookies",
    paragraphs: [
      "Guardamos tu carrito y tus prendas marcadas con me gusta en el almacenamiento de este navegador.",
      "Sirve para que no se pierdan si cierras la página. Puedes borrarlos limpiando los datos del sitio.",
    ],
  },
};
