export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  veg: boolean;
  spicy: number;
  popular?: boolean;
  prepTime: number;
  inStock: boolean;
}

export interface Order {
  id: string;
  table: string;
  items: { name: string; quantity: number; price: number; notes: string }[];
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'served';
  createdAt: number;
}

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  currentOrder?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  coverImage?: string;
  rating: number;
  totalOrders: number;
}

export const categories = [
  { id: 'all', name: 'All', icon: 'Home' },
  { id: 'starters', name: 'Starters', icon: 'Utensils' },
  { id: 'mains', name: 'Main Course', icon: 'ChefHat' },
  { id: 'biryani', name: 'Biryani', icon: 'Coffee' },
  { id: 'drinks', name: 'Beverages', icon: 'Wine' },
  { id: 'desserts', name: 'Desserts', icon: 'Star' }
];

export const menuItems: MenuItem[] = [
  {
    id: 1,
    name: 'Tandoori Chicken',
    description: 'Traditional clay oven roasted chicken with aromatic spices',
    price: 350,
    category: 'starters',
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop',
    veg: false,
    spicy: 2,
    popular: true,
    prepTime: 20,
    inStock: true
  },
  {
    id: 2,
    name: 'Palak Paneer',
    description: 'Creamy spinach curry with cottage cheese cubes',
    price: 280,
    category: 'mains',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop',
    veg: true,
    spicy: 1,
    popular: true,
    prepTime: 25,
    inStock: true
  },
  {
    id: 3,
    name: 'Chicken Biryani',
    description: 'Aromatic basmati rice layered with spiced chicken',
    price: 320,
    category: 'biryani',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop',
    veg: false,
    spicy: 2,
    popular: true,
    prepTime: 30,
    inStock: true
  },
  {
    id: 4,
    name: 'Masala Chai',
    description: 'Traditional Indian spiced tea',
    price: 40,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=300&fit=crop',
    veg: true,
    spicy: 0,
    prepTime: 5,
    inStock: true
  },
  {
    id: 5,
    name: 'Butter Chicken',
    description: 'Rich tomato gravy with tender chicken pieces',
    price: 380,
    category: 'mains',
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop',
    veg: false,
    spicy: 2,
    popular: true,
    prepTime: 25,
    inStock: true
  },
  {
    id: 6,
    name: 'Gulab Jamun',
    description: 'Classic Indian milk dessert in sugar syrup',
    price: 120,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=400&h=300&fit=crop',
    veg: true,
    spicy: 0,
    prepTime: 10,
    inStock: true
  },
  {
    id: 7,
    name: 'Vegetable Fried Rice',
    description: 'Wok-tossed rice with fresh vegetables',
    price: 180,
    category: 'mains',
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop',
    veg: true,
    spicy: 1,
    prepTime: 15,
    inStock: true
  },
  {
    id: 8,
    name: 'Mango Lassi',
    description: 'Sweet yogurt drink with fresh mango',
    price: 80,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400&h=300&fit=crop',
    veg: true,
    spicy: 0,
    prepTime: 5,
    inStock: true
  },
  {
    id: 9,
    name: 'Seekh Kabab',
    description: 'Minced meat skewers with aromatic spices',
    price: 280,
    category: 'starters',
    image: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&h=300&fit=crop',
    veg: false,
    spicy: 2,
    popular: true,
    prepTime: 15,
    inStock: true
  },
  {
    id: 10,
    name: 'Dal Makhani',
    description: 'Slow-cooked black lentils in creamy gravy',
    price: 220,
    category: 'mains',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop',
    veg: true,
    spicy: 1,
    prepTime: 20,
    inStock: true
  },
  {
    id: 11,
    name: 'Mutton Biryani',
    description: 'Fragrant rice with tender mutton pieces',
    price: 420,
    category: 'biryani',
    image: 'https://images.unsplash.com/photo-1589302168068-964668d47e95?w=400&h=300&fit=crop',
    veg: false,
    spicy: 3,
    popular: true,
    prepTime: 35,
    inStock: true
  },
  {
    id: 12,
    name: 'Pista Kulfi',
    description: 'Traditional ice cream with pistachio',
    price: 150,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400&h=300&fit=crop',
    veg: true,
    spicy: 0,
    prepTime: 5,
    inStock: true
  }
];

export const tables: Table[] = [
  { id: 'table-1', number: 1, capacity: 4, status: 'occupied', currentOrder: 'ORD-001' },
  { id: 'table-2', number: 2, capacity: 4, status: 'available' },
  { id: 'table-3', number: 3, capacity: 6, status: 'occupied', currentOrder: 'ORD-002' },
  { id: 'table-4', number: 4, capacity: 2, status: 'reserved' },
  { id: 'table-5', number: 5, capacity: 4, status: 'occupied', currentOrder: 'ORD-003' },
  { id: 'table-6', number: 6, capacity: 8, status: 'available' },
  { id: 'table-7', number: 7, capacity: 4, status: 'occupied' },
  { id: 'table-8', number: 8, capacity: 2, status: 'available' },
  { id: 'table-9', number: 9, capacity: 6, status: 'reserved' },
  { id: 'table-10', number: 10, capacity: 4, status: 'occupied' },
  { id: 'table-11', number: 11, capacity: 4, status: 'available' },
  { id: 'table-12', number: 12, capacity: 8, status: 'occupied' }
];

export const demoRestaurant: Restaurant = {
  id: 'demo-restaurant',
  name: 'Demo Restaurant',
  description: 'A premium dining experience with authentic cuisine',
  address: '123 Food Street, Cuisine City',
  phone: '+91 98765 43210',
  email: 'contact@demorestaurant.com',
  rating: 4.5,
  totalOrders: 15420
};

export const waitCallTypes = [
  { id: 'water', label: 'Water Refill', icon: 'Droplets', color: '#00d4ff' },
  { id: 'extra', label: 'Extra Order', icon: 'Plus', color: '#22c55e' },
  { id: 'bill', label: 'Bill Request', icon: 'Receipt', color: '#a855f7' },
  { id: 'assist', label: 'Assistance', icon: 'MessageSquare', color: '#fbbf24' },
  { id: 'clean', label: 'Clean Table', icon: 'Sparkles', color: '#ec4899' },
  { id: 'emergency', label: 'Emergency', icon: 'AlertTriangle', color: '#ef4444' }
];