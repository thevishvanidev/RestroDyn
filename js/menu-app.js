// ── RestroDyn Customer Menu App ──
// Now restaurant-aware: loads data from ?restaurant=slug&table=X

import { initTheme, createThemeToggle } from './components/theme-toggle.js';
import { showToast } from './components/toast.js';
import { seedData } from './data/seed-data.js';
import { getCategories, getMenuItems, getSettings, addOrder, getOrder, setStoreNamespace } from './data/store.js';
import { getRestaurantBySlug, getAllRestaurants } from './data/platform-store.js';
import { broadcast, EVENTS } from './data/broadcast.js';
import { formatCurrency, getTagInfo, getStatusInfo, debounce, fuzzyMatch, elapsedMinutes, formatTime } from './utils/helpers.js';

// ── Init ──
initTheme();
seedData();

// Determine restaurant from URL
const urlParams = new URLSearchParams(window.location.search);
const restaurantSlug = urlParams.get('restaurant');
const tableNumber = parseInt(urlParams.get('table')) || 1;

let currentRestaurant = null;

if (restaurantSlug) {
  currentRestaurant = getRestaurantBySlug(restaurantSlug);
}

// Fallback: if no slug, try first restaurant (demo)
if (!currentRestaurant) {
  const all = getAllRestaurants();
  if (all.length > 0) {
    currentRestaurant = all[0];
  }
}

// Set namespace for data
if (currentRestaurant) {
  setStoreNamespace(currentRestaurant.id);
}

const settings = getSettings();

// State
let cart = [];
let activeCategory = 'all';
let activeFilter = 'all';
let searchQuery = '';
let currentOrderId = null;

// DOM refs
const restaurantName = document.getElementById('restaurant-name');
const tableBadge = document.getElementById('table-badge');
const categoryScroll = document.getElementById('category-scroll');
const menuContent = document.getElementById('menu-content');
const cartBar = document.getElementById('cart-bar');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');
const cartOverlay = document.getElementById('cart-overlay');
const cartItems = document.getElementById('cart-items');
const cartSubtotal = document.getElementById('cart-subtotal');
const cartTax = document.getElementById('cart-tax');
const cartTotalFinal = document.getElementById('cart-total-final');
const dishModalOverlay = document.getElementById('dish-modal-overlay');
const dishModalImage = document.getElementById('dish-modal-image');
const dishModalBody = document.getElementById('dish-modal-body');
const trackerOverlay = document.getElementById('order-tracker-overlay');
const trackerOrderNumber = document.getElementById('tracker-order-number');
const trackerTimeline = document.getElementById('tracker-timeline');

// Set header info
restaurantName.textContent = currentRestaurant?.name || settings.restaurantName;
tableBadge.textContent = `Table ${tableNumber}`;

// Theme toggle
const themeSlot = document.getElementById('theme-toggle-slot');
if (themeSlot) themeSlot.appendChild(createThemeToggle());

// ── Render Categories ──
function renderCategories() {
  const cats = getCategories();
  const allTab = `<button class="category-tab ${activeCategory === 'all' ? 'active' : ''}" data-cat="all">
    <span class="cat-icon">🍽️</span> All
  </button>`;
  const catTabs = cats.map(c => `
    <button class="category-tab ${activeCategory === c.id ? 'active' : ''}" data-cat="${c.id}">
      <span class="cat-icon">${c.icon}</span> ${c.name}
    </button>
  `).join('');
  categoryScroll.innerHTML = allTab + catTabs;

  categoryScroll.querySelectorAll('.category-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeCategory = tab.dataset.cat;
      renderCategories();
      renderMenu();
    });
  });
}

// ── Render Menu ──
function renderMenu() {
  const categories = getCategories();
  const allItems = getMenuItems();
  const currency = settings.currency;

  let filteredItems = allItems;

  // Filter by search
  if (searchQuery) {
    filteredItems = filteredItems.filter(item =>
      fuzzyMatch(item.name, searchQuery) || fuzzyMatch(item.description, searchQuery)
    );
  }

  // Filter by dietary
  if (activeFilter !== 'all') {
    filteredItems = filteredItems.filter(item =>
      item.tags && item.tags.includes(activeFilter)
    );
  }

  // Filter by category
  if (activeCategory !== 'all') {
    filteredItems = filteredItems.filter(item => item.categoryId === activeCategory);
  }

  if (filteredItems.length === 0) {
    menuContent.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">🔍</div>
        <h3>No dishes found</h3>
        <p>Try a different search or filter</p>
      </div>`;
    return;
  }

  // Group by category if showing all
  if (activeCategory === 'all') {
    const grouped = {};
    filteredItems.forEach(item => {
      if (!grouped[item.categoryId]) grouped[item.categoryId] = [];
      grouped[item.categoryId].push(item);
    });

    menuContent.innerHTML = categories
      .filter(c => grouped[c.id])
      .map(c => `
        <div class="menu-category-section">
          <h2 class="menu-category-title">${c.icon} ${c.name}</h2>
          <div class="menu-items-grid stagger">
            ${grouped[c.id].map(item => renderItemCard(item, currency)).join('')}
          </div>
        </div>
      `).join('');
  } else {
    const cat = categories.find(c => c.id === activeCategory);
    menuContent.innerHTML = `
      <div class="menu-category-section">
        <h2 class="menu-category-title">${cat?.icon || ''} ${cat?.name || ''}</h2>
        <div class="menu-items-grid stagger">
          ${filteredItems.map(item => renderItemCard(item, currency)).join('')}
        </div>
      </div>`;
  }

  // Attach click handlers
  menuContent.querySelectorAll('.menu-item-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.menu-item-add-btn') || e.target.closest('.qty-btn')) return;
      openDishModal(card.dataset.id);
    });
  });

  menuContent.querySelectorAll('.menu-item-add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(btn.dataset.id);
    });
  });

  menuContent.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      if (action === 'inc') changeQty(id, 1);
      else changeQty(id, -1);
    });
  });
}

function renderItemCard(item, currency) {
  const cartItem = cart.find(c => c.id === item.id);
  const qty = cartItem ? cartItem.qty : 0;
  const tags = (item.tags || []).map(t => {
    const info = getTagInfo(t);
    return `<span class="menu-item-tag" style="background:${info.color}20;color:${info.color}">${info.emoji} ${info.label}</span>`;
  }).join('');

  const imgStyle = item.image ? `style="background-image:url('${item.image}');background-size:cover;background-position:center"` : '';

  return `
    <div class="menu-item-card ${item.available ? '' : 'unavailable'}" data-id="${item.id}">
      <div class="menu-item-image" ${imgStyle}></div>
      <div class="menu-item-info">
        <div class="menu-item-name">${item.name}</div>
        <div class="menu-item-desc">${item.description}</div>
        <div class="menu-item-meta">
          ${tags}
          ${item.prepTime ? `<span class="menu-item-prep">⏱️ ${item.prepTime} min</span>` : ''}
          ${item.spiceLevel > 0 ? `<span class="menu-item-prep">${'🌶️'.repeat(item.spiceLevel)}</span>` : ''}
        </div>
        <div class="menu-item-bottom">
          <span class="menu-item-price">${formatCurrency(item.price, currency)}</span>
          ${qty > 0 ? `
            <div class="menu-item-qty-controls">
              <button class="qty-btn" data-id="${item.id}" data-action="dec">−</button>
              <span class="qty-value">${qty}</span>
              <button class="qty-btn" data-id="${item.id}" data-action="inc">+</button>
            </div>
          ` : `
            <button class="menu-item-add-btn" data-id="${item.id}" aria-label="Add to cart">+</button>
          `}
        </div>
      </div>
    </div>`;
}

// ── Cart Logic ──
function addToCart(itemId, addons = [], notes = '') {
  const existing = cart.find(c => c.id === itemId && JSON.stringify(c.addons) === JSON.stringify(addons));
  if (existing) {
    existing.qty++;
  } else {
    const item = getMenuItems().find(i => i.id === itemId);
    if (!item) return;
    cart.push({ id: itemId, name: item.name, price: item.price, qty: 1, addons, notes });
  }
  updateCartUI();
  renderMenu();
  showToast({ title: 'Added to cart', type: 'success', duration: 1500 });
}

function changeQty(itemId, delta) {
  const item = cart.find(c => c.id === itemId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(c => c.id !== itemId);
  }
  updateCartUI();
  renderMenu();
}

function getCartTotal() {
  return cart.reduce((sum, item) => {
    const addonTotal = (item.addons || []).reduce((a, addon) => a + addon.price, 0);
    return sum + (item.price + addonTotal) * item.qty;
  }, 0);
}

function updateCartUI() {
  const total = getCartTotal();
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const currency = settings.currency;

  if (count > 0) {
    cartBar.style.display = 'flex';
    cartCount.textContent = `${count} item${count > 1 ? 's' : ''}`;
    cartTotal.textContent = formatCurrency(total, currency);
  } else {
    cartBar.style.display = 'none';
  }
}

function renderCartPanel() {
  const currency = settings.currency;
  const subtotal = getCartTotal();
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;

  cartItems.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        ${item.addons?.length ? `<div class="cart-item-addons">${item.addons.map(a => a.name).join(', ')}</div>` : ''}
        <div class="cart-item-price">${formatCurrency((item.price + (item.addons || []).reduce((a, x) => a + x.price, 0)) * item.qty, currency)}</div>
      </div>
      <div class="cart-item-qty">
        <button class="qty-btn" data-id="${item.id}" data-action="dec">−</button>
        <span class="qty-value">${item.qty}</span>
        <button class="qty-btn" data-id="${item.id}" data-action="inc">+</button>
      </div>
    </div>
  `).join('');

  cartSubtotal.textContent = formatCurrency(subtotal, currency);
  cartTax.textContent = formatCurrency(tax, currency);
  cartTotalFinal.textContent = formatCurrency(total, currency);

  cartItems.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      if (action === 'inc') changeQty(id, 1);
      else changeQty(id, -1);
      renderCartPanel();
    });
  });
}

// ── Dish Modal ──
function openDishModal(itemId) {
  const item = getMenuItems().find(i => i.id === itemId);
  if (!item) return;
  const currency = settings.currency;

  if (item.image) {
    dishModalImage.style.backgroundImage = `url('${item.image}')`;
  } else {
    dishModalImage.style.background = 'var(--bg-tertiary)';
  }

  const tags = (item.tags || []).map(t => {
    const info = getTagInfo(t);
    return `<span class="badge" style="background:${info.color}20;color:${info.color}">${info.emoji} ${info.label}</span>`;
  }).join('');

  const addonsHTML = (item.addons && item.addons.length) ? `
    <div class="dish-modal-addons">
      <div class="dish-modal-section-title">Add-ons</div>
      ${item.addons.map((a, i) => `
        <div class="addon-item">
          <label>
            <input type="checkbox" name="addon" value="${i}" />
            ${a.name}
          </label>
          <span class="addon-price">${a.price > 0 ? `+${formatCurrency(a.price, currency)}` : 'Free'}</span>
        </div>
      `).join('')}
    </div>
  ` : '';

  dishModalBody.innerHTML = `
    <h3 class="dish-modal-name">${item.name}</h3>
    <p class="dish-modal-desc">${item.description}</p>
    <div class="dish-modal-meta">
      ${tags}
      ${item.prepTime ? `<span class="badge badge-neutral">⏱️ ${item.prepTime} min</span>` : ''}
      ${item.spiceLevel > 0 ? `<span class="badge badge-warning">${'🌶️'.repeat(item.spiceLevel)} ${['', 'Medium', 'Spicy', 'Hot'][item.spiceLevel]}</span>` : ''}
    </div>
    ${addonsHTML}
    <div class="dish-modal-notes">
      <div class="dish-modal-section-title">Special Instructions</div>
      <textarea class="input" id="dish-notes" placeholder="e.g. No onions, extra sauce..." rows="2"></textarea>
    </div>
    <div class="dish-modal-footer">
      <span class="dish-modal-price">${formatCurrency(item.price, currency)}</span>
      <button class="btn btn-primary btn-lg dish-modal-add-btn" id="modal-add-btn">Add to Cart</button>
    </div>
  `;

  dishModalOverlay.classList.add('active');

  document.getElementById('modal-add-btn').addEventListener('click', () => {
    const selectedAddons = [];
    dishModalBody.querySelectorAll('input[name="addon"]:checked').forEach(cb => {
      const idx = parseInt(cb.value);
      selectedAddons.push(item.addons[idx]);
    });
    const notes = document.getElementById('dish-notes')?.value || '';
    addToCart(item.id, selectedAddons, notes);
    dishModalOverlay.classList.remove('active');
  });
}

// Close dish modal
document.getElementById('dish-modal-close').addEventListener('click', () => {
  dishModalOverlay.classList.remove('active');
});
dishModalOverlay.addEventListener('click', (e) => {
  if (e.target === dishModalOverlay) dishModalOverlay.classList.remove('active');
});

// ── Cart Panel Events ──
document.getElementById('view-cart-btn').addEventListener('click', () => {
  renderCartPanel();
  cartOverlay.classList.add('active');
});

document.getElementById('close-cart-btn').addEventListener('click', () => {
  cartOverlay.classList.remove('active');
});

cartOverlay.addEventListener('click', (e) => {
  if (e.target === cartOverlay) cartOverlay.classList.remove('active');
});

// ── Place Order ──
document.getElementById('place-order-btn').addEventListener('click', () => {
  if (cart.length === 0) return;

  const specialInstructions = document.getElementById('special-instructions')?.value || '';
  const subtotal = getCartTotal();
  const tax = Math.round(subtotal * 0.05);

  const order = addOrder({
    tableNumber,
    restaurantId: currentRestaurant?.id || null,
    items: cart.map(c => ({ ...c })),
    subtotal,
    tax,
    total: subtotal + tax,
    specialInstructions,
  });

  // Broadcast to kitchen
  broadcast.send(EVENTS.NEW_ORDER, order);

  currentOrderId = order.id;
  cart = [];
  updateCartUI();
  cartOverlay.classList.remove('active');

  showOrderTracker(order);
  showToast({ title: 'Order Placed!', message: `Order ${order.orderNumber} sent to kitchen`, type: 'order', duration: 5000 });
});

// ── Order Tracker ──
function showOrderTracker(order) {
  trackerOverlay.style.display = 'flex';
  trackerOrderNumber.textContent = order.orderNumber;
  updateTrackerTimeline(order.status);

  const currency = settings.currency;
  document.getElementById('tracker-details').innerHTML = `
    <p>Table ${order.tableNumber} • ${order.items.length} item(s) • <strong>${formatCurrency(order.total, currency)}</strong></p>
    <p style="margin-top:4px;font-size:0.75rem">Placed at ${formatTime(order.createdAt)}</p>
  `;
}

function updateTrackerTimeline(currentStatus) {
  const steps = [
    { key: 'new', label: 'Order Received', desc: 'Your order has been placed', icon: '📋' },
    { key: 'accepted', label: 'Accepted', desc: 'Kitchen has accepted your order', icon: '✅' },
    { key: 'preparing', label: 'Preparing', desc: 'Your food is being prepared', icon: '👨‍🍳' },
    { key: 'ready', label: 'Ready', desc: 'Your food is ready to serve', icon: '🔔' },
    { key: 'served', label: 'Served', desc: 'Enjoy your meal!', icon: '✨' },
  ];

  const statusOrder = ['new', 'accepted', 'preparing', 'ready', 'served'];
  const currentIdx = statusOrder.indexOf(currentStatus);

  trackerTimeline.innerHTML = steps.map((step, i) => {
    let cls = 'pending';
    if (i < currentIdx) cls = 'completed';
    else if (i === currentIdx) cls = 'active';
    return `
      <div class="tracker-step ${cls}">
        <div class="tracker-step-dot">${i <= currentIdx ? step.icon : ''}</div>
        <div class="tracker-step-content">
          <h4>${step.label}</h4>
          <p>${step.desc}</p>
        </div>
      </div>`;
  }).join('');
}

// Listen for status updates
broadcast.on(EVENTS.ORDER_STATUS_CHANGE, (payload) => {
  if (payload.id === currentOrderId) {
    updateTrackerTimeline(payload.status);
    const info = getStatusInfo(payload.status);
    showToast({ title: `Order ${info.label}`, message: info.icon, type: 'info' });
  }
});

// Close tracker
document.getElementById('tracker-new-order').addEventListener('click', () => {
  trackerOverlay.style.display = 'none';
  currentOrderId = null;
  renderMenu();
});

// ── Search ──
const searchInput = document.getElementById('menu-search');
searchInput.addEventListener('input', debounce(() => {
  searchQuery = searchInput.value.trim();
  renderMenu();
}, 200));

// ── Dietary Filters ──
document.querySelectorAll('.filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeFilter = chip.dataset.filter;
    renderMenu();
  });
});

// ── Call Waiter ──
document.getElementById('call-waiter-btn').addEventListener('click', () => {
  const btn = document.getElementById('call-waiter-btn');
  btn.classList.add('calling');
  broadcast.send(EVENTS.CALL_WAITER, { tableNumber, time: Date.now() });
  showToast({ title: 'Waiter Called', message: `A staff member will come to Table ${tableNumber}`, type: 'info' });
  setTimeout(() => btn.classList.remove('calling'), 3000);
});

// ── Initial Render ──
renderCategories();
renderMenu();
