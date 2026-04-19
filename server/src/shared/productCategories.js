/**
 * server/src/shared/productCategories.js
 * Single source of truth for the product category/subcategory taxonomy.
 * CommonJS version — consumed by the backend (controllers, seed, validation).
 * Keep in sync with the TypeScript version at shared/productCategories.ts
 */

const PRODUCT_CATEGORIES = [
  {
    id: 'electronics',
    label: 'Electronics',
    icon: 'hardware-chip-outline',
    subcategories: [
      { id: 'smartphones',  label: 'Smartphones & Tablets' },
      { id: 'computers',    label: 'Computers & Laptops' },
      { id: 'audio',        label: 'Audio & Headphones' },
      { id: 'cameras',      label: 'Cameras & Photography' },
      { id: 'tv_displays',  label: 'TVs & Displays' },
      { id: 'accessories',  label: 'Electronics Accessories' },
      { id: 'networking',   label: 'Networking & Connectivity' },
      { id: 'wearables',    label: 'Wearables & Smart Devices' },
    ],
  },
  {
    id: 'fashion',
    label: 'Fashion & Apparel',
    icon: 'shirt-outline',
    subcategories: [
      { id: 'mens_clothing',   label: "Men's Clothing" },
      { id: 'womens_clothing', label: "Women's Clothing" },
      { id: 'kids_clothing',   label: "Kids' Clothing" },
      { id: 'footwear',        label: 'Footwear' },
      { id: 'bags',            label: 'Bags & Luggage' },
      { id: 'jewelry',         label: 'Jewelry & Accessories' },
      { id: 'watches',         label: 'Watches' },
      { id: 'sportswear',      label: 'Sportswear & Activewear' },
    ],
  },
  {
    id: 'home_living',
    label: 'Home & Living',
    icon: 'home-outline',
    subcategories: [
      { id: 'furniture',   label: 'Furniture' },
      { id: 'kitchen',     label: 'Kitchen & Dining' },
      { id: 'bedding',     label: 'Bedding & Bath' },
      { id: 'decor',       label: 'Home Décor' },
      { id: 'lighting',    label: 'Lighting' },
      { id: 'garden',      label: 'Garden & Outdoor' },
      { id: 'cleaning',    label: 'Cleaning & Organization' },
      { id: 'appliances',  label: 'Home Appliances' },
    ],
  },
  {
    id: 'food_beverage',
    label: 'Food & Beverage',
    icon: 'restaurant-outline',
    subcategories: [
      { id: 'fresh_produce', label: 'Fresh Produce' },
      { id: 'dairy',         label: 'Dairy & Eggs' },
      { id: 'beverages',     label: 'Beverages' },
      { id: 'snacks',        label: 'Snacks & Confectionery' },
      { id: 'grains',        label: 'Grains & Staples' },
      { id: 'spices',        label: 'Spices & Condiments' },
      { id: 'organic',       label: 'Organic & Natural' },
      { id: 'bakery',        label: 'Bakery & Pastries' },
    ],
  },
  {
    id: 'health_beauty',
    label: 'Health & Beauty',
    icon: 'heart-outline',
    subcategories: [
      { id: 'skincare',      label: 'Skincare' },
      { id: 'haircare',      label: 'Hair Care' },
      { id: 'makeup',        label: 'Makeup & Cosmetics' },
      { id: 'fragrances',    label: 'Fragrances & Perfumes' },
      { id: 'supplements',   label: 'Vitamins & Supplements' },
      { id: 'medical',       label: 'Medical & First Aid' },
      { id: 'fitness',       label: 'Fitness & Wellness' },
      { id: 'personal_care', label: 'Personal Care' },
    ],
  },
  {
    id: 'sports',
    label: 'Sports & Outdoors',
    icon: 'football-outline',
    subcategories: [
      { id: 'team_sports',       label: 'Team Sports' },
      { id: 'fitness_equipment', label: 'Fitness Equipment' },
      { id: 'outdoor_adventure', label: 'Outdoor & Adventure' },
      { id: 'water_sports',      label: 'Water Sports' },
      { id: 'cycling',           label: 'Cycling' },
      { id: 'running',           label: 'Running & Athletics' },
      { id: 'camping',           label: 'Camping & Hiking' },
      { id: 'racquet_sports',    label: 'Racquet Sports' },
    ],
  },
  {
    id: 'construction',
    label: 'Construction & Hardware',
    icon: 'construct-outline',
    subcategories: [
      { id: 'building_materials', label: 'Building Materials' },
      { id: 'tools',              label: 'Tools & Equipment' },
      { id: 'plumbing',           label: 'Plumbing' },
      { id: 'electrical',         label: 'Electrical Supplies' },
      { id: 'paint',              label: 'Paint & Finishes' },
      { id: 'flooring',           label: 'Flooring' },
      { id: 'roofing',            label: 'Roofing' },
      { id: 'safety',             label: 'Safety & Security' },
    ],
  },
  {
    id: 'automotive',
    label: 'Automotive',
    icon: 'car-outline',
    subcategories: [
      { id: 'car_parts',       label: 'Car Parts & Accessories' },
      { id: 'oils_fluids',     label: 'Oils & Fluids' },
      { id: 'tires',           label: 'Tires & Wheels' },
      { id: 'car_electronics', label: 'Car Electronics' },
      { id: 'tools_equipment', label: 'Tools & Equipment' },
      { id: 'motorcycles',     label: 'Motorcycles & Parts' },
    ],
  },
  {
    id: 'office_stationery',
    label: 'Office & Stationery',
    icon: 'briefcase-outline',
    subcategories: [
      { id: 'office_supplies',  label: 'Office Supplies' },
      { id: 'printing',         label: 'Printing & Paper' },
      { id: 'furniture_office', label: 'Office Furniture' },
      { id: 'writing',          label: 'Writing Instruments' },
      { id: 'filing',           label: 'Filing & Organization' },
    ],
  },
  {
    id: 'art_crafts',
    label: 'Art & Crafts',
    icon: 'color-palette-outline',
    subcategories: [
      { id: 'painting',     label: 'Painting & Drawing' },
      { id: 'sewing',       label: 'Sewing & Textiles' },
      { id: 'handmade',     label: 'Handmade & Custom' },
      { id: 'framing',      label: 'Framing & Display' },
      { id: 'scrapbooking', label: 'Scrapbooking & Paper' },
    ],
  },
  {
    id: 'books_media',
    label: 'Books & Media',
    icon: 'book-outline',
    subcategories: [
      { id: 'books',       label: 'Books' },
      { id: 'ebooks',      label: 'eBooks & Digital' },
      { id: 'music',       label: 'Music & Instruments' },
      { id: 'movies',      label: 'Movies & TV' },
      { id: 'games',       label: 'Games & Toys' },
      { id: 'educational', label: 'Educational Materials' },
    ],
  },
  {
    id: 'agriculture',
    label: 'Agriculture & Farming',
    icon: 'leaf-outline',
    subcategories: [
      { id: 'seeds',          label: 'Seeds & Seedlings' },
      { id: 'fertilizers',    label: 'Fertilizers & Soil' },
      { id: 'farm_equipment', label: 'Farm Equipment' },
      { id: 'livestock',      label: 'Livestock & Poultry' },
      { id: 'irrigation',     label: 'Irrigation Systems' },
      { id: 'pesticides',     label: 'Pesticides & Herbicides' },
    ],
  },
  {
    id: 'industrial',
    label: 'Industrial & Machinery',
    icon: 'cog-outline',
    subcategories: [
      { id: 'machinery',        label: 'Machinery & Equipment' },
      { id: 'raw_materials',    label: 'Raw Materials' },
      { id: 'packaging',        label: 'Packaging & Containers' },
      { id: 'chemicals',        label: 'Industrial Chemicals' },
      { id: 'safety_equipment', label: 'Safety & PPE' },
    ],
  },
  {
    id: 'other',
    label: 'Other',
    icon: 'grid-outline',
    subcategories: [
      { id: 'miscellaneous', label: 'Miscellaneous' },
    ],
  },
];

/** Flat list of all category ids (for backend enum validation) */
const ALL_CATEGORY_IDS = PRODUCT_CATEGORIES.map(c => c.id);

/** Flat list of all subcategory ids */
const ALL_SUBCATEGORY_IDS = PRODUCT_CATEGORIES.flatMap(c =>
  c.subcategories.map(s => s.id)
);

/** Look up a category by id */
const getCategoryById = (id) =>
  PRODUCT_CATEGORIES.find(c => c.id === id);

/** Look up a subcategory label across all categories */
const getSubcategoryLabel = (subId) => {
  for (const cat of PRODUCT_CATEGORIES) {
    const sub = cat.subcategories.find(s => s.id === subId);
    if (sub) return sub.label;
  }
  return subId;
};

/** Get subcategories for a given category id */
const getSubcategories = (categoryId) =>
  getCategoryById(categoryId)?.subcategories ?? [];

module.exports = {
  PRODUCT_CATEGORIES,
  ALL_CATEGORY_IDS,
  ALL_SUBCATEGORY_IDS,
  getCategoryById,
  getSubcategoryLabel,
  getSubcategories,
};