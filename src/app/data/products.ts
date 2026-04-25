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
    image: 'https://images.unsplash.com/photo-1637690048998-1e41c61c254d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    category: 'From Shein',
    subcategory: 'dresses',
    description: 'A stunning orange summer dress perfect for warm weather occasions. Features a flattering silhouette and elegant draping that moves beautifully.',
    images: [
      'https://images.unsplash.com/photo-1637690048998-1e41c61c254d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1638717366457-dbcaf6b1afbc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1638717368287-5f1f65e8bfdf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
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
    image: 'https://images.unsplash.com/photo-1638717366457-dbcaf6b1afbc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    category: 'From Amazon',
    subcategory: 'dresses',
    description: 'Classic vintage-inspired red evening gown with timeless elegance. Perfect for formal events and special occasions.',
    images: [
      'https://images.unsplash.com/photo-1638717366457-dbcaf6b1afbc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1638717368287-5f1f65e8bfdf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1635693047196-cc0976305ae9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
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
    image: 'https://images.unsplash.com/photo-1638717368287-5f1f65e8bfdf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    category: 'From Shein',
    subcategory: 'dresses',
    description: 'A sophisticated midi dress in rich red, combining modern style with classic appeal. Versatile for both day and evening wear.',
    images: [
      'https://images.unsplash.com/photo-1638717368287-5f1f65e8bfdf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1637690048998-1e41c61c254d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1635693047196-cc0976305ae9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
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
    image: 'https://images.unsplash.com/photo-1764179690401-b7032ffaf7b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    category: 'From Amazon',
    subcategory: 'suits',
    description: 'Contemporary beige suit set with clean lines and minimal design. Perfect for professional settings and modern wardrobes.',
    images: [
      'https://images.unsplash.com/photo-1764179690401-b7032ffaf7b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1764179690227-af049306cd20?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1760551937537-a29dbbfab30b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
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
    image: 'https://images.unsplash.com/photo-1764179690227-af049306cd20?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    category: 'From Shein',
    subcategory: 'casual',
    description: 'Elegant beige dress complemented with a matching scarf. Timeless style that works for any season.',
    images: [
      'https://images.unsplash.com/photo-1764179690227-af049306cd20?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1764179690401-b7032ffaf7b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1637690048998-1e41c61c254d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
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
    image: 'https://images.unsplash.com/photo-1760551937537-a29dbbfab30b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    category: 'From Amazon',
    subcategory: 'coats',
    description: 'Premium black trench coat with timeless design. A wardrobe essential that never goes out of style.',
    images: [
      'https://images.unsplash.com/photo-1760551937537-a29dbbfab30b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1764179690401-b7032ffaf7b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1638717368287-5f1f65e8bfdf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
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
    image: 'https://images.unsplash.com/photo-1755151606192-1c4b4bb88390?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    category: 'From Shein',
    subcategory: 'flats',
    description: 'Stylish croc-embossed mules with silver buckle detail. Comfortable and chic for everyday wear.',
    images: [
      'https://images.unsplash.com/photo-1755151606192-1c4b4bb88390?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1637690048998-1e41c61c254d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1764179690227-af049306cd20?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
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
    image: 'https://images.unsplash.com/photo-1635693047196-cc0976305ae9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    category: 'From Amazon',
    subcategory: 'casual',
    description: 'Beautiful burgundy dress with classic cut and comfortable fit. Perfect for both casual and semi-formal occasions.',
    images: [
      'https://images.unsplash.com/photo-1635693047196-cc0976305ae9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1638717368287-5f1f65e8bfdf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1638717366457-dbcaf6b1afbc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
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
    image: 'https://images.unsplash.com/photo-1629380321696-99d97eaa492a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    category: 'Handmade',
    subcategory: 'bowls',
    description: 'Handcrafted blue ceramic bowl set, perfect for serving or display. Each piece is unique with slight variations.',
    images: [
      'https://images.unsplash.com/photo-1629380321696-99d97eaa492a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1629380321590-3b3f75d66dec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1610701596061-2ecf227e85b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
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
    image: 'https://images.unsplash.com/photo-1629380321590-3b3f75d66dec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    category: 'Handmade',
    subcategory: 'vases',
    description: 'Beautiful artisan-crafted blue vase with organic form. Perfect for fresh or dried flowers.',
    images: [
      'https://images.unsplash.com/photo-1629380321590-3b3f75d66dec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1629380321696-99d97eaa492a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1760764541302-e3955fbc6b2b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
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
    image: 'https://images.unsplash.com/photo-1760764541302-e3955fbc6b2b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    category: 'Handmade',
    subcategory: 'vases',
    description: 'Stunning collection of marbled ceramic vases with unique swirl patterns. Each vase is one-of-a-kind.',
    images: [
      'https://images.unsplash.com/photo-1760764541302-e3955fbc6b2b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1771523353042-981551738dd7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1629380321590-3b3f75d66dec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
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
    image: 'https://images.unsplash.com/photo-1763824372117-1ff339b522e9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    category: 'Handmade',
    subcategory: 'cups',
    description: 'Set of minimalist ceramic cups with clean lines and natural finish. Perfect for tea or coffee.',
    images: [
      'https://images.unsplash.com/photo-1763824372117-1ff339b522e9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1763824371988-8c8eb3d13eff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1610701596061-2ecf227e85b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
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
    image: 'https://images.unsplash.com/photo-1771523353042-981551738dd7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    category: 'Handmade',
    subcategory: 'decorative',
    description: 'Elegant white ceramic vase collection with varied shapes and textures. A beautiful centerpiece for any room.',
    images: [
      'https://images.unsplash.com/photo-1771523353042-981551738dd7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1610701596061-2ecf227e85b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1629380321696-99d97eaa492a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
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
    image: 'https://images.unsplash.com/photo-1610701596061-2ecf227e85b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    category: 'Handmade',
    subcategory: 'bowls',
    description: 'Rustic white ceramic bowls with organic texture. Perfect for serving or as decorative pieces.',
    images: [
      'https://images.unsplash.com/photo-1610701596061-2ecf227e85b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1629380321696-99d97eaa492a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1771523353042-981551738dd7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
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
