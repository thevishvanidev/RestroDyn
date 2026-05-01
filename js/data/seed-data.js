// ── RestroDyn Seed Data ──
// Pre-populates the store with demo menu data for a specific restaurant
// Now namespace-aware: data is seeded under the active restaurant context
// Firebase-aware: syncs platform data from Firestore on startup

import { saveCategories, saveMenuItems, getSettings, saveSettings, markInitialized, isInitialized, setStoreNamespace, getStoreNamespace } from './store.js';
import { initializePlatform, getAllRestaurants, syncPlatformData } from './platform-store.js';
import { syncRestaurantData } from './firebase-store.js';
import { generateId } from '../utils/helpers.js';

const CATEGORIES = [
  { id: 'cat-starters', name: 'Starters', icon: '🥗', order: 0 },
  { id: 'cat-mains', name: 'Main Course', icon: '🍛', order: 1 },
  { id: 'cat-pizza', name: 'Pizza', icon: '🍕', order: 2 },
  { id: 'cat-burgers', name: 'Burgers', icon: '🍔', order: 3 },
  { id: 'cat-desserts', name: 'Desserts', icon: '🍰', order: 4 },
  { id: 'cat-drinks', name: 'Beverages', icon: '🥤', order: 5 },
];

const MENU_ITEMS = [
  // Starters
  {
    id: 'item-1', categoryId: 'cat-starters', name: 'Truffle Mushroom Bruschetta',
    description: 'Crispy sourdough topped with wild mushroom ragout, truffle oil & microgreens',
    price: 349, prepTime: 10, spiceLevel: 0,
    tags: ['vegetarian'], available: true,
    image: '/assets/food/bruschetta.jpg',
    addons: [
      { name: 'Extra Truffle Oil', price: 79 },
      { name: 'Add Parmesan Shavings', price: 49 },
    ],
  },
  {
    id: 'item-2', categoryId: 'cat-starters', name: 'Dynamite Shrimp Tempura',
    description: 'Crispy tiger shrimp in spicy mayo, sriracha drizzle & sesame seeds',
    price: 449, prepTime: 12, spiceLevel: 2,
    tags: [], available: true,
    image: '/assets/food/shrimp.jpg',
    addons: [
      { name: 'Extra Dipping Sauce', price: 39 },
    ],
  },
  {
    id: 'item-3', categoryId: 'cat-starters', name: 'Avocado Tartare',
    description: 'Fresh avocado, cherry tomatoes, lime zest, cilantro on wonton crisps',
    price: 299, prepTime: 8, spiceLevel: 0,
    tags: ['vegan', 'gluten-free'], available: true,
    image: '/assets/food/avocado.jpg',
    addons: [],
  },
  
  // Main Course
  {
    id: 'item-4', categoryId: 'cat-mains', name: 'Butter Chicken Royale',
    description: 'Tender chicken in rich tomato-butter gravy, served with garlic naan & saffron rice',
    price: 549, prepTime: 20, spiceLevel: 1,
    tags: [], available: true,
    image: '/assets/food/butter-chicken.jpg',
    addons: [
      { name: 'Extra Naan', price: 49 },
      { name: 'Extra Rice', price: 69 },
      { name: 'Make it Spicy 🌶️', price: 0 },
    ],
  },
  {
    id: 'item-5', categoryId: 'cat-mains', name: 'Grilled Salmon Teriyaki',
    description: 'Atlantic salmon fillet, teriyaki glaze, steamed vegetables & jasmine rice',
    price: 799, prepTime: 22, spiceLevel: 0,
    tags: ['gluten-free'], available: true,
    image: '/assets/food/salmon.jpg',
    addons: [
      { name: 'Add Miso Soup', price: 99 },
    ],
  },
  {
    id: 'item-6', categoryId: 'cat-mains', name: 'Paneer Tikka Masala',
    description: 'Chargrilled paneer cubes in smoky tikka masala, with laccha paratha',
    price: 449, prepTime: 18, spiceLevel: 2,
    tags: ['vegetarian'], available: true,
    image: '/assets/food/paneer.jpg',
    addons: [
      { name: 'Extra Paratha', price: 49 },
      { name: 'Add Raita', price: 39 },
    ],
  },
  {
    id: 'item-7', categoryId: 'cat-mains', name: 'Lamb Rogan Josh',
    description: 'Slow-cooked lamb in aromatic Kashmiri spices, with steamed basmati',
    price: 699, prepTime: 25, spiceLevel: 2,
    tags: [], available: true,
    image: '/assets/food/lamb.jpg',
    addons: [
      { name: 'Extra Rice', price: 69 },
    ],
  },

  // Pizza
  {
    id: 'item-8', categoryId: 'cat-pizza', name: 'Margherita Classica',
    description: 'San Marzano tomato, fresh mozzarella, basil, extra virgin olive oil',
    price: 399, prepTime: 15, spiceLevel: 0,
    tags: ['vegetarian'], available: true,
    image: '/assets/food/margherita.jpg',
    addons: [
      { name: 'Extra Cheese', price: 79 },
      { name: 'Add Jalapeños', price: 39 },
      { name: 'Thin Crust', price: 0 },
    ],
  },
  {
    id: 'item-9', categoryId: 'cat-pizza', name: 'BBQ Chicken Supreme',
    description: 'Smoky BBQ sauce, grilled chicken, red onion, bell peppers, smoked gouda',
    price: 549, prepTime: 18, spiceLevel: 1,
    tags: [], available: true,
    image: '/assets/food/bbq-pizza.jpg',
    addons: [
      { name: 'Extra Cheese', price: 79 },
      { name: 'Stuffed Crust', price: 99 },
    ],
  },

  // Burgers
  {
    id: 'item-10', categoryId: 'cat-burgers', name: 'The Classic Smash',
    description: 'Double smashed beef patty, American cheese, pickles, special sauce, brioche bun',
    price: 449, prepTime: 14, spiceLevel: 0,
    tags: [], available: true,
    image: '/assets/food/smash-burger.jpg',
    addons: [
      { name: 'Add Bacon', price: 79 },
      { name: 'Extra Patty', price: 149 },
      { name: 'Sweet Potato Fries', price: 99 },
    ],
  },
  {
    id: 'item-11', categoryId: 'cat-burgers', name: 'Spicy Paneer Burger',
    description: 'Crispy paneer patty, chipotle mayo, lettuce, tomato, onion rings',
    price: 349, prepTime: 12, spiceLevel: 2,
    tags: ['vegetarian'], available: true,
    image: '/assets/food/paneer-burger.jpg',
    addons: [
      { name: 'Add Cheese Slice', price: 39 },
      { name: 'Regular Fries', price: 79 },
    ],
  },

  // Desserts
  {
    id: 'item-12', categoryId: 'cat-desserts', name: 'Molten Chocolate Lava Cake',
    description: 'Warm chocolate cake with a gooey center, vanilla bean ice cream',
    price: 349, prepTime: 12, spiceLevel: 0,
    tags: ['vegetarian'], available: true,
    image: '/assets/food/lava-cake.jpg',
    addons: [
      { name: 'Extra Scoop Ice Cream', price: 69 },
    ],
  },
  {
    id: 'item-13', categoryId: 'cat-desserts', name: 'Tiramisu',
    description: 'Classic Italian layered mascarpone, espresso-soaked ladyfingers, cocoa dust',
    price: 399, prepTime: 5, spiceLevel: 0,
    tags: ['vegetarian'], available: true,
    image: '/assets/food/tiramisu.jpg',
    addons: [],
  },
  {
    id: 'item-14', categoryId: 'cat-desserts', name: 'Mango Panna Cotta',
    description: 'Silky vanilla panna cotta, fresh Alphonso mango compote, pistachios',
    price: 299, prepTime: 5, spiceLevel: 0,
    tags: ['vegetarian', 'gluten-free'], available: true,
    image: '/assets/food/panna-cotta.jpg',
    addons: [],
  },

  // Beverages
  {
    id: 'item-15', categoryId: 'cat-drinks', name: 'Signature Cold Brew',
    description: 'Slow-steeped 18hr cold brew, vanilla, oat milk foam',
    price: 199, prepTime: 3, spiceLevel: 0,
    tags: ['vegan'], available: true,
    image: '/assets/food/cold-brew.jpg',
    addons: [
      { name: 'Extra Shot', price: 49 },
      { name: 'Caramel Syrup', price: 29 },
    ],
  },
  {
    id: 'item-16', categoryId: 'cat-drinks', name: 'Fresh Watermelon Cooler',
    description: 'Fresh pressed watermelon, lime, mint, sparkling water',
    price: 179, prepTime: 4, spiceLevel: 0,
    tags: ['vegan', 'gluten-free'], available: true,
    image: '/assets/food/watermelon.jpg',
    addons: [],
  },
  {
    id: 'item-17', categoryId: 'cat-drinks', name: 'Mango Lassi',
    description: 'Creamy yogurt smoothie with Alphonso mango, cardamom, saffron strand',
    price: 159, prepTime: 4, spiceLevel: 0,
    tags: ['vegetarian', 'gluten-free'], available: true,
    image: '/assets/food/mango-lassi.jpg',
    addons: [],
  },
  {
    id: 'item-18', categoryId: 'cat-drinks', name: 'Berry Mojito Mocktail',
    description: 'Fresh berries, lime, mint, sparkling soda — refreshingly vibrant',
    price: 199, prepTime: 5, spiceLevel: 0,
    tags: ['vegan'], available: true,
    image: '/assets/food/mojito.jpg',
    addons: [],
  },
];

export async function seedData() {
  // Sync platform data from Firebase first (if configured)
  await syncPlatformData();

  // Always initialize platform first
  initializePlatform();

  // Seed demo restaurant data if not already done
  const restaurants = getAllRestaurants();
  const demoRestaurant = restaurants.find(r => r.email === 'demo@restrodyn.app');
  if (demoRestaurant) {
    const prevNamespace = getStoreNamespace();
    // Sync demo restaurant's data from Firebase
    await syncRestaurantData(demoRestaurant.id);

    // Seed menu data for the demo restaurant
    setStoreNamespace(demoRestaurant.id);
    if (!isInitialized()) {
      saveCategories(CATEGORIES);
      saveMenuItems(MENU_ITEMS);
      saveSettings({
        restaurantName: demoRestaurant.name,
        tagline: 'Smart dining, elevated experience',
        currency: '₹',
        accentColor: '#FFC107',
        tableCount: 20,
      });
      markInitialized();
      console.log('🍽️ RestroDyn: Demo restaurant data seeded');
    }
    // Reset namespace ONLY if it was previously set
    if (prevNamespace) {
      setStoreNamespace(prevNamespace);
    }
  }
}

// Seed data for a specific restaurant (called during registration or first login)
export async function seedRestaurantDefaults(restaurantId, restaurantName) {
  const prevNamespace = getStoreNamespace();
  // CRITICAL: Always wait for sync first so we don't overwrite cloud data with defaults
  await syncRestaurantData(restaurantId);
  
  setStoreNamespace(restaurantId);
  
  if (!isInitialized()) {
    // Start with a basic set of categories ONLY if the cloud has nothing
    saveCategories([
      { id: generateId(), name: 'Starters', icon: '🥗', order: 0 },
      { id: generateId(), name: 'Main Course', icon: '🍛', order: 1 },
      { id: generateId(), name: 'Desserts', icon: '🍰', order: 2 },
      { id: generateId(), name: 'Beverages', icon: '🥤', order: 3 },
    ]);
    saveMenuItems([]);
    saveSettings({
      restaurantName: restaurantName,
      tagline: 'Welcome to our restaurant',
      currency: '₹',
      accentColor: '#FFC107',
      tableCount: 10,
    });
    markInitialized();
  }
  
  // Reset namespace ONLY if it was previously set
  if (prevNamespace) {
    setStoreNamespace(prevNamespace);
  }
}
