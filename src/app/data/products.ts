export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  subcategory?: string;
  description: string;
  images: string[];
  details: {
    material?: string;
    size?: string;
    sizeOptions?: string[];
    colorOptions?: string[];
    sizeStock?: Record<string, number>;
    colorStock?: Record<string, number>;
    color?: string;
    care?: string;
    origin?: string;
  };
}

export const curatedProducts: Product[] = [
  {
    id: 1,
    name: 'Elegant Orange Summer Dress',
    price: 89,
    image: '/assets/aHR0cHM6_photo-1637690048998-1e41c61c254d.jpg',
    category: 'From Shein',
    subcategory: 'dresses',
    description: 'A stunning orange summer dress perfect for warm weather occasions. Features a flattering silhouette and elegant draping that moves beautifully.',
    images: [
      '/assets/aHR0cHM6_photo-1637690048998-1e41c61c254d.jpg',
      '/assets/aHR0cHM6_photo-1638717366457-dbcaf6b1afbc.jpg',
      '/assets/aHR0cHM6_photo-1638717368287-5f1f65e8bfdf.jpg',
    ],
    details: {
      material: 'Polyester blend',
      size: 'S, M, L, XL available',
      color: 'Sunset Orange',
      care: 'Machine wash cold, hang dry',
    },
  },
  {
    id: 2,
    name: 'Vintage Red Evening Gown',
    price: 125,
    image: '/assets/aHR0cHM6_photo-1638717366457-dbcaf6b1afbc.jpg',
    category: 'From Amazon',
    subcategory: 'dresses',
    description: 'Classic vintage-inspired red evening gown with timeless elegance. Perfect for formal events and special occasions.',
    images: [
      '/assets/aHR0cHM6_photo-1638717366457-dbcaf6b1afbc.jpg',
      '/assets/aHR0cHM6_photo-1638717368287-5f1f65e8bfdf.jpg',
      '/assets/aHR0cHM6_photo-1635693047196-cc0976305ae9.jpg',
    ],
    details: {
      material: 'Silk blend',
      size: 'XS, S, M, L, XL',
      color: 'Deep Red',
      care: 'Dry clean only',
    },
  },
  {
    id: 3,
    name: 'Sophisticated Red Midi Dress',
    price: 95,
    image: '/assets/aHR0cHM6_photo-1638717368287-5f1f65e8bfdf.jpg',
    category: 'From Shein',
    subcategory: 'dresses',
    description: 'A sophisticated midi dress in rich red, combining modern style with classic appeal. Versatile for both day and evening wear.',
    images: [
      '/assets/aHR0cHM6_photo-1638717368287-5f1f65e8bfdf.jpg',
      '/assets/aHR0cHM6_photo-1637690048998-1e41c61c254d.jpg',
      '/assets/aHR0cHM6_photo-1635693047196-cc0976305ae9.jpg',
    ],
    details: {
      material: 'Cotton blend',
      size: 'S, M, L',
      color: 'Burgundy Red',
      care: 'Machine wash gentle cycle',
    },
  },
  {
    id: 4,
    name: 'Minimalist Beige Suit Set',
    price: 145,
    image: '/assets/aHR0cHM6_photo-1764179690401-b7032ffaf7b1.jpg',
    category: 'From Amazon',
    subcategory: 'suits',
    description: 'Contemporary beige suit set with clean lines and minimal design. Perfect for professional settings and modern wardrobes.',
    images: [
      '/assets/aHR0cHM6_photo-1764179690401-b7032ffaf7b1.jpg',
      '/assets/aHR0cHM6_photo-1764179690227-af049306cd20.jpg',
      '/assets/aHR0cHM6_photo-1760551937537-a29dbbfab30b.jpg',
    ],
    details: {
      material: 'Premium wool blend',
      size: 'XS, S, M, L, XL',
      color: 'Warm Beige',
      care: 'Dry clean recommended',
    },
  },
  {
    id: 5,
    name: 'Classic Beige Dress with Scarf',
    price: 110,
    image: '/assets/aHR0cHM6_photo-1764179690227-af049306cd20.jpg',
    category: 'From Shein',
    subcategory: 'casual',
    description: 'Elegant beige dress complemented with a matching scarf. Timeless style that works for any season.',
    images: [
      '/assets/aHR0cHM6_photo-1764179690227-af049306cd20.jpg',
      '/assets/aHR0cHM6_photo-1764179690401-b7032ffaf7b1.jpg',
      '/assets/aHR0cHM6_photo-1637690048998-1e41c61c254d.jpg',
    ],
    details: {
      material: 'Linen blend',
      size: 'S, M, L, XL',
      color: 'Natural Beige',
      care: 'Hand wash or gentle cycle',
    },
  },
  {
    id: 6,
    name: 'Luxury Black Trench Coat',
    price: 175,
    image: '/assets/aHR0cHM6_photo-1760551937537-a29dbbfab30b.jpg',
    category: 'From Amazon',
    subcategory: 'coats',
    description: 'Premium black trench coat with timeless design. A wardrobe essential that never goes out of style.',
    images: [
      '/assets/aHR0cHM6_photo-1760551937537-a29dbbfab30b.jpg',
      '/assets/aHR0cHM6_photo-1764179690401-b7032ffaf7b1.jpg',
      '/assets/aHR0cHM6_photo-1638717368287-5f1f65e8bfdf.jpg',
    ],
    details: {
      material: 'Water-resistant cotton',
      size: 'XS, S, M, L, XL, XXL',
      color: 'Classic Black',
      care: 'Dry clean only',
    },
  },
  {
    id: 7,
    name: 'Designer Croc-Embossed Mules',
    price: 68,
    image: '/assets/aHR0cHM6_photo-1755151606192-1c4b4bb88390.jpg',
    category: 'From Shein',
    subcategory: 'flats',
    description: 'Stylish croc-embossed mules with silver buckle detail. Comfortable and chic for everyday wear.',
    images: [
      '/assets/aHR0cHM6_photo-1755151606192-1c4b4bb88390.jpg',
      '/assets/aHR0cHM6_photo-1637690048998-1e41c61c254d.jpg',
      '/assets/aHR0cHM6_photo-1764179690227-af049306cd20.jpg',
    ],
    details: {
      material: 'Faux leather',
      size: '6, 7, 8, 9, 10',
      color: 'Black',
      care: 'Wipe clean with damp cloth',
    },
  },
  {
    id: 8,
    name: 'Timeless Burgundy Dress',
    price: 85,
    image: '/assets/aHR0cHM6_photo-1635693047196-cc0976305ae9.jpg',
    category: 'From Amazon',
    subcategory: 'casual',
    description: 'Beautiful burgundy dress with classic cut and comfortable fit. Perfect for both casual and semi-formal occasions.',
    images: [
      '/assets/aHR0cHM6_photo-1635693047196-cc0976305ae9.jpg',
      '/assets/aHR0cHM6_photo-1638717368287-5f1f65e8bfdf.jpg',
      '/assets/aHR0cHM6_photo-1638717366457-dbcaf6b1afbc.jpg',
    ],
    details: {
      material: 'Jersey knit',
      size: 'XS, S, M, L',
      color: 'Burgundy',
      care: 'Machine wash cold',
    },
  },
];

export const handmadeProducts: Product[] = [
  {
    id: 101,
    name: 'Blue Ceramic Bowl Set',
    price: 65,
    image: '/assets/aHR0cHM6_photo-1629380321696-99d97eaa492a.jpg',
    category: 'Handmade',
    subcategory: 'bowls',
    description: 'Handcrafted blue ceramic bowl set, perfect for serving or display. Each piece is unique with slight variations.',
    images: [
      '/assets/aHR0cHM6_photo-1629380321696-99d97eaa492a.jpg',
      '/assets/aHR0cHM6_photo-1629380321590-3b3f75d66dec.jpg',
      '/assets/aHR0cHM6_photo-1610701596061-2ecf227e85b2.jpg',
    ],
    details: {
      material: 'Stoneware ceramic',
      size: 'Set of 3 bowls',
      color: 'Ocean Blue',
      care: 'Dishwasher safe, microwave safe',
      origin: 'Handmade by local artisans',
    },
  },
  {
    id: 102,
    name: 'Artisan Blue Vase',
    price: 48,
    image: '/assets/aHR0cHM6_photo-1629380321590-3b3f75d66dec.jpg',
    category: 'Handmade',
    subcategory: 'vases',
    description: 'Beautiful artisan-crafted blue vase with organic form. Perfect for fresh or dried flowers.',
    images: [
      '/assets/aHR0cHM6_photo-1629380321590-3b3f75d66dec.jpg',
      '/assets/aHR0cHM6_photo-1629380321696-99d97eaa492a.jpg',
      '/assets/aHR0cHM6_photo-1760764541302-e3955fbc6b2b.jpg',
    ],
    details: {
      material: 'Glazed ceramic',
      size: '8" height',
      color: 'Cobalt Blue',
      care: 'Wipe clean with soft cloth',
      origin: 'Handcrafted with love',
    },
  },
  {
    id: 103,
    name: 'Marbled Ceramic Vase Collection',
    price: 120,
    image: '/assets/aHR0cHM6_photo-1760764541302-e3955fbc6b2b.jpg',
    category: 'Handmade',
    subcategory: 'vases',
    description: 'Stunning collection of marbled ceramic vases with unique swirl patterns. Each vase is one-of-a-kind.',
    images: [
      '/assets/aHR0cHM6_photo-1760764541302-e3955fbc6b2b.jpg',
      '/assets/aHR0cHM6_photo-1771523353042-981551738dd7.jpg',
      '/assets/aHR0cHM6_photo-1629380321590-3b3f75d66dec.jpg',
    ],
    details: {
      material: 'Hand-marbled ceramic',
      size: 'Set of 3 (varying heights)',
      color: 'Multi-color marble',
      care: 'Hand wash recommended',
      origin: 'Artisan collection',
    },
  },
  {
    id: 104,
    name: 'Minimalist Ceramic Cups',
    price: 42,
    image: '/assets/aHR0cHM6_photo-1763824372117-1ff339b522e9.jpg',
    category: 'Handmade',
    subcategory: 'cups',
    description: 'Set of minimalist ceramic cups with clean lines and natural finish. Perfect for tea or coffee.',
    images: [
      '/assets/aHR0cHM6_photo-1763824372117-1ff339b522e9.jpg',
      '/assets/aHR0cHM6_photo-1763824371988-8c8eb3d13eff.jpg',
      '/assets/aHR0cHM6_photo-1610701596061-2ecf227e85b2.jpg',
    ],
    details: {
      material: 'Unglazed ceramic',
      size: 'Set of 4 cups',
      color: 'Natural clay',
      care: 'Hand wash only',
      origin: 'Handmade pottery',
    },
  },
  {
    id: 105,
    name: 'Handcrafted White Ceramic Set',
    price: 95,
    image: '/assets/aHR0cHM6_photo-1771523353042-981551738dd7.jpg',
    category: 'Handmade',
    subcategory: 'decorative',
    description: 'Elegant white ceramic vase collection with varied shapes and textures. A beautiful centerpiece for any room.',
    images: [
      '/assets/aHR0cHM6_photo-1771523353042-981551738dd7.jpg',
      '/assets/aHR0cHM6_photo-1610701596061-2ecf227e85b2.jpg',
      '/assets/aHR0cHM6_photo-1629380321696-99d97eaa492a.jpg',
    ],
    details: {
      material: 'White stoneware',
      size: 'Multiple pieces',
      color: 'Pure White',
      care: 'Dishwasher safe',
      origin: 'Artisan crafted',
    },
  },
  {
    id: 106,
    name: 'Rustic White Bowl Collection',
    price: 58,
    image: '/assets/aHR0cHM6_photo-1610701596061-2ecf227e85b2.jpg',
    category: 'Handmade',
    subcategory: 'bowls',
    description: 'Rustic white ceramic bowls with organic texture. Perfect for serving or as decorative pieces.',
    images: [
      '/assets/aHR0cHM6_photo-1610701596061-2ecf227e85b2.jpg',
      '/assets/aHR0cHM6_photo-1629380321696-99d97eaa492a.jpg',
      '/assets/aHR0cHM6_photo-1771523353042-981551738dd7.jpg',
    ],
    details: {
      material: 'Rustic ceramic',
      size: 'Set of 3',
      color: 'Off-white',
      care: 'Hand wash preferred',
      origin: 'Handmade with care',
    },
  },
];

export const allProducts = [...curatedProducts, ...handmadeProducts];
