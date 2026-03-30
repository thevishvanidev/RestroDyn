// ── RestroDyn Platform Store ──
// Platform-level CRUD for restaurants, subscriptions, config, super admin

const PLATFORM_KEYS = {
  RESTAURANTS: 'restrodyn_platform_restaurants',
  CONFIG: 'restrodyn_platform_config',
  SUPER_ADMIN: 'restrodyn_super_admin',
  PLATFORM_INIT: 'restrodyn_platform_initialized',
  PAYMENT_RECORDS: 'restrodyn_payment_records',
};

function pGet(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function pSet(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ══════════════════════════════════════════
//  PLATFORM CONFIG
// ══════════════════════════════════════════

const DEFAULT_CONFIG = {
  subscriptionPlans: [
    { id: 'monthly', name: 'Monthly', price: 300, duration: 30, features: ['Unlimited Orders', 'QR Codes', 'Kitchen Display', 'Basic Analytics'] },
    { id: 'quarterly', name: 'Quarterly', price: 800, duration: 90, features: ['Everything in Monthly', 'Priority Support', 'Advanced Analytics', 'Custom Branding'] },
    { id: 'yearly', name: 'Yearly', price: 3000, duration: 365, features: ['Everything in Quarterly', 'Dedicated Manager', 'API Access', 'White Label'] },
  ],
  trialDays: 14,
  commission: 0,
  platformName: 'RestroDyn',
  supportEmail: 'support@restrodyn.app',
  paymentMethods: {
    qrImage: '',
    upiId: '',
    bankDetails: {
      accountName: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
    },
  },
};

export function getPlatformConfig() {
  return pGet(PLATFORM_KEYS.CONFIG) || DEFAULT_CONFIG;
}

export function savePlatformConfig(config) {
  pSet(PLATFORM_KEYS.CONFIG, config);
}

export function updatePlatformConfig(updates) {
  const config = getPlatformConfig();
  const updated = { ...config, ...updates };
  savePlatformConfig(updated);
  return updated;
}

// ══════════════════════════════════════════
//  SUPER ADMIN
// ══════════════════════════════════════════

const DEFAULT_SUPER_ADMIN = {
  email: 'admin@restrodyn.app',
  password: 'admin123',
};

export function getSuperAdmin() {
  return pGet(PLATFORM_KEYS.SUPER_ADMIN) || DEFAULT_SUPER_ADMIN;
}

export function saveSuperAdmin(admin) {
  pSet(PLATFORM_KEYS.SUPER_ADMIN, admin);
}

export function verifySuperAdmin(email, password) {
  const admin = getSuperAdmin();
  return admin.email === email && admin.password === password;
}

// ══════════════════════════════════════════
//  RESTAURANTS
// ══════════════════════════════════════════

export function getAllRestaurants() {
  return pGet(PLATFORM_KEYS.RESTAURANTS) || [];
}

export function saveAllRestaurants(restaurants) {
  pSet(PLATFORM_KEYS.RESTAURANTS, restaurants);
}

export function getRestaurant(id) {
  return getAllRestaurants().find(r => r.id === id);
}

export function getRestaurantBySlug(slug) {
  return getAllRestaurants().find(r => r.slug === slug);
}

export function getRestaurantByEmail(email) {
  const normalizedEmail = email.toLowerCase().trim();
  return getAllRestaurants().find(r => r.email.toLowerCase().trim() === normalizedEmail);
}

function generateSlug(name) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const existing = getAllRestaurants();
  let slug = base;
  let counter = 1;
  while (existing.find(r => r.slug === slug)) {
    slug = `${base}-${counter++}`;
  }
  return slug;
}

// Simple hash for demo purposes
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'h' + Math.abs(hash).toString(36);
}

export function registerRestaurant(data) {
  const restaurants = getAllRestaurants();

  // Check duplicate email
  if (restaurants.find(r => r.email === data.email)) {
    return { success: false, error: 'Email already registered' };
  }

  const config = getPlatformConfig();
  const now = Date.now();
  const trialEnd = now + (config.trialDays * 24 * 60 * 60 * 1000);

  const restaurant = {
    id: crypto.randomUUID(),
    name: data.name,
    ownerName: data.ownerName || '',
    slug: generateSlug(data.name),
    email: data.email.toLowerCase().trim(),
    password: simpleHash(data.password),
    phone: data.phone || '',
    address: data.address || '',
    cuisine: data.cuisine || '',
    logo: '',
    status: 'active',
    subscription: {
      plan: 'trial',
      amount: 0,
      status: 'trial',
      startDate: now,
      expiryDate: trialEnd,
      paymentMethod: '',
    },
    createdAt: now,
    lastLogin: now,
    tableCount: 20,
  };

  restaurants.push(restaurant);
  saveAllRestaurants(restaurants);

  return { success: true, restaurant };
}

export function loginRestaurant(email, password) {
  const restaurant = getRestaurantByEmail(email);
  if (!restaurant) return { success: false, error: 'Restaurant not found' };
  if (restaurant.password !== simpleHash(password)) return { success: false, error: 'Invalid password' };
  if (restaurant.status === 'suspended') return { success: false, error: 'Account suspended. Contact support.' };

  // Update last login
  const restaurants = getAllRestaurants().map(r =>
    r.id === restaurant.id ? { ...r, lastLogin: Date.now() } : r
  );
  saveAllRestaurants(restaurants);

  return { success: true, restaurant: { ...restaurant, lastLogin: Date.now() } };
}

export function updateRestaurant(id, updates) {
  const restaurants = getAllRestaurants().map(r =>
    r.id === id ? { ...r, ...updates } : r
  );
  saveAllRestaurants(restaurants);
  return restaurants.find(r => r.id === id);
}

export function updateRestaurantSubscription(id, subscriptionData) {
  const restaurants = getAllRestaurants().map(r => {
    if (r.id === id) {
      return { ...r, subscription: { ...r.subscription, ...subscriptionData } };
    }
    return r;
  });
  saveAllRestaurants(restaurants);
  return restaurants.find(r => r.id === id);
}

export function suspendRestaurant(id) {
  return updateRestaurant(id, { status: 'suspended' });
}

export function activateRestaurant(id) {
  return updateRestaurant(id, { status: 'active' });
}

export function deleteRestaurant(id) {
  const restaurant = getRestaurant(id);
  if (!restaurant) return;

  // Remove restaurant data
  const prefix = `restrodyn_${id}_`;
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));

  // Remove from restaurant list
  const restaurants = getAllRestaurants().filter(r => r.id !== id);
  saveAllRestaurants(restaurants);
}

// ══════════════════════════════════════════
//  PLATFORM STATS
// ══════════════════════════════════════════

export function getPlatformStats() {
  const restaurants = getAllRestaurants();
  const now = Date.now();

  const active = restaurants.filter(r => r.status === 'active').length;
  const suspended = restaurants.filter(r => r.status === 'suspended').length;
  const trial = restaurants.filter(r => r.subscription?.status === 'trial').length;
  const paid = restaurants.filter(r => r.subscription?.status === 'active').length;
  const expired = restaurants.filter(r => r.subscription?.status === 'expired').length;

  // Revenue calculation (simulated)
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthlyRevenue = restaurants
    .filter(r => r.subscription?.status === 'active' && r.subscription?.startDate >= monthStart.getTime())
    .reduce((sum, r) => sum + (r.subscription?.amount || 0), 0);

  // Pending payments
  const allPayments = getPaymentRecords();
  const pendingPayments = allPayments.filter(p => p.status === 'pending').length;

  return {
    totalRestaurants: restaurants.length,
    active,
    suspended,
    pendingPayments,
    trial,
    paid,
    expired,
    monthlyRevenue,
  };
}

// ══════════════════════════════════════════
//  INITIALIZATION
// ══════════════════════════════════════════

export function isPlatformInitialized() {
  return pGet(PLATFORM_KEYS.PLATFORM_INIT) === true;
}

export function markPlatformInitialized() {
  pSet(PLATFORM_KEYS.PLATFORM_INIT, true);
}

export function initializePlatform() {
  if (isPlatformInitialized()) return;

  // Save default config
  savePlatformConfig(DEFAULT_CONFIG);

  // Save default super admin
  saveSuperAdmin(DEFAULT_SUPER_ADMIN);

  // Create a demo restaurant
  const demoResult = registerRestaurant({
    name: 'RestroDyn Demo',
    ownerName: 'Demo Owner',
    email: 'demo@restrodyn.app',
    password: 'demo123',
    phone: '+91-9876543210',
    address: '123 Food Street, Mumbai',
    cuisine: 'Multi-Cuisine',
  });

  if (demoResult.success) {
    // Mark the demo restaurant as paid with yearly plan
    const config = getPlatformConfig();
    const yearlyPlan = config.subscriptionPlans.find(p => p.id === 'yearly');
    updateRestaurantSubscription(demoResult.restaurant.id, {
      plan: 'yearly',
      amount: yearlyPlan?.price || 3000,
      status: 'active',
      startDate: Date.now(),
      expiryDate: Date.now() + (365 * 24 * 60 * 60 * 1000),
      paymentMethod: 'UPI',
    });
  }

  markPlatformInitialized();
  console.log('🌐 RestroDyn Platform: Initialized with demo restaurant');
}

// ══════════════════════════════════════════
//  PAYMENT RECORDS
// ══════════════════════════════════════════

export function getPaymentRecords() {
  return pGet(PLATFORM_KEYS.PAYMENT_RECORDS) || [];
}

export function savePaymentRecords(records) {
  pSet(PLATFORM_KEYS.PAYMENT_RECORDS, records);
}

export function getPaymentsByRestaurant(restaurantId) {
  return getPaymentRecords().filter(p => p.restaurantId === restaurantId);
}

export function submitPayment(data) {
  const records = getPaymentRecords();
  const payment = {
    id: crypto.randomUUID(),
    restaurantId: data.restaurantId,
    restaurantName: data.restaurantName,
    planId: data.planId,
    planName: data.planName,
    amount: data.amount,
    duration: data.duration,
    paymentMethod: data.paymentMethod,
    proofImage: data.proofImage || '',
    upiRef: data.upiRef || '',
    bankRef: data.bankRef || '',
    status: 'pending',
    submittedAt: Date.now(),
    reviewedAt: null,
    reviewNote: '',
  };
  records.push(payment);
  savePaymentRecords(records);
  return payment;
}

export function approvePayment(paymentId) {
  const records = getPaymentRecords();
  const payment = records.find(p => p.id === paymentId);
  if (!payment) return null;

  payment.status = 'approved';
  payment.reviewedAt = Date.now();
  savePaymentRecords(records);

  // Activate the subscription for the restaurant
  const config = getPlatformConfig();
  const plan = config.subscriptionPlans.find(p => p.id === payment.planId);
  if (plan) {
    updateRestaurantSubscription(payment.restaurantId, {
      plan: payment.planId,
      amount: payment.amount,
      status: 'active',
      startDate: Date.now(),
      expiryDate: Date.now() + (plan.duration * 24 * 60 * 60 * 1000),
      paymentMethod: payment.paymentMethod,
    });
  }

  return payment;
}

export function rejectPayment(paymentId, note = '') {
  const records = getPaymentRecords();
  const payment = records.find(p => p.id === paymentId);
  if (!payment) return null;

  payment.status = 'rejected';
  payment.reviewedAt = Date.now();
  payment.reviewNote = note;
  savePaymentRecords(records);
  return payment;
}
