// ── RestroDyn Kitchen Dashboard App ──
// Now auth-gated and namespaced per restaurant

import { initTheme, createThemeToggle } from './components/theme-toggle.js';
import { showToast } from './components/toast.js';
import { seedData } from './data/seed-data.js';
import { getOrders, updateOrderStatus, getTodayOrders, setStoreNamespace, dismissWaiterAlert } from './data/store.js';
import { getSession, requireAuth, getRestaurantId } from './data/auth.js';
import { getRestaurant, getAllRestaurants } from './data/platform-store.js';
import { syncRestaurantData, syncPlatformData, subscribeToRestaurantData } from './data/firebase-store.js';
import { broadcast, EVENTS } from './data/broadcast.js';
import { formatTime, elapsedMinutes, playAlertSound } from './utils/helpers.js';

// Init
initTheme();

// Auth gate
if (!requireAuth('/register.html')) {
  throw new Error('Not authenticated');
}

const session = getSession();
const restaurantId = getRestaurantId();
setStoreNamespace(restaurantId);

// Async init
(async () => {
  await syncPlatformData();

  // 🧪 ID REPAIR SYSTEM (Kitchen Edition - Refinement)
  // Ensure kitchen stays on the ID that has the orders.
  const allRestos = getAllRestaurants();
  const userRestos = allRestos.filter(r => r.email === session.email);
  const masterResto = userRestos.length > 0 ? userRestos[0] : null;
  
  if (masterResto && masterResto.id !== restaurantId) {
    const localOrders = getTodayOrders();
    
    if (localOrders.length === 0) {
      console.log('🛠️ RestroDyn Kitchen: Empty view detected. Repairing to Master ID...', masterResto.id);
      const updatedSession = { ...session, restaurantId: masterResto.id, slug: masterResto.slug };
      localStorage.setItem('restrodyn_session', JSON.stringify(updatedSession));
      window.location.reload(); 
      return;
    } else {
      console.warn('⚠️ RestroDyn Kitchen: Multiple identities found. Staying on current ID as it has orders.');
    }
  }

  await syncRestaurantData(restaurantId);
  await seedData();
  // CRITICAL: Re-set namespace after seedData() which resets it to null
  setStoreNamespace(restaurantId);
  loadOrders();

  // Start real-time listener
  const syncBadge = document.getElementById('kitchen-sync-badge');
  
  subscribeToRestaurantData(restaurantId, (key, value) => {
    if (syncBadge) {
      syncBadge.className = 'badge badge-success badge-pulse';
      syncBadge.innerHTML = '<span class="pulse-dot"></span> LIVE SYNC';
    }

    if (key === 'orders') {
      const prevCount = orders.length;
      loadOrders();
      if (orders.length > prevCount) {
        playAlertSound();
        showToast({ title: 'New Order Received', message: 'A new order has arrived!', type: 'success' });
      }
    } else if (key === 'waiterAlerts') {
      const lastAlert = value[value.length - 1];
      if (lastAlert && lastAlert.status === 'new' && Date.now() - lastAlert.time < 30000) {
        if (!waiterAlert.classList.contains('active')) {
          playAlertSound();
        }
        waiterAlertText.textContent = `🛎️ Table ${lastAlert.tableNumber} needs assistance!`;
        waiterAlert.dataset.alertId = lastAlert.id;
        waiterAlert.classList.add('active');
        setTimeout(() => {
          waiterAlert.classList.remove('active');
        }, 15000);
      } else if (lastAlert && lastAlert.status === 'dismissed') {
        waiterAlert.classList.remove('active');
      }
    }
  });
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

const restaurant = getRestaurant(restaurantId);

// State
let soundEnabled = true;
let orders = [];

// DOM
const colNewBody = document.getElementById('col-new-body');
const colPreparingBody = document.getElementById('col-preparing-body');
const colReadyBody = document.getElementById('col-ready-body');
const statNew = document.getElementById('stat-new');
const statPreparing = document.getElementById('stat-preparing');
const statReady = document.getElementById('stat-ready');
const colNewCount = document.getElementById('col-new-count');
const colPreparingCount = document.getElementById('col-preparing-count');
const colReadyCount = document.getElementById('col-ready-count');
const waiterAlert = document.getElementById('waiter-alert');
const waiterAlertText = document.getElementById('waiter-alert-text');

// Update header with restaurant name
const brandText = document.querySelector('.logo-text');
if (brandText && restaurant) {
  brandText.textContent = `${restaurant.name} Kitchen`;
}

// Theme toggle
const themeSlot = document.getElementById('theme-slot');
if (themeSlot) themeSlot.appendChild(createThemeToggle());

// Sound toggle
const soundToggle = document.getElementById('sound-toggle');
soundToggle.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundToggle.textContent = soundEnabled ? '🔊 Sound On' : '🔇 Sound Off';
});

// Play notification sound
// ── Render Orders ──
function loadOrders() {
  orders = getTodayOrders();
  renderBoard();
}

function renderBoard() {
  const newOrders = orders.filter(o => o.status === 'new' || o.status === 'accepted');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  statNew.textContent = newOrders.length;
  statPreparing.textContent = preparingOrders.length;
  statReady.textContent = readyOrders.length;
  colNewCount.textContent = newOrders.length;
  colPreparingCount.textContent = preparingOrders.length;
  colReadyCount.textContent = readyOrders.length;

  colNewBody.innerHTML = newOrders.length
    ? newOrders.map(o => renderOrderCard(o, 'new')).join('')
    : '<div class="column-empty"><div class="column-empty-icon">✅</div><p>No new orders</p></div>';

  colPreparingBody.innerHTML = preparingOrders.length
    ? preparingOrders.map(o => renderOrderCard(o, 'preparing')).join('')
    : '<div class="column-empty"><div class="column-empty-icon">🍳</div><p>Nothing cooking</p></div>';

  colReadyBody.innerHTML = readyOrders.length
    ? readyOrders.map(o => renderOrderCard(o, 'ready')).join('')
    : '<div class="column-empty"><div class="column-empty-icon">🔔</div><p>No ready orders</p></div>';

  document.querySelectorAll('.order-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const orderId = btn.dataset.orderId;
      const newStatus = btn.dataset.status;
      handleStatusChange(orderId, newStatus);
    });
  });
}

function renderOrderCard(order, stage) {
  const elapsed = elapsedMinutes(order.createdAt);
  let timerClass = 'timer-green';
  if (elapsed > 15) timerClass = 'timer-red';
  else if (elapsed > 5) timerClass = 'timer-yellow';

  const items = order.items.map(item => `
    <div class="order-card-item">
      <span class="order-card-item-name">${item.name}</span>
      <span class="order-card-item-qty">×${item.qty}</span>
    </div>
    ${item.addons?.length ? `<div class="order-card-item-addons">+ ${item.addons.map(a => a.name).join(', ')}</div>` : ''}
  `).join('');

  let actions = '';
  if (stage === 'new') {
    actions = `
      <button class="btn btn-sm btn-primary order-action-btn" data-order-id="${order.id}" data-status="preparing">
        👨‍🍳 Start Preparing
      </button>`;
  } else if (stage === 'preparing') {
    actions = `
      <button class="btn btn-sm btn-success order-action-btn" data-order-id="${order.id}" data-status="ready">
        🔔 Mark Ready
      </button>`;
  } else if (stage === 'ready') {
    actions = `
      <button class="btn btn-sm btn-secondary order-action-btn" data-order-id="${order.id}" data-status="served">
        ✨ Mark Served
      </button>`;
  }

  return `
    <div class="kitchen-order-card" data-order-id="${order.id}">
      <div class="order-card-header">
        <div>
          <div class="order-card-table">🍽️ Table ${order.tableNumber}</div>
          <div class="order-card-number">${order.orderNumber} • ${formatTime(order.createdAt)}</div>
        </div>
        <span class="order-card-timer ${timerClass}">${elapsed}m</span>
      </div>
      <div class="order-card-items">${items}</div>
      ${order.specialInstructions ? `<div class="order-card-notes">${order.specialInstructions}</div>` : ''}
      <div class="order-card-actions">${actions}</div>
    </div>`;
}

function handleStatusChange(orderId, newStatus) {
  const updated = updateOrderStatus(orderId, newStatus);
  if (updated) {
    broadcast.send(EVENTS.ORDER_STATUS_CHANGE, { id: orderId, status: newStatus });
    loadOrders();
    
    const statusLabels = {
      preparing: 'Now preparing',
      ready: 'Ready to serve',
      served: 'Served to guest',
    };
    showToast({
      title: `Table ${updated.tableNumber}`,
      message: statusLabels[newStatus] || newStatus,
      type: newStatus === 'ready' ? 'success' : 'info',
    });
  }
}

// ── Listen for new orders ──
broadcast.on(EVENTS.NEW_ORDER, (order) => {
  playNotificationSound();
  loadOrders();
  showToast({
    title: `New Order — Table ${order.tableNumber}`,
    message: `${order.items.length} item(s) • ${order.orderNumber}`,
    type: 'order',
    duration: 8000,
  });

  setTimeout(() => {
    const card = document.querySelector(`[data-order-id="${order.id}"]`);
    if (card) {
      card.classList.add('new-arrival');
      setTimeout(() => card.classList.remove('new-arrival'), 3000);
    }
  }, 100);
});

// ── Waiter Call (broadcast - same tab/device) ──
broadcast.on(EVENTS.CALL_WAITER, (payload) => {
  playAlertSound();
  waiterAlert.classList.add('active');
  waiterAlertText.textContent = `Table ${payload.tableNumber} is calling!`;
  showToast({
    title: '🔔 Waiter Called',
    message: `Table ${payload.tableNumber} needs assistance`,
    type: 'warning',
    duration: 10000,
  });
});

// Note: waiter-dismiss handler already registered at line 86 via optional chaining

// ── Timer auto-update ──
setInterval(() => {
  document.querySelectorAll('.order-card-timer').forEach(timer => {
    const card = timer.closest('.kitchen-order-card');
    if (!card) return;
    const orderId = card.dataset.orderId;
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const elapsed = elapsedMinutes(order.createdAt);
    timer.textContent = `${elapsed}m`;
    timer.className = 'order-card-timer ' + (elapsed > 15 ? 'timer-red' : elapsed > 5 ? 'timer-yellow' : 'timer-green');
  });
}, 30000);

// Initial load handled by async init above

