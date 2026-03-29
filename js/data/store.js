// ── RestroDyn Data Store ──
// Wraps localStorage with typed operations for menu, orders, and settings
// Now supports restaurant namespacing for multi-tenant operation

let _restaurantId = null;

// Set the active restaurant context — all operations will be namespaced under this ID
export function setStoreNamespace(restaurantId) {
  _restaurantId = restaurantId;
}

export function getStoreNamespace() {
  return _restaurantId;
}

function getKey(baseKey) {
  if (_restaurantId) {
    return `restrodyn_${_restaurantId}_${baseKey}`;
  }
  // Fall back to old un-namespaced keys for backward compat
  return `restrodyn_${baseKey}`;
}

function get(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function set(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ── Categories ──
export function getCategories() {
  return get(getKey('categories')) || [];
}

export function saveCategories(categories) {
  set(getKey('categories'), categories);
}

export function addCategory(category) {
  const cats = getCategories();
  cats.push({ ...category, id: crypto.randomUUID() });
  saveCategories(cats);
  return cats;
}

export function updateCategory(id, updates) {
  const cats = getCategories().map(c => c.id === id ? { ...c, ...updates } : c);
  saveCategories(cats);
  return cats;
}

export function deleteCategory(id) {
  const cats = getCategories().filter(c => c.id !== id);
  saveCategories(cats);
  // Also delete items in this category
  const items = getMenuItems().filter(i => i.categoryId !== id);
  saveMenuItems(items);
  return cats;
}

// ── Menu Items ──
export function getMenuItems() {
  return get(getKey('items')) || [];
}

export function saveMenuItems(items) {
  set(getKey('items'), items);
}

export function getItemsByCategory(categoryId) {
  return getMenuItems().filter(i => i.categoryId === categoryId);
}

export function getItem(id) {
  return getMenuItems().find(i => i.id === id);
}

export function addMenuItem(item) {
  const items = getMenuItems();
  items.push({ ...item, id: crypto.randomUUID(), createdAt: Date.now() });
  saveMenuItems(items);
  return items;
}

export function updateMenuItem(id, updates) {
  const items = getMenuItems().map(i => i.id === id ? { ...i, ...updates } : i);
  saveMenuItems(items);
  return items;
}

export function deleteMenuItem(id) {
  const items = getMenuItems().filter(i => i.id !== id);
  saveMenuItems(items);
  return items;
}

// ── Orders ──
export function getOrders() {
  return get(getKey('orders')) || [];
}

export function saveOrders(orders) {
  set(getKey('orders'), orders);
}

export function addOrder(order) {
  const orders = getOrders();
  const newOrder = {
    ...order,
    id: crypto.randomUUID(),
    orderNumber: generateOrderNumber(),
    status: 'new',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  orders.unshift(newOrder);
  saveOrders(orders);
  return newOrder;
}

export function updateOrderStatus(id, status) {
  const orders = getOrders().map(o => {
    if (o.id === id) {
      return { ...o, status, updatedAt: Date.now() };
    }
    return o;
  });
  saveOrders(orders);
  return orders.find(o => o.id === id);
}

export function getOrder(id) {
  return getOrders().find(o => o.id === id);
}

export function getOrdersByTable(tableNumber) {
  return getOrders().filter(o => o.tableNumber === tableNumber);
}

export function getTodayOrders() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return getOrders().filter(o => o.createdAt >= today.getTime());
}

function generateOrderNumber() {
  const orders = getOrders();
  const today = new Date();
  const prefix = `${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  const todayOrders = orders.filter(o => {
    const d = new Date(o.createdAt);
    return d.toDateString() === today.toDateString();
  });
  return `#${prefix}-${String(todayOrders.length + 1).padStart(3, '0')}`;
}

// ── Settings ──
export function getSettings() {
  return get(getKey('settings')) || {
    restaurantName: 'RestroDyn',
    tagline: 'Smart dining, elevated experience',
    currency: '₹',
    accentColor: '#FFC107',
    tableCount: 20,
  };
}

export function saveSettings(settings) {
  set(getKey('settings'), settings);
}

// ── Initialization ──
export function isInitialized() {
  return get(getKey('initialized')) === true;
}

export function markInitialized() {
  set(getKey('initialized'), true);
}

export function resetAll() {
  const prefix = _restaurantId ? `restrodyn_${_restaurantId}_` : 'restrodyn_';
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}
