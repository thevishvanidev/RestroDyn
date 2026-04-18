// ── RestroDyn Admin Dashboard App ──
// Now auth-gated and namespaced per restaurant
// Firebase-synced for cross-device persistence

import { initTheme, createThemeToggle } from './components/theme-toggle.js';
import { showToast } from './components/toast.js';
import { seedData } from './data/seed-data.js';
import {
  getCategories, addCategory, getMenuItems, getSettings, saveSettings,
  addMenuItem, updateMenuItem, deleteMenuItem,
  getOrders, getTodayOrders, updateOrderStatus, resetAll,
  setStoreNamespace, getPaymentSettings, savePaymentSettings
} from './data/store.js';
import { getRestaurant, getPlatformConfig, submitPayment, getPaymentsByRestaurant } from './data/platform-store.js';
import { getSession, requireAuth, getRestaurantId, getRestaurantSlug, getSubscriptionStatus, logout } from './data/auth.js';
import { syncRestaurantData, syncPlatformData, subscribeToRestaurantData } from './data/firebase-store.js';
import { seedRestaurantDefaults } from './data/seed-data.js';
import { broadcast, EVENTS } from './data/broadcast.js';
import { formatCurrency, formatTime, getStatusInfo, timeAgo, formatDate, generateId } from './utils/helpers.js';

// Init
initTheme();

// ── Auth gate ──
if (!requireAuth('/register.html')) {
  // Will redirect
  throw new Error('Not authenticated');
}

const session = getSession();
const restaurantId = getRestaurantId();
setStoreNamespace(restaurantId);

let currentSection = 'dashboard';
let adminCategoryFilter = 'all';
let orderStatusFilter = 'all';
let editingItemId = null;
let restaurant = null;

// Async init: sync Firebase data then seed
(async () => {
  await syncPlatformData();
  
  // 1. First sync existing data from cloud
  await syncRestaurantData(restaurantId);
  
  // 2. Load restaurant info and REPAIR ID if needed
  restaurant = getRestaurant(restaurantId);
  
  // ── ID REPAIR SYSTEM ──
  // If we found a restaurant in the master list with THIS email but a DIFFERENT ID,
  // it means we are in a 'Split-Brain' state. We MUST adopt the master ID.
  const allRestos = getAllRestaurants();
  const masterResto = allRestos.find(r => r.email === session.email);
  
  if (masterResto && masterResto.id !== restaurantId) {
    console.log('🛠️ RestroDyn: Split-brain detected. Repairing ID...', { session: restaurantId, master: masterResto.id });
    const updatedSession = { ...session, restaurantId: masterResto.id, slug: masterResto.slug };
    localStorage.setItem('restrodyn_session', JSON.stringify(updatedSession));
    window.location.reload(); // Hard reload to pick up new namespace
    return;
  }
  // ──────────────────────

  // 3. Update UI branding
  const sidebarBrand = document.querySelector('.sidebar-brand a');
  if (sidebarBrand && restaurant) {
    sidebarBrand.innerHTML = `
      <span class="logo-icon">🍽️</span>
      <span class="logo-text">${restaurant.name}</span>
    `;
  }

  // 4. Safe seed: will only seed if cloud is empty
  if (restaurant) {
    await seedRestaurantDefaults(restaurantId, restaurant.name);
  }

  // 5. Start real-time listener for updates from other devices
  subscribeToRestaurantData(restaurantId, (key) => {
    console.log(`📡 Real-time update: ${key}`);
    // Refresh the currently active segment
    if (currentSection === 'dashboard') renderDashboard();
    if (currentSection === 'menu') renderMenuSection();
    if (currentSection === 'orders') renderOrders();
    if (currentSection === 'settings') renderSettings();
    
    showToast({ title: 'Data Synced', message: `Cloud update received for ${key}`, type: 'info', duration: 2000 });

    if (key === 'waiterAlerts') {
      const lastAlert = value[value.length - 1];
      if (lastAlert && lastAlert.status === 'new' && Date.now() - lastAlert.time < 30000) {
        const waiterAlert = document.getElementById('waiter-alert');
        const waiterAlertText = document.getElementById('waiter-alert-text');
        if (waiterAlert && waiterAlertText) {
          waiterAlertText.textContent = `🛎️ Table ${lastAlert.tableNumber} needs assistance!`;
          waiterAlert.dataset.alertId = lastAlert.id;
          waiterAlert.classList.add('active');
          setTimeout(() => waiterAlert.classList.remove('active'), 15000);
        }
      } else if (lastAlert && lastAlert.status === 'dismissed') {
        document.getElementById('waiter-alert')?.classList.remove('active');
      }
    }
  });

  renderDashboard();
})();

// Dismiss waiter alert
document.getElementById('waiter-dismiss')?.addEventListener('click', () => {
  const waiterAlert = document.getElementById('waiter-alert');
  const alertId = waiterAlert.dataset.alertId;
  if (alertId) {
    dismissWaiterAlert(alertId);
  }
  waiterAlert.classList.remove('active');
});

// Theme toggles
const themeSlot = document.getElementById('admin-theme-slot');
const mobileThemeSlot = document.getElementById('mobile-theme-slot');
if (themeSlot) themeSlot.appendChild(createThemeToggle());
if (mobileThemeSlot) mobileThemeSlot.appendChild(createThemeToggle());


// ── Sidebar Navigation ──
document.querySelectorAll('.sidebar-link').forEach(link => {
  link.addEventListener('click', () => {
    switchSection(link.dataset.section);
  });
});

function switchSection(section) {
  currentSection = section;
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  document.querySelector(`[data-section="${section}"]`)?.classList.add('active');
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.getElementById(`section-${section}`)?.classList.add('active');
  
  const titles = { dashboard: 'Dashboard', menu: 'Menu', orders: 'Orders', qr: 'QR Codes', billpay: 'Bill Pay', payment: 'Payment Settings', settings: 'Settings' };
  document.getElementById('mobile-title').textContent = titles[section] || section;

  // Close mobile sidebar
  document.getElementById('admin-sidebar').classList.remove('open');
  document.querySelector('.sidebar-overlay')?.classList.remove('active');

  // Load section data
  if (section === 'dashboard') renderDashboard();
  else if (section === 'menu') renderMenuSection();
  else if (section === 'orders') renderOrders();
  else if (section === 'billpay') renderBillPay();
  else if (section === 'payment') renderPaymentSettingsSection();
  else if (section === 'settings') loadSettings();
}

// ── Mobile Sidebar ──
const overlay = document.createElement('div');
overlay.className = 'sidebar-overlay';
document.body.appendChild(overlay);

document.getElementById('mobile-sidebar-toggle')?.addEventListener('click', () => {
  document.getElementById('admin-sidebar').classList.toggle('open');
  overlay.classList.toggle('active');
});

overlay.addEventListener('click', () => {
  document.getElementById('admin-sidebar').classList.remove('open');
  overlay.classList.remove('active');
});

// ── Logout ──
document.getElementById('admin-logout-btn')?.addEventListener('click', () => {
  logout();
});

// ══════════════════════════════════════════
//  DASHBOARD SECTION
// ══════════════════════════════════════════

function renderDashboard() {
  const todayOrders = getTodayOrders();
  const settings = getSettings();
  const currency = settings.currency;

  const totalRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const completedOrders = todayOrders.filter(o => ['ready', 'served'].includes(o.status)).length;
  const avgOrderValue = todayOrders.length ? Math.round(totalRevenue / todayOrders.length) : 0;
  const pendingOrders = todayOrders.filter(o => ['new', 'accepted', 'preparing'].includes(o.status)).length;

  const cardsHtml = `
    <div class="analytics-card">
      <div class="analytics-card-icon">💰</div>
      <div class="analytics-card-value">${formatCurrency(totalRevenue, currency)}</div>
      <div class="analytics-card-label">Today's Revenue</div>
    </div>
    <div class="analytics-card">
      <div class="analytics-card-icon">📋</div>
      <div class="analytics-card-value">${todayOrders.length}</div>
      <div class="analytics-card-label">Total Orders</div>
    </div>
    <div class="analytics-card">
      <div class="analytics-card-icon">📊</div>
      <div class="analytics-card-value">${formatCurrency(avgOrderValue, currency)}</div>
      <div class="analytics-card-label">Avg. Order Value</div>
    </div>
    <div class="analytics-card">
      <div class="analytics-card-icon">⏳</div>
      <div class="analytics-card-value">${pendingOrders}</div>
      <div class="analytics-card-label">Pending Orders</div>
    </div>
  `;

  document.getElementById('analytics-cards').innerHTML = cardsHtml;

  // Render charts
  renderCharts(todayOrders);
}

function renderCharts(orders) {
  const itemCounts = {};
  orders.forEach(o => {
    (o.items || []).forEach(item => {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + item.qty;
    });
  });

  const sorted = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const labels = sorted.map(([name]) => name);
  const data = sorted.map(([, count]) => count);

  try {
    import('chart.js/auto').then(({ default: Chart }) => {
      const popularCtx = document.getElementById('popular-chart');
      if (popularCtx._chart) popularCtx._chart.destroy();
      
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const textColor = isDark ? '#A0A0C0' : '#4A4A68';
      const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

      const chart1 = new Chart(popularCtx, {
        type: 'bar',
        data: {
          labels: labels.length ? labels : ['No data'],
          datasets: [{
            label: 'Ordered',
            data: data.length ? data : [0],
            backgroundColor: [
              'rgba(255, 193, 7, 0.7)',
              'rgba(255, 107, 107, 0.7)',
              'rgba(124, 77, 255, 0.7)',
              'rgba(0, 188, 212, 0.7)',
              'rgba(76, 175, 80, 0.7)',
              'rgba(255, 152, 0, 0.7)',
            ],
            borderRadius: 8,
            borderSkipped: false,
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: textColor }, grid: { display: false } },
            y: { ticks: { color: textColor, stepSize: 1 }, grid: { color: gridColor } },
          },
        },
      });
      popularCtx._chart = chart1;

      const ordersCtx = document.getElementById('orders-chart');
      if (ordersCtx._chart) ordersCtx._chart.destroy();

      const hourly = {};
      orders.forEach(o => {
        const hour = new Date(o.createdAt).getHours();
        hourly[hour] = (hourly[hour] || 0) + 1;
      });

      const hours = Array.from({ length: 24 }, (_, i) => i);
      const hourLabels = hours.map(h => `${h}:00`);
      const hourData = hours.map(h => hourly[h] || 0);

      const chart2 = new Chart(ordersCtx, {
        type: 'line',
        data: {
          labels: hourLabels,
          datasets: [{
            label: 'Orders',
            data: hourData,
            borderColor: 'rgba(255, 193, 7, 0.8)',
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: '#FFC107',
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: textColor, maxTicksLimit: 12 }, grid: { display: false } },
            y: { ticks: { color: textColor, stepSize: 1 }, grid: { color: gridColor } },
          },
        },
      });
      ordersCtx._chart = chart2;
    });
  } catch (e) {
    console.error('Chart.js error:', e);
  }
}

// ══════════════════════════════════════════
//  MENU MANAGEMENT SECTION
// ══════════════════════════════════════════

function renderMenuSection() {
  const categories = getCategories();
  const items = getMenuItems();
  const settings = getSettings();

  const tabsHtml = `
    <button class="admin-category-tab ${adminCategoryFilter === 'all' ? 'active' : ''}" data-cat="all">All</button>
    ${categories.map(c => `
      <button class="admin-category-tab ${adminCategoryFilter === c.id ? 'active' : ''}" data-cat="${c.id}">${c.icon} ${c.name}</button>
    `).join('')}
  `;
  document.getElementById('admin-category-tabs').innerHTML = tabsHtml;

  document.querySelectorAll('.admin-category-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      adminCategoryFilter = tab.dataset.cat;
      renderMenuSection();
    });
  });

  const filtered = adminCategoryFilter === 'all' ? items : items.filter(i => i.categoryId === adminCategoryFilter);

  const gridHtml = filtered.map(item => {
    const cat = categories.find(c => c.id === item.categoryId);
    return `
      <div class="admin-menu-card">
        <div class="admin-menu-card-img" ${item.image ? `style="background-image:url('${item.image}')"` : ''}></div>
        <div class="admin-menu-card-info">
          <div class="admin-menu-card-name">
            <span>${item.name}</span>
            <span class="badge ${item.available ? 'badge-success' : 'badge-error'}">${item.available ? 'Active' : 'Hidden'}</span>
          </div>
          <div class="admin-menu-card-desc">${item.description}</div>
          <div class="admin-menu-card-footer">
            <span class="admin-menu-card-price">${formatCurrency(item.price, settings.currency)}</span>
            <div class="admin-menu-card-actions">
              <button class="btn btn-sm btn-secondary edit-item-btn" data-id="${item.id}">✏️</button>
              <button class="btn btn-sm btn-danger delete-item-btn" data-id="${item.id}">🗑️</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('admin-menu-grid').innerHTML = gridHtml || '<div class="empty-state"><h3>No items in this category</h3></div>';

  document.querySelectorAll('.edit-item-btn').forEach(btn => {
    btn.addEventListener('click', () => openItemModal(btn.dataset.id));
  });

  document.querySelectorAll('.delete-item-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Delete this item?')) {
        deleteMenuItem(btn.dataset.id);
        broadcast.send(EVENTS.MENU_UPDATE, {});
        renderMenuSection();
        showToast({ title: 'Item deleted', type: 'success' });
      }
    });
  });
}

// Add Item button
document.getElementById('add-item-btn').addEventListener('click', () => openItemModal(null));

// ── Item Modal ──
function openItemModal(itemId) {
  editingItemId = itemId;
  const item = itemId ? getMenuItems().find(i => i.id === itemId) : null;
  const categories = getCategories();
  const isEdit = !!item;

  document.getElementById('item-modal-title').textContent = isEdit ? 'Edit Menu Item' : 'Add Menu Item';

  const formHtml = `
    <form class="item-form" id="item-form">
      <div class="input-group">
        <label>Name</label>
        <input type="text" class="input" name="name" value="${item?.name || ''}" required />
      </div>
      <div class="input-group">
        <label>Description</label>
        <textarea class="input" name="description" rows="2">${item?.description || ''}</textarea>
      </div>
      <div class="item-form-row">
        <div class="input-group">
          <label>Price</label>
          <input type="number" class="input" name="price" value="${item?.price || ''}" required min="0" />
        </div>
        <div class="input-group">
          <label>Category</label>
          <div style="display: flex; gap: var(--space-sm);">
            <select class="input" style="flex:1" name="categoryId" id="modal-category-select" required>
              ${categories.length === 0 ? '<option value="" disabled selected>No categories available</option>' : ''}
              ${categories.map(c => `<option value="${c.id}" ${item?.categoryId === c.id ? 'selected' : ''}>${c.icon} ${c.name}</option>`).join('')}
            </select>
            <button type="button" class="btn btn-secondary" id="modal-add-cat-btn" title="Add New Category" style="padding: 0 var(--space-md)">+</button>
          </div>
        </div>
      </div>
      <div class="item-form-row">
        <div class="input-group">
          <label>Prep Time (min)</label>
          <input type="number" class="input" name="prepTime" value="${item?.prepTime || 10}" min="1" />
        </div>
        <div class="input-group">
          <label>Spice Level (0-3)</label>
          <input type="number" class="input" name="spiceLevel" value="${item?.spiceLevel || 0}" min="0" max="3" />
        </div>
      </div>
      <div class="input-group">
        <label>Upload Item Image</label>
        <div class="image-upload-zone" id="image-upload-zone">
          <div class="image-upload-placeholder" id="image-upload-placeholder" ${item?.image ? 'style="display:none"' : ''}>
            <div class="image-upload-icon">📸</div>
            <p class="image-upload-text">Drag & drop your image here</p>
            <p class="image-upload-hint">or click to browse • JPG, PNG, WebP • Max 2MB</p>
            <button type="button" class="btn btn-sm btn-secondary" id="image-browse-btn">Browse Files</button>
          </div>
          <div class="image-upload-preview ${item?.image ? 'active' : ''}" id="image-upload-preview">
            <img src="${item?.image || ''}" alt="Preview" id="image-preview-img" />
            <button type="button" class="image-upload-remove" id="image-remove-btn" title="Remove image">✕</button>
          </div>
          <input type="file" id="image-file-input" accept="image/jpeg,image/png,image/webp" hidden />
        </div>
      </div>
      <div class="input-group">
        <label>Dietary Tags</label>
        <div class="item-form-tags">
          <label><input type="checkbox" name="tags" value="vegetarian" ${item?.tags?.includes('vegetarian') ? 'checked' : ''} /> 🟢 Vegetarian</label>
          <label><input type="checkbox" name="tags" value="vegan" ${item?.tags?.includes('vegan') ? 'checked' : ''} /> 🌱 Vegan</label>
          <label><input type="checkbox" name="tags" value="gluten-free" ${item?.tags?.includes('gluten-free') ? 'checked' : ''} /> 🌾 Gluten-Free</label>
        </div>
      </div>
      <div class="input-group" style="flex-direction:row;align-items:center;gap:var(--space-md)">
        <label style="margin:0">Available</label>
        <label class="toggle">
          <input type="checkbox" name="available" ${item?.available !== false ? 'checked' : ''} />
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div style="display:flex;gap:var(--space-md);justify-content:flex-end;padding-top:var(--space-md)">
        <button type="button" class="btn btn-secondary" id="cancel-item-btn">Cancel</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Update Item' : 'Add Item'}</button>
      </div>
    </form>
  `;

  document.getElementById('item-modal-body').innerHTML = formHtml;
  document.getElementById('item-modal-overlay').classList.add('active');

  // Image upload state
  let currentImageData = item?.image || '';

  const uploadZone = document.getElementById('image-upload-zone');
  const placeholder = document.getElementById('image-upload-placeholder');
  const previewContainer = document.getElementById('image-upload-preview');
  const previewImg = document.getElementById('image-preview-img');
  const fileInput = document.getElementById('image-file-input');
  const browseBtn = document.getElementById('image-browse-btn');
  const removeBtn = document.getElementById('image-remove-btn');

  function handleImageFile(file) {
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      showToast({ title: 'Invalid file type', message: 'Please upload JPG, PNG, or WebP', type: 'error' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast({ title: 'File too large', message: 'Image must be under 2MB', type: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      currentImageData = e.target.result;
      previewImg.src = currentImageData;
      placeholder.style.display = 'none';
      previewContainer.classList.add('active');
    };
    reader.readAsDataURL(file);
  }

  // Browse button
  browseBtn.addEventListener('click', (e) => {
    e.preventDefault();
    fileInput.click();
  });

  // Clicking the zone also triggers browse
  uploadZone.addEventListener('click', (e) => {
    if (e.target === uploadZone || e.target.closest('#image-upload-placeholder')) {
      if (e.target.id !== 'image-browse-btn' && !e.target.closest('#image-browse-btn')) {
        fileInput.click();
      }
    }
  });

  // File input change
  fileInput.addEventListener('change', () => {
    handleImageFile(fileInput.files[0]);
  });

  // Drag & drop
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    handleImageFile(file);
  });

  // Remove image
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentImageData = '';
    previewImg.src = '';
    previewContainer.classList.remove('active');
    placeholder.style.display = '';
    fileInput.value = '';
  });

  // Add new category directly from modal
  document.getElementById('modal-add-cat-btn').addEventListener('click', () => {
    const name = prompt('Enter new category name:');
    if (name && name.trim()) {
      const categories = getCategories();
      const newCat = { id: generateId(), name: name.trim(), icon: '🍽️', order: categories.length };
      addCategory(newCat);
      showToast({ title: 'Category added', type: 'success' });
      // Re-render modal to reflect new category option
      openItemModal(editingItemId);
    }
  });

  document.getElementById('cancel-item-btn').addEventListener('click', closeItemModal);

  document.getElementById('item-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      name: form.name.value,
      description: form.description.value,
      price: parseInt(form.price.value),
      categoryId: form.categoryId.value,
      prepTime: parseInt(form.prepTime.value),
      spiceLevel: parseInt(form.spiceLevel.value),
      image: currentImageData,
      tags: Array.from(form.querySelectorAll('input[name="tags"]:checked')).map(cb => cb.value),
      available: form.available.checked,
      addons: item?.addons || [],
    };

    if (isEdit) {
      updateMenuItem(editingItemId, data);
      showToast({ title: 'Item updated', type: 'success' });
    } else {
      addMenuItem(data);
      showToast({ title: 'Item added', type: 'success' });
    }

    broadcast.send(EVENTS.MENU_UPDATE, {});
    closeItemModal();
    renderMenuSection();
  });
}

function closeItemModal() {
  document.getElementById('item-modal-overlay').classList.remove('active');
  editingItemId = null;
}

document.getElementById('item-modal-close').addEventListener('click', closeItemModal);
document.getElementById('item-modal-overlay').addEventListener('click', (e) => {
  if (e.target.id === 'item-modal-overlay') closeItemModal();
});

// ══════════════════════════════════════════
//  ORDERS SECTION
// ══════════════════════════════════════════

function renderOrders() {
  const orders = getTodayOrders();
  const settings = getSettings();
  const currency = settings.currency;

  const filtered = orderStatusFilter === 'all' ? orders : orders.filter(o => o.status === orderStatusFilter);

  const listHtml = filtered.map(order => {
    const status = getStatusInfo(order.status);
    const itemNames = order.items.map(i => `${i.name} ×${i.qty}`).join(', ');
    return `
      <div class="admin-order-row">
        <span class="admin-order-id">${order.orderNumber}</span>
        <span class="admin-order-table">🍽️ T${order.tableNumber}</span>
        <span class="admin-order-items">${itemNames}</span>
        <span class="badge badge-${status.color}">${status.icon} ${status.label}</span>
        <span class="admin-order-total">${formatCurrency(order.total, currency)}</span>
        <span class="admin-order-time">${timeAgo(order.createdAt)}</span>
      </div>
    `;
  }).join('');

  document.getElementById('admin-orders-list').innerHTML = listHtml || '<div class="empty-state"><h3>No orders found</h3></div>';
}

// Order filters
document.querySelectorAll('#order-filters .filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('#order-filters .filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    orderStatusFilter = chip.dataset.status;
    renderOrders();
  });
});

// ══════════════════════════════════════════
//  QR CODE GENERATOR
// ══════════════════════════════════════════

document.getElementById('generate-qr-btn').addEventListener('click', async () => {
  const count = parseInt(document.getElementById('qr-table-count').value) || 10;
  const grid = document.getElementById('qr-grid');
  grid.innerHTML = '<div class="spinner" style="margin:2rem auto"></div>';

  try {
    const QRCode = (await import('qrcode')).default;
    const baseUrl = window.location.origin;
    
    // Ensure we have the latest restaurant data
    const activeRestaurantId = getRestaurantId();
    const activeResto = getRestaurant(activeRestaurantId);
    const settings = getSettings();
    
    // Pinpoint the exact restaurant slug for the QR URL
    const slug = getRestaurantSlug() || activeResto?.slug || restaurant?.slug || 'demo';
    const restaurantName = activeResto?.name || settings.restaurantName || restaurant?.name || 'RestroDyn';

    let html = '';
    for (let i = 1; i <= count; i++) {
      const url = `${baseUrl}/menu.html?restaurant=${slug}&table=${i}`;
      
      // Generate QR on hidden canvas
      const qrCanvas = document.createElement('canvas');
      await QRCode.toCanvas(qrCanvas, url, {
        width: 200,
        margin: 2,
        color: { dark: '#1A1A2E', light: '#FFFFFF' },
      });

      // Create branded template canvas
      const tCanvas = document.createElement('canvas');
      tCanvas.width = 400;
      tCanvas.height = 580;
      const ctx = tCanvas.getContext('2d');

      // Background gradient (3D feel)
      const bgGrad = ctx.createLinearGradient(0, 0, 400, 580);
      bgGrad.addColorStop(0, '#0D0D2B');
      bgGrad.addColorStop(0.3, '#141432');
      bgGrad.addColorStop(0.7, '#1A1A3E');
      bgGrad.addColorStop(1, '#0D0D2B');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.roundRect(0, 0, 400, 580, 24);
      ctx.fill();

      // Decorative top glow
      const glowGrad = ctx.createRadialGradient(200, 0, 0, 200, 0, 250);
      glowGrad.addColorStop(0, 'rgba(255, 193, 7, 0.20)');
      glowGrad.addColorStop(1, 'rgba(255, 193, 7, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, 400, 250);

      // Decorative bottom glow
      const btmGlow = ctx.createRadialGradient(200, 580, 0, 200, 580, 200);
      btmGlow.addColorStop(0, 'rgba(255, 107, 107, 0.10)');
      btmGlow.addColorStop(1, 'rgba(255, 107, 107, 0)');
      ctx.fillStyle = btmGlow;
      ctx.fillRect(0, 380, 400, 200);

      // Side accent lines (3D depth)
      ctx.strokeStyle = 'rgba(255, 193, 7, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(8, 8, 384, 564, 20);
      ctx.stroke();

      // Restaurant name
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(restaurantName, 200, 48);

      // Divider line
      const divGrad = ctx.createLinearGradient(60, 0, 340, 0);
      divGrad.addColorStop(0, 'rgba(255, 193, 7, 0)');
      divGrad.addColorStop(0.5, 'rgba(255, 193, 7, 0.5)');
      divGrad.addColorStop(1, 'rgba(255, 193, 7, 0)');
      ctx.strokeStyle = divGrad;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(60, 62);
      ctx.lineTo(340, 62);
      ctx.stroke();

      // "Scan to Order" text
      ctx.fillStyle = '#FFC107';
      ctx.font = '600 14px "Inter", sans-serif';
      ctx.fillText('✨ SCAN TO ORDER ✨', 200, 88);

      // White QR background with rounded corners
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(85, 104, 230, 230, 16);
      ctx.fill();

      // Shadow behind QR
      ctx.shadowColor = 'rgba(255, 193, 7, 0.25)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(85, 104, 230, 230, 16);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // Draw QR code centered
      ctx.drawImage(qrCanvas, 100, 119, 200, 200);

      // Table number badge
      ctx.fillStyle = '#FFC107';
      ctx.beginPath();
      ctx.roundRect(130, 350, 140, 42, 21);
      ctx.fill();
      ctx.fillStyle = '#1A1A2E';
      ctx.font = 'bold 18px "Outfit", sans-serif';
      ctx.fillText(`Table ${i}`, 200, 377);

      // Decorative dots
      ctx.fillStyle = 'rgba(255, 193, 7, 0.3)';
      for (let d = 0; d < 5; d++) {
        ctx.beginPath();
        ctx.arc(140 + d * 30, 412, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bottom divider
      ctx.strokeStyle = divGrad;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(60, 430);
      ctx.lineTo(340, 430);
      ctx.stroke();

      // RestroDyn branding
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px "Outfit", sans-serif';
      ctx.fillText('🍽️ RestroDyn', 200, 462);

      // By VIAN GROUP
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '500 11px "Inter", sans-serif';
      ctx.fillText('By VIAN GROUP', 200, 484);

      // Website
      ctx.fillStyle = '#FFC107';
      ctx.font = '600 13px "Inter", sans-serif';
      ctx.fillText('www.restrodyn.in', 200, 510);

      // Powered by text
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.font = '400 9px "Inter", sans-serif';
      ctx.fillText('Powered by RestroDyn Platform', 200, 555);

      const templateDataUrl = tCanvas.toDataURL('image/png');

      html += `
        <div class="qr-card qr-template-card">
          <img src="${templateDataUrl}" alt="QR Template Table ${i}" class="qr-template-img" />
          <a href="${templateDataUrl}" download="${slug}-table-${i}-qr.png" class="btn btn-sm btn-primary" style="width:100%">⬇️ Download Template</a>
        </div>
      `;
    }
    grid.innerHTML = html;
    showToast({ title: `${count} QR templates generated`, type: 'success' });
  } catch (e) {
    grid.innerHTML = '<div class="empty-state"><h3>Failed to generate QR codes</h3></div>';
    console.error(e);
  }
});

// ══════════════════════════════════════════
//  BILL PAY SECTION
// ══════════════════════════════════════════

let selectedPlanId = null;
let selectedPaymentMethod = 'qr';
let billPayProofData = '';

function renderBillPay() {
  const subStatus = getSubscriptionStatus();
  const config = getPlatformConfig();
  const plans = config.subscriptionPlans;
  const payments = getPaymentsByRestaurant(restaurantId);

  // ── Subscription Status Card ──
  const statusCard = document.getElementById('bp-status-card');
  let statusIcon, statusLabel, statusClass, expiryText;

  if (subStatus.status === 'trial') {
    statusIcon = '🧪';
    statusLabel = 'Free Trial';
    statusClass = 'bp-status-trial';
    expiryText = subStatus.daysRemaining !== null ? `${subStatus.daysRemaining} days remaining` : '';
  } else if (subStatus.status === 'active') {
    statusIcon = '✅';
    statusLabel = `Active — ${subStatus.plan}`;
    statusClass = 'bp-status-active';
    expiryText = subStatus.expiryDate ? `Expires ${formatDate(subStatus.expiryDate)}` : '';
  } else if (subStatus.status === 'expired') {
    statusIcon = '⏰';
    statusLabel = 'Expired';
    statusClass = 'bp-status-expired';
    expiryText = 'Please renew your subscription';
  } else {
    statusIcon = '❓';
    statusLabel = 'No Subscription';
    statusClass = 'bp-status-none';
    expiryText = 'Choose a plan to get started';
  }

  // Check for pending payments
  const pendingPayment = payments.find(p => p.status === 'pending');

  statusCard.innerHTML = `
    <div class="bp-status-header ${statusClass}">
      <div class="bp-status-icon">${statusIcon}</div>
      <div class="bp-status-info">
        <div class="bp-status-label">${statusLabel}</div>
        <div class="bp-status-expiry">${expiryText}</div>
      </div>
      <div class="bp-status-badge">
        <span class="badge badge-${subStatus.valid ? 'success' : 'warning'}">${subStatus.valid ? 'Active' : 'Renew'}</span>
      </div>
    </div>
    ${pendingPayment ? `
      <div class="bp-pending-banner">
        <span class="bp-pending-icon">⏳</span>
        <span>Payment of ₹${pendingPayment.amount} submitted for <strong>${pendingPayment.planName}</strong> — <em>Pending verification</em></span>
      </div>
    ` : ''}
  `;

  // ── Plans Grid ──
  document.getElementById('bp-plans-grid').innerHTML = plans.map((plan, i) => `
    <div class="bp-plan-card ${selectedPlanId === plan.id ? 'selected' : ''} ${i === 1 ? 'popular' : ''}" data-plan-id="${plan.id}">
      ${i === 1 ? '<div class="bp-plan-popular-tag">⭐ Best Value</div>' : ''}
      <div class="bp-plan-name">${plan.name}</div>
      <div class="bp-plan-price">₹${plan.price}<span>/${plan.duration} days</span></div>
      <ul class="bp-plan-features">
        ${plan.features.map(f => `<li>${f}</li>`).join('')}
      </ul>
      <button class="btn ${selectedPlanId === plan.id ? 'btn-primary' : 'btn-secondary'} bp-plan-select-btn" data-plan-id="${plan.id}">
        ${selectedPlanId === plan.id ? '✓ Selected' : 'Select Plan'}
      </button>
    </div>
  `).join('');

  // Plan selection
  document.querySelectorAll('.bp-plan-select-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedPlanId = btn.dataset.planId;
      renderBillPay();
      document.getElementById('bp-pay-section').style.display = 'block';
      document.getElementById('bp-pay-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // ── Selected Plan Banner ──
  if (selectedPlanId) {
    const selectedPlan = plans.find(p => p.id === selectedPlanId);
    document.getElementById('bp-pay-section').style.display = 'block';
    document.getElementById('bp-selected-plan').innerHTML = `
      <div class="bp-sp-info">
        <span class="bp-sp-name">${selectedPlan.name} Plan</span>
        <span class="bp-sp-price">₹${selectedPlan.price}</span>
        <span class="bp-sp-duration">${selectedPlan.duration} days</span>
      </div>
    `;

    // Render payment methods
    renderPaymentMethods(config);
  }

  // ── Payment History ──
  const sortedPayments = [...payments].sort((a, b) => b.submittedAt - a.submittedAt);
  document.getElementById('bp-history-list').innerHTML = sortedPayments.length
    ? sortedPayments.map(p => {
        const statusBadge = p.status === 'approved'
          ? '<span class="badge badge-success">✅ Approved</span>'
          : p.status === 'rejected'
          ? '<span class="badge badge-error">❌ Rejected</span>'
          : '<span class="badge badge-warning">⏳ Pending</span>';
        return `
          <div class="bp-history-item">
            <div class="bp-history-main">
              <div class="bp-history-plan">${p.planName}</div>
              <div class="bp-history-method">${p.paymentMethod}</div>
              <div class="bp-history-date">${formatDate(p.submittedAt)}</div>
            </div>
            <div class="bp-history-right">
              ${statusBadge}
              <div class="bp-history-amount">₹${p.amount}</div>
            </div>
            ${p.status === 'rejected' && p.reviewNote ? `<div class="bp-history-note">Note: ${p.reviewNote}</div>` : ''}
          </div>
        `;
      }).join('')
    : '<div class="empty-state" style="padding:var(--space-xl) 0"><p style="color:var(--text-tertiary)">No payments yet</p></div>';
}

function renderPaymentMethods(config) {
  const pm = config.paymentMethods || {};

  // QR
  document.getElementById('bp-qr-display').innerHTML = pm.qrImage
    ? `
      <div class="bp-qr-wrapper">
        <p class="bp-method-label">Scan this QR code to pay</p>
        <img src="${pm.qrImage}" alt="Payment QR" class="bp-qr-img" />
        <p class="bp-method-hint">After payment, upload proof below</p>
      </div>
    `
    : '<div class="bp-method-empty"><span>📱</span><p>QR code not configured yet. Contact support.</p></div>';

  // UPI
  document.getElementById('bp-upi-display').innerHTML = pm.upiId
    ? `
      <div class="bp-upi-wrapper">
        <p class="bp-method-label">Pay via UPI</p>
        <div class="bp-upi-id-display">
          <span class="bp-upi-id-value">${pm.upiId}</span>
          <button class="btn btn-sm btn-secondary bp-copy-upi" title="Copy UPI ID">📋 Copy</button>
        </div>
        <p class="bp-method-hint">Copy this UPI ID and pay using any UPI app</p>
      </div>
    `
    : '<div class="bp-method-empty"><span>🔗</span><p>UPI ID not configured yet. Contact support.</p></div>';

  // Copy UPI handler
  document.querySelector('.bp-copy-upi')?.addEventListener('click', () => {
    navigator.clipboard.writeText(pm.upiId).then(() => {
      showToast({ title: 'UPI ID copied!', type: 'success' });
    });
  });

  // Bank Transfer
  const bank = pm.bankDetails || {};
  document.getElementById('bp-bank-display').innerHTML = (bank.accountNumber && bank.ifscCode)
    ? `
      <div class="bp-bank-wrapper">
        <p class="bp-method-label">Bank Transfer Details</p>
        <div class="bp-bank-details-grid">
          <div class="bp-bank-row">
            <span class="bp-bank-label">Account Name</span>
            <span class="bp-bank-value">${bank.accountName || '—'}</span>
          </div>
          <div class="bp-bank-row">
            <span class="bp-bank-label">Account Number</span>
            <span class="bp-bank-value">${bank.accountNumber}</span>
          </div>
          <div class="bp-bank-row">
            <span class="bp-bank-label">IFSC Code</span>
            <span class="bp-bank-value">${bank.ifscCode}</span>
          </div>
          <div class="bp-bank-row">
            <span class="bp-bank-label">Bank Name</span>
            <span class="bp-bank-value">${bank.bankName || '—'}</span>
          </div>
        </div>
        <p class="bp-method-hint">Transfer the exact amount and upload proof below</p>
      </div>
    `
    : '<div class="bp-method-empty"><span>🏦</span><p>Bank details not configured yet. Contact support.</p></div>';
}

// ── Payment Method Tabs ──
document.querySelectorAll('.bp-method-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    selectedPaymentMethod = tab.dataset.method;
    document.querySelectorAll('.bp-method-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.bp-method-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`bp-panel-${tab.dataset.method}`)?.classList.add('active');
  });
});

// ── Payment Proof Upload ──
function initProofUpload() {
  const uploadZone = document.getElementById('bp-proof-upload');
  const placeholder = document.getElementById('bp-proof-placeholder');
  const preview = document.getElementById('bp-proof-preview');
  const previewImg = document.getElementById('bp-proof-img');
  const fileInput = document.getElementById('bp-proof-file');
  const browseBtn = document.getElementById('bp-proof-browse');
  const removeBtn = document.getElementById('bp-proof-remove');

  function handleProofFile(file) {
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      showToast({ title: 'Invalid file type', message: 'Please upload JPG, PNG, or WebP', type: 'error' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast({ title: 'File too large', message: 'Max 2MB', type: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      billPayProofData = e.target.result;
      previewImg.src = billPayProofData;
      placeholder.style.display = 'none';
      preview.classList.add('active');
    };
    reader.readAsDataURL(file);
  }

  browseBtn?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); fileInput.click(); });

  uploadZone?.addEventListener('click', (e) => {
    if (e.target === uploadZone || e.target.closest('#bp-proof-placeholder')) {
      if (!e.target.closest('#bp-proof-browse')) fileInput.click();
    }
  });

  fileInput?.addEventListener('change', () => handleProofFile(fileInput.files[0]));

  uploadZone?.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('dragover'); });
  uploadZone?.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
  uploadZone?.addEventListener('drop', (e) => {
    e.preventDefault(); uploadZone.classList.remove('dragover');
    handleProofFile(e.dataTransfer.files[0]);
  });

  removeBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    billPayProofData = '';
    previewImg.src = '';
    preview.classList.remove('active');
    placeholder.style.display = '';
    fileInput.value = '';
  });
}

initProofUpload();

// ── Submit Payment ──
document.getElementById('bp-submit-payment')?.addEventListener('click', () => {
  if (!selectedPlanId) {
    showToast({ title: 'Select a plan first', type: 'error' });
    return;
  }

  const config = getPlatformConfig();
  const plan = config.subscriptionPlans.find(p => p.id === selectedPlanId);
  if (!plan) return;

  const methodLabels = { qr: 'QR Code Payment', upi: 'UPI Transfer', bank: 'Bank Transfer' };
  const txRef = document.getElementById('bp-tx-ref')?.value?.trim() || '';

  // Check if there's already a pending payment
  const existingPending = getPaymentsByRestaurant(restaurantId).find(p => p.status === 'pending');
  if (existingPending) {
    showToast({ title: 'Payment already pending', message: 'Wait for verification of your previous payment', type: 'warning' });
    return;
  }

  if (!billPayProofData && !txRef) {
    showToast({ title: 'Proof required', message: 'Upload a screenshot or enter a transaction reference', type: 'error' });
    return;
  }

  submitPayment({
    restaurantId,
    restaurantName: restaurant?.name || 'Unknown',
    planId: plan.id,
    planName: plan.name,
    amount: plan.price,
    duration: plan.duration,
    paymentMethod: methodLabels[selectedPaymentMethod] || selectedPaymentMethod,
    proofImage: billPayProofData,
    upiRef: selectedPaymentMethod === 'upi' ? txRef : '',
    bankRef: selectedPaymentMethod === 'bank' ? txRef : '',
  });

  showToast({ title: 'Payment submitted!', message: 'Your payment is under review', type: 'success' });

  // Reset state
  selectedPlanId = null;
  billPayProofData = '';
  document.getElementById('bp-tx-ref').value = '';
  document.getElementById('bp-pay-section').style.display = 'none';
  renderBillPay();
});

// ══════════════════════════════════════════
//  SETTINGS
// ══════════════════════════════════════════

function loadSettings() {
  const s = getSettings();
  document.getElementById('setting-name').value = s.restaurantName;
  document.getElementById('setting-tagline').value = s.tagline;
  document.getElementById('setting-currency').value = s.currency;
  document.getElementById('setting-tables').value = s.tableCount;
}

document.getElementById('save-settings-btn').addEventListener('click', () => {
  saveSettings({
    restaurantName: document.getElementById('setting-name').value,
    tagline: document.getElementById('setting-tagline').value,
    currency: document.getElementById('setting-currency').value,
    tableCount: parseInt(document.getElementById('setting-tables').value) || 20,
  });
  broadcast.send(EVENTS.SETTINGS_UPDATE, {});
  showToast({ title: 'Settings saved', type: 'success' });
});

document.getElementById('reset-data-btn').addEventListener('click', () => {
  if (confirm('This will delete ALL data. Are you sure?')) {
    resetAll();
    showToast({ title: 'Data reset', message: 'All data cleared', type: 'warning' });
    renderDashboard();
  }
});

// ── Listen for real-time updates ──
broadcast.on(EVENTS.NEW_ORDER, () => {
  if (currentSection === 'dashboard') renderDashboard();
  if (currentSection === 'orders') renderOrders();
});

broadcast.on(EVENTS.ORDER_STATUS_CHANGE, () => {
  if (currentSection === 'dashboard') renderDashboard();
  if (currentSection === 'orders') renderOrders();
});

// ══════════════════════════════════════════
//  PAYMENT SETTINGS SECTION
// ══════════════════════════════════════════

let paymentQrImageData = '';

function renderPaymentSettingsSection() {
  const ps = getPaymentSettings();
  paymentQrImageData = ps.upiQrImage || '';

  const container = document.getElementById('payment-settings-body');
  if (!container) return;

  container.innerHTML = `
    <div class="ps-card glass">
      <div class="ps-card-header">
        <span class="ps-card-icon">📱</span>
        <h3>UPI Payment QR Code</h3>
      </div>
      <p class="ps-card-desc">Upload your restaurant's UPI payment QR code. Customers will see this when they choose to pay via UPI.</p>
      <div class="ps-upload-area" id="ps-upload-area">
        <div class="ps-upload-placeholder" id="ps-upload-placeholder" ${paymentQrImageData ? 'style="display:none"' : ''}>
          <div class="ps-upload-icon">📸</div>
          <p>Drop your payment QR code here</p>
          <span>JPG, PNG, WebP • Max 5MB</span>
          <button type="button" class="btn btn-sm btn-secondary" id="ps-browse-btn">Browse Files</button>
        </div>
        <div class="ps-upload-preview ${paymentQrImageData ? 'active' : ''}" id="ps-upload-preview">
          <img src="${paymentQrImageData}" alt="Payment QR" id="ps-preview-img" />
          <button type="button" class="ps-upload-remove" id="ps-remove-btn">✕</button>
        </div>
        <input type="file" id="ps-file-input" accept="image/jpeg,image/png,image/webp" hidden />
      </div>
      <button class="btn btn-primary" id="ps-save-qr">💾 Save QR Code</button>
    </div>

    <div class="ps-card glass">
      <div class="ps-card-header">
        <span class="ps-card-icon">🔗</span>
        <h3>UPI ID</h3>
      </div>
      <p class="ps-card-desc">Enter your restaurant's UPI ID for customers to pay directly.</p>
      <div class="input-group">
        <label>UPI ID</label>
        <input type="text" class="input" id="ps-upi-id" value="${ps.upiId || ''}" placeholder="e.g. myrestaurant@upi" />
      </div>
      <button class="btn btn-primary" id="ps-save-upi">💾 Save UPI ID</button>
    </div>
  `;

  // Wire up upload handlers
  initPaymentQrUpload();

  // Save QR
  document.getElementById('ps-save-qr')?.addEventListener('click', () => {
    const ps = getPaymentSettings();
    ps.upiQrImage = paymentQrImageData;
    savePaymentSettings(ps);
    showToast({ title: 'Payment QR saved!', type: 'success' });
  });

  // Save UPI ID
  document.getElementById('ps-save-upi')?.addEventListener('click', () => {
    const ps = getPaymentSettings();
    ps.upiId = document.getElementById('ps-upi-id').value.trim();
    savePaymentSettings(ps);
    showToast({ title: 'UPI ID saved!', type: 'success' });
  });
}

function initPaymentQrUpload() {
  const uploadArea = document.getElementById('ps-upload-area');
  const placeholder = document.getElementById('ps-upload-placeholder');
  const preview = document.getElementById('ps-upload-preview');
  const previewImg = document.getElementById('ps-preview-img');
  const fileInput = document.getElementById('ps-file-input');
  const browseBtn = document.getElementById('ps-browse-btn');
  const removeBtn = document.getElementById('ps-remove-btn');

  function handleFile(file) {
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      showToast({ title: 'Invalid file type', type: 'error' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast({ title: 'File too large', message: 'Max 5MB', type: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      paymentQrImageData = e.target.result;
      previewImg.src = paymentQrImageData;
      placeholder.style.display = 'none';
      preview.classList.add('active');
    };
    reader.readAsDataURL(file);
  }

  browseBtn?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); fileInput.click(); });
  uploadArea?.addEventListener('click', (e) => {
    if (e.target === uploadArea || e.target.closest('#ps-upload-placeholder')) {
      if (!e.target.closest('#ps-browse-btn')) fileInput.click();
    }
  });
  fileInput?.addEventListener('change', () => handleFile(fileInput.files[0]));
  uploadArea?.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
  uploadArea?.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
  uploadArea?.addEventListener('drop', (e) => {
    e.preventDefault(); uploadArea.classList.remove('dragover');
    handleFile(e.dataTransfer.files[0]);
  });
  removeBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    paymentQrImageData = '';
    previewImg.src = '';
    preview.classList.remove('active');
    placeholder.style.display = '';
    fileInput.value = '';
  });
}

// Initial render is handled by async init above
