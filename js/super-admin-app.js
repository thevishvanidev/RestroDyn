// ── RestroDyn Super Admin App ──

import { initTheme, createThemeToggle } from './components/theme-toggle.js';
import { showToast } from './components/toast.js';
import { seedData } from './data/seed-data.js';
import {
  getAllRestaurants, getPlatformConfig, savePlatformConfig,
  getPlatformStats, verifySuperAdmin, getSuperAdmin, saveSuperAdmin,
  updateRestaurant, suspendRestaurant, activateRestaurant, deleteRestaurant,
  updateRestaurantSubscription, initializePlatform,
} from './data/platform-store.js';
import {
  isSuperAdminLoggedIn, setSuperAdminSession,
  clearSuperAdminSession,
} from './data/auth.js';
import { formatCurrency, formatDate, timeAgo } from './utils/helpers.js';

// Init
initTheme();
seedData();

let currentSection = 'sa-dashboard';
let searchQuery = '';

// ── Login Gate ──
const loginGate = document.getElementById('sa-login-gate');
const panel = document.getElementById('sa-panel');
const loginError = document.getElementById('sa-login-error');

function enterPanel() {
  loginGate.classList.add('hidden');
  panel.classList.remove('hidden');
  renderDashboard();
}

if (isSuperAdminLoggedIn()) {
  enterPanel();
}

document.getElementById('sa-login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('sa-email').value.trim();
  const password = document.getElementById('sa-password').value;

  if (verifySuperAdmin(email, password)) {
    setSuperAdminSession();
    enterPanel();
    showToast({ title: 'Welcome, Super Admin', type: 'success' });
  } else {
    loginError.classList.remove('hidden');
    loginError.textContent = 'Invalid credentials. Try admin@restrodyn.app / admin123';
  }
});

// ── Logout ──
document.getElementById('sa-logout-btn').addEventListener('click', () => {
  clearSuperAdminSession();
  window.location.reload();
});

// ── Navigation ──
document.querySelectorAll('.sa-sidebar .sidebar-link').forEach(link => {
  link.addEventListener('click', () => switchSection(link.dataset.section));
});

function switchSection(section) {
  currentSection = section;
  document.querySelectorAll('.sa-sidebar .sidebar-link').forEach(l => l.classList.remove('active'));
  document.querySelector(`[data-section="${section}"]`)?.classList.add('active');
  document.querySelectorAll('.sa-section').forEach(s => s.classList.remove('active'));
  document.getElementById(`section-${section}`)?.classList.add('active');

  const titles = {
    'sa-dashboard': 'Dashboard',
    'sa-restaurants': 'Restaurants',
    'sa-subscriptions': 'Subscriptions',
    'sa-settings': 'Settings',
  };
  document.getElementById('sa-mobile-title').textContent = titles[section] || '';

  // Close mobile sidebar
  document.getElementById('sa-sidebar').classList.remove('open');
  document.querySelector('.sa-sidebar-overlay')?.classList.remove('active');

  if (section === 'sa-dashboard') renderDashboard();
  else if (section === 'sa-restaurants') renderRestaurants();
  else if (section === 'sa-subscriptions') renderSubscriptions();
  else if (section === 'sa-settings') loadSettings();
}

// ── Mobile sidebar ──
const sOverlay = document.createElement('div');
sOverlay.className = 'sa-sidebar-overlay';
document.body.appendChild(sOverlay);

document.getElementById('sa-mobile-toggle')?.addEventListener('click', () => {
  document.getElementById('sa-sidebar').classList.toggle('open');
  sOverlay.classList.toggle('active');
});

sOverlay.addEventListener('click', () => {
  document.getElementById('sa-sidebar').classList.remove('open');
  sOverlay.classList.remove('active');
});

// ═══════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════

function renderDashboard() {
  const stats = getPlatformStats();
  const config = getPlatformConfig();

  document.getElementById('sa-stats-grid').innerHTML = `
    <div class="sa-stat-card">
      <div class="sa-stat-card-icon">🏪</div>
      <div class="sa-stat-card-value">${stats.totalRestaurants}</div>
      <div class="sa-stat-card-label">Total Restaurants</div>
    </div>
    <div class="sa-stat-card">
      <div class="sa-stat-card-icon">✅</div>
      <div class="sa-stat-card-value">${stats.active}</div>
      <div class="sa-stat-card-label">Active</div>
    </div>
    <div class="sa-stat-card">
      <div class="sa-stat-card-icon">🧪</div>
      <div class="sa-stat-card-value">${stats.trial}</div>
      <div class="sa-stat-card-label">On Trial</div>
    </div>
    <div class="sa-stat-card">
      <div class="sa-stat-card-icon">💳</div>
      <div class="sa-stat-card-value">${stats.paid}</div>
      <div class="sa-stat-card-label">Paid Subscriptions</div>
    </div>
    <div class="sa-stat-card">
      <div class="sa-stat-card-icon">🚫</div>
      <div class="sa-stat-card-value">${stats.suspended}</div>
      <div class="sa-stat-card-label">Suspended</div>
    </div>
    <div class="sa-stat-card">
      <div class="sa-stat-card-icon">💰</div>
      <div class="sa-stat-card-value">${formatCurrency(stats.monthlyRevenue)}</div>
      <div class="sa-stat-card-label">Monthly Revenue</div>
    </div>
  `;

  // Recent registrations
  const restaurants = getAllRestaurants()
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  document.getElementById('sa-recent-list').innerHTML = restaurants.length
    ? restaurants.map(r => `
      <div class="sa-recent-item">
        <div class="sa-recent-avatar">🏪</div>
        <div class="sa-recent-info">
          <div class="sa-recent-name">${r.name}</div>
          <div class="sa-recent-email">${r.email}</div>
        </div>
        <div class="sa-recent-date">${timeAgo(r.createdAt)}</div>
      </div>
    `).join('')
    : '<p style="color:var(--text-tertiary);font-size:var(--text-sm)">No restaurants registered yet</p>';

  // Charts (try chart.js)
  renderDashboardCharts(stats);
}

function renderDashboardCharts(stats) {
  try {
    import('chart.js/auto').then(({ default: Chart }) => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const textColor = isDark ? '#A0A0C0' : '#4A4A68';

      // Subscription distribution
      const subCtx = document.getElementById('sa-sub-chart');
      if (subCtx._chart) subCtx._chart.destroy();

      const chart1 = new Chart(subCtx, {
        type: 'doughnut',
        data: {
          labels: ['Trial', 'Paid', 'Expired', 'Suspended'],
          datasets: [{
            data: [stats.trial, stats.paid, stats.expired, stats.suspended],
            backgroundColor: [
              'rgba(255, 193, 7, 0.7)',
              'rgba(0, 200, 83, 0.7)',
              'rgba(255, 82, 82, 0.7)',
              'rgba(136, 136, 160, 0.7)',
            ],
            borderWidth: 0,
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: textColor, padding: 16 },
            },
          },
        },
      });
      subCtx._chart = chart1;

      // Growth chart (simulate)
      const growthCtx = document.getElementById('sa-growth-chart');
      if (growthCtx._chart) growthCtx._chart.destroy();

      const restaurants = getAllRestaurants();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const growthData = months.map((_, i) => {
        return restaurants.filter(r => {
          const d = new Date(r.createdAt);
          return d.getMonth() <= i;
        }).length;
      });

      const chart2 = new Chart(growthCtx, {
        type: 'line',
        data: {
          labels: months,
          datasets: [{
            label: 'Restaurants',
            data: growthData,
            borderColor: 'rgba(255, 193, 7, 0.8)',
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#FFC107',
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: textColor }, grid: { display: false } },
            y: { ticks: { color: textColor, stepSize: 1 }, grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' } },
          },
        },
      });
      growthCtx._chart = chart2;
    });
  } catch (e) {
    console.log('Charts not available:', e);
  }
}

// ═══════════════════════════════════════
//  RESTAURANTS
// ═══════════════════════════════════════

function renderRestaurants() {
  let restaurants = getAllRestaurants();

  // Filter by search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    restaurants = restaurants.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.cuisine?.toLowerCase().includes(q)
    );
  }

  const tbody = document.getElementById('sa-restaurants-tbody');

  if (!restaurants.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:var(--space-2xl);color:var(--text-tertiary)">No restaurants found</td></tr>`;
    return;
  }

  tbody.innerHTML = restaurants.map(r => {
    const statusBadge = getStatusBadge(r.status);
    const subBadge = getSubBadge(r.subscription);
    return `
      <tr>
        <td>
          <div class="restaurant-name-cell">
            <div class="rest-avatar">🏪</div>
            <div class="rest-details">
              <strong>${r.name}</strong>
              <span>${r.email}</span>
            </div>
          </div>
        </td>
        <td>${r.ownerName || '—'}</td>
        <td>${statusBadge}</td>
        <td>${subBadge}</td>
        <td>${formatDate(r.createdAt)}</td>
        <td>
          <div class="actions-cell">
            ${r.status === 'active'
              ? `<button class="btn btn-sm btn-secondary sa-suspend-btn" data-id="${r.id}" title="Suspend">⏸️</button>`
              : `<button class="btn btn-sm btn-success sa-activate-btn" data-id="${r.id}" title="Activate">▶️</button>`
            }
            <button class="btn btn-sm btn-secondary sa-pay-btn" data-id="${r.id}" title="Mark Paid">💳</button>
            <button class="btn btn-sm btn-danger sa-delete-btn" data-id="${r.id}" title="Delete">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Attach handlers
  tbody.querySelectorAll('.sa-suspend-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      suspendRestaurant(btn.dataset.id);
      showToast({ title: 'Restaurant suspended', type: 'warning' });
      renderRestaurants();
    });
  });

  tbody.querySelectorAll('.sa-activate-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activateRestaurant(btn.dataset.id);
      showToast({ title: 'Restaurant activated', type: 'success' });
      renderRestaurants();
    });
  });

  tbody.querySelectorAll('.sa-pay-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const config = getPlatformConfig();
      const monthlyPlan = config.subscriptionPlans.find(p => p.id === 'monthly');
      updateRestaurantSubscription(btn.dataset.id, {
        plan: 'monthly',
        amount: monthlyPlan?.price || 300,
        status: 'active',
        startDate: Date.now(),
        expiryDate: Date.now() + (30 * 24 * 60 * 60 * 1000),
        paymentMethod: 'Admin Override',
      });
      showToast({ title: 'Subscription activated', message: 'Monthly plan applied', type: 'success' });
      renderRestaurants();
    });
  });

  tbody.querySelectorAll('.sa-delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Are you sure? This will delete all restaurant data.')) {
        deleteRestaurant(btn.dataset.id);
        showToast({ title: 'Restaurant deleted', type: 'warning' });
        renderRestaurants();
      }
    });
  });
}

function getStatusBadge(status) {
  const map = {
    active: '<span class="badge badge-success">✅ Active</span>',
    suspended: '<span class="badge badge-error">🚫 Suspended</span>',
    pending: '<span class="badge badge-warning">⏳ Pending</span>',
  };
  return map[status] || `<span class="badge badge-neutral">${status}</span>`;
}

function getSubBadge(sub) {
  if (!sub) return '<span class="badge badge-neutral">None</span>';
  const map = {
    trial: '<span class="badge badge-warning">🧪 Trial</span>',
    active: `<span class="badge badge-success">💳 ${sub.plan}</span>`,
    expired: '<span class="badge badge-error">⏰ Expired</span>',
  };
  return map[sub.status] || '<span class="badge badge-neutral">Unknown</span>';
}

// Search
document.getElementById('sa-search-restaurants')?.addEventListener('input', (e) => {
  searchQuery = e.target.value.trim();
  renderRestaurants();
});

// ═══════════════════════════════════════
//  SUBSCRIPTIONS
// ═══════════════════════════════════════

function renderSubscriptions() {
  const config = getPlatformConfig();
  const plans = config.subscriptionPlans;

  document.getElementById('sa-plans-grid').innerHTML = plans.map((plan, i) => `
    <div class="sa-plan-card ${i === 1 ? 'popular' : ''}">
      <div class="sa-plan-name">${plan.name}</div>
      <div class="sa-plan-price">₹${plan.price}<span>/${plan.duration} days</span></div>
      <div class="sa-plan-duration">${plan.duration}-day plan</div>
      <ul class="sa-plan-features">
        ${(plan.features || []).map(f => `<li>${f}</li>`).join('')}
      </ul>
      <div class="sa-plan-edit">
        <div class="input-group">
          <label>Price (₹)</label>
          <input type="number" class="input sa-plan-price-input" data-plan-id="${plan.id}" value="${plan.price}" min="0" />
        </div>
        <button class="btn btn-sm btn-primary sa-plan-save-btn" data-plan-id="${plan.id}">Save</button>
      </div>
    </div>
  `).join('');

  // Save plan price
  document.querySelectorAll('.sa-plan-save-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const planId = btn.dataset.planId;
      const input = document.querySelector(`.sa-plan-price-input[data-plan-id="${planId}"]`);
      const newPrice = parseInt(input.value);

      if (isNaN(newPrice) || newPrice < 0) return;

      const config = getPlatformConfig();
      config.subscriptionPlans = config.subscriptionPlans.map(p =>
        p.id === planId ? { ...p, price: newPrice } : p
      );
      savePlatformConfig(config);
      showToast({ title: 'Plan updated', type: 'success' });
      renderSubscriptions();
    });
  });

  // Payment history (simulated from restaurants with active/paid subs)
  const restaurants = getAllRestaurants().filter(r => r.subscription?.status === 'active' && r.subscription?.amount > 0);
  document.getElementById('sa-payment-list').innerHTML = restaurants.length
    ? restaurants.map(r => `
      <div class="sa-payment-item">
        <span>🏪 ${r.name}</span>
        <span class="badge badge-neutral">${r.subscription.plan}</span>
        <span style="color:var(--text-tertiary);font-size:var(--text-xs)">${r.subscription.paymentMethod || '—'}</span>
        <span class="sa-payment-amount">+₹${r.subscription.amount}</span>
      </div>
    `).join('')
    : '<p style="color:var(--text-tertiary);font-size:var(--text-sm);padding:var(--space-md) 0">No payments recorded</p>';
}

// ═══════════════════════════════════════
//  SETTINGS
// ═══════════════════════════════════════

function loadSettings() {
  const config = getPlatformConfig();
  document.getElementById('sa-setting-platform-name').value = config.platformName;
  document.getElementById('sa-setting-support-email').value = config.supportEmail;
  document.getElementById('sa-setting-trial-days').value = config.trialDays;
}

document.getElementById('sa-save-settings-btn').addEventListener('click', () => {
  const config = getPlatformConfig();
  config.platformName = document.getElementById('sa-setting-platform-name').value;
  config.supportEmail = document.getElementById('sa-setting-support-email').value;
  config.trialDays = parseInt(document.getElementById('sa-setting-trial-days').value) || 14;
  savePlatformConfig(config);
  showToast({ title: 'Settings saved', type: 'success' });
});

document.getElementById('sa-change-password-btn').addEventListener('click', () => {
  const current = document.getElementById('sa-current-password').value;
  const newPass = document.getElementById('sa-new-password').value;
  const admin = getSuperAdmin();

  if (current !== admin.password) {
    showToast({ title: 'Current password incorrect', type: 'error' });
    return;
  }

  if (newPass.length < 4) {
    showToast({ title: 'New password too short', type: 'error' });
    return;
  }

  saveSuperAdmin({ ...admin, password: newPass });
  document.getElementById('sa-current-password').value = '';
  document.getElementById('sa-new-password').value = '';
  showToast({ title: 'Password changed', type: 'success' });
});

// Initial render
if (isSuperAdminLoggedIn()) {
  renderDashboard();
}
