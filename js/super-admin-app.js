// ── RestroDyn Super Admin App ──

import { initTheme, createThemeToggle } from './components/theme-toggle.js';
import { showToast } from './components/toast.js';
import { seedData } from './data/seed-data.js';
import {
  getAllRestaurants, getPlatformConfig, savePlatformConfig,
  getPlatformStats, verifySuperAdmin, getSuperAdmin, saveSuperAdmin,
  updateRestaurant, suspendRestaurant, activateRestaurant, deleteRestaurant,
  updateRestaurantSubscription, initializePlatform,
  getPaymentRecords, approvePayment, rejectPayment,
  getRestaurantTaxRate, setRestaurantTaxRate, setDefaultTaxRate,
} from './data/platform-store.js';
import {
  isSuperAdminLoggedIn, setSuperAdminSession,
  clearSuperAdminSession,
} from './data/auth.js';
import { syncPlatformData } from './data/firebase-store.js';
import { formatCurrency, formatDate, timeAgo } from './utils/helpers.js';

// Init
initTheme();

// Async init: sync Firebase data then seed
(async () => {
  await syncPlatformData();
  await seedData();
  if (isSuperAdminLoggedIn()) {
    renderDashboard();
  }
})();

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
    'sa-payment-methods': 'Payment Methods',
    'sa-taxes': 'Taxes',
    'sa-settings': 'Settings',
  };
  document.getElementById('sa-mobile-title').textContent = titles[section] || '';

  // Close mobile sidebar
  document.getElementById('sa-sidebar').classList.remove('open');
  document.querySelector('.sa-sidebar-overlay')?.classList.remove('active');

  if (section === 'sa-dashboard') renderDashboard();
  else if (section === 'sa-restaurants') renderRestaurants();
  else if (section === 'sa-subscriptions') renderSubscriptions();
  else if (section === 'sa-payment-methods') renderPaymentMethods();
  else if (section === 'sa-taxes') renderTaxes();
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
      <div class="sa-stat-card-icon">📝</div>
      <div class="sa-stat-card-value">${stats.pendingPayments}</div>
      <div class="sa-stat-card-label">Pending Payments</div>
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

let ChartJS = null;

async function getChartJS() {
  if (!ChartJS) {
    const module = await import('chart.js/auto');
    ChartJS = module.default;
  }
  return ChartJS;
}

async function renderDashboardCharts(stats) {
  try {
    const Chart = await getChartJS();
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#A0A0C0' : '#4A4A68';

    // Subscription distribution
    const subCtx = document.getElementById('sa-sub-chart');
    if (subCtx) {
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
    }

    // Growth chart (simulate)
    const growthCtx = document.getElementById('sa-growth-chart');
    if (growthCtx) {
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
    }
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

// ═══════════════════════════════════════
//  PAYMENT METHODS
// ═══════════════════════════════════════

let pmQrImageData = '';

function renderPaymentMethods() {
  const config = getPlatformConfig();
  const pm = config.paymentMethods || {};

  // Load existing values
  document.getElementById('pm-upi-id').value = pm.upiId || '';
  document.getElementById('pm-bank-name').value = pm.bankDetails?.accountName || '';
  document.getElementById('pm-bank-account').value = pm.bankDetails?.accountNumber || '';
  document.getElementById('pm-bank-ifsc').value = pm.bankDetails?.ifscCode || '';
  document.getElementById('pm-bank-bankname').value = pm.bankDetails?.bankName || '';

  // QR Preview
  pmQrImageData = pm.qrImage || '';
  const placeholder = document.getElementById('pm-qr-placeholder');
  const preview = document.getElementById('pm-qr-preview');
  const previewImg = document.getElementById('pm-qr-preview-img');

  if (pmQrImageData) {
    placeholder.style.display = 'none';
    preview.classList.add('active');
    previewImg.src = pmQrImageData;
  } else {
    placeholder.style.display = '';
    preview.classList.remove('active');
    previewImg.src = '';
  }

  // Render pending payments
  renderPendingPayments();
  renderAllPayments();
}

function renderPendingPayments() {
  const records = getPaymentRecords().filter(p => p.status === 'pending');
  const container = document.getElementById('pm-pending-list');

  if (!records.length) {
    container.innerHTML = '<div class="pm-empty-state"><p>✅ No pending payments to verify</p></div>';
    return;
  }

  container.innerHTML = records.map(p => `
    <div class="pm-verify-card glass">
      <div class="pm-verify-header">
        <div class="pm-verify-restaurant">
          <div class="pm-verify-avatar">🏨</div>
          <div>
            <div class="pm-verify-name">${p.restaurantName}</div>
            <div class="pm-verify-date">${formatDate(p.submittedAt)}</div>
          </div>
        </div>
        <div class="pm-verify-amount">₹${p.amount}</div>
      </div>
      <div class="pm-verify-details">
        <div class="pm-verify-row">
          <span>Plan</span>
          <span class="badge badge-primary">${p.planName}</span>
        </div>
        <div class="pm-verify-row">
          <span>Method</span>
          <span>${p.paymentMethod}</span>
        </div>
        ${p.upiRef ? `<div class="pm-verify-row"><span>UPI Ref</span><span class="pm-ref-value">${p.upiRef}</span></div>` : ''}
        ${p.bankRef ? `<div class="pm-verify-row"><span>Bank Ref</span><span class="pm-ref-value">${p.bankRef}</span></div>` : ''}
      </div>
      ${p.proofImage ? `
        <div class="pm-verify-proof">
          <p class="pm-verify-proof-label">📸 Payment Proof</p>
          <img src="${p.proofImage}" alt="Payment proof" class="pm-proof-img" loading="lazy" />
        </div>
      ` : ''}
      <div class="pm-verify-actions">
        <button class="btn btn-success pm-approve-btn" data-id="${p.id}">✅ Approve</button>
        <button class="btn btn-danger pm-reject-btn" data-id="${p.id}">❌ Reject</button>
      </div>
    </div>
  `).join('');

  // Approve handlers
  container.querySelectorAll('.pm-approve-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      approvePayment(btn.dataset.id);
      showToast({ title: 'Payment approved!', message: 'Subscription activated for restaurant', type: 'success' });
      renderPaymentMethods();
    });
  });

  // Reject handlers
  container.querySelectorAll('.pm-reject-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const note = prompt('Rejection reason (optional):') || '';
      rejectPayment(btn.dataset.id, note);
      showToast({ title: 'Payment rejected', type: 'warning' });
      renderPaymentMethods();
    });
  });
}

function renderAllPayments() {
  const records = getPaymentRecords()
    .filter(p => p.status !== 'pending')
    .sort((a, b) => (b.reviewedAt || b.submittedAt) - (a.reviewedAt || a.submittedAt));
  const container = document.getElementById('pm-all-payments-list');

  if (!records.length) {
    container.innerHTML = '<div class="pm-empty-state"><p>No payment records yet</p></div>';
    return;
  }

  container.innerHTML = records.map(p => {
    const statusBadge = p.status === 'approved'
      ? '<span class="badge badge-success">✅ Approved</span>'
      : '<span class="badge badge-error">❌ Rejected</span>';
    return `
      <div class="pm-record-row">
        <div class="pm-record-info">
          <span class="pm-record-name">🏨 ${p.restaurantName}</span>
          <span class="pm-record-plan badge badge-neutral">${p.planName}</span>
          <span class="pm-record-method">${p.paymentMethod}</span>
        </div>
        <div class="pm-record-right">
          ${statusBadge}
          <span class="pm-record-amount">₹${p.amount}</span>
          <span class="pm-record-date">${formatDate(p.reviewedAt || p.submittedAt)}</span>
        </div>
        ${p.reviewNote ? `<div class="pm-record-note">Note: ${p.reviewNote}</div>` : ''}
      </div>
    `;
  }).join('');
}

// ── QR Upload Handlers ──
(function initPmQrUpload() {
  const uploadArea = document.getElementById('pm-qr-upload-area');
  const placeholder = document.getElementById('pm-qr-placeholder');
  const preview = document.getElementById('pm-qr-preview');
  const previewImg = document.getElementById('pm-qr-preview-img');
  const fileInput = document.getElementById('pm-qr-file');
  const browseBtn = document.getElementById('pm-qr-browse');
  const removeBtn = document.getElementById('pm-qr-remove');

  function handleQrFile(file) {
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
      pmQrImageData = e.target.result;
      previewImg.src = pmQrImageData;
      placeholder.style.display = 'none';
      preview.classList.add('active');
    };
    reader.readAsDataURL(file);
  }

  browseBtn?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); fileInput.click(); });
  uploadArea?.addEventListener('click', (e) => {
    if (e.target === uploadArea || e.target.closest('#pm-qr-placeholder')) {
      if (!e.target.closest('#pm-qr-browse')) fileInput.click();
    }
  });
  fileInput?.addEventListener('change', () => handleQrFile(fileInput.files[0]));
  uploadArea?.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
  uploadArea?.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
  uploadArea?.addEventListener('drop', (e) => {
    e.preventDefault(); uploadArea.classList.remove('dragover');
    handleQrFile(e.dataTransfer.files[0]);
  });
  removeBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    pmQrImageData = '';
    previewImg.src = '';
    preview.classList.remove('active');
    placeholder.style.display = '';
    fileInput.value = '';
  });
})();

// ── Save QR ──
document.getElementById('pm-save-qr')?.addEventListener('click', () => {
  const config = getPlatformConfig();
  if (!config.paymentMethods) config.paymentMethods = {};
  config.paymentMethods.qrImage = pmQrImageData;
  savePlatformConfig(config);
  showToast({ title: 'QR code saved!', type: 'success' });
});

// ── Save UPI ──
document.getElementById('pm-save-upi')?.addEventListener('click', () => {
  const config = getPlatformConfig();
  if (!config.paymentMethods) config.paymentMethods = {};
  config.paymentMethods.upiId = document.getElementById('pm-upi-id').value.trim();
  savePlatformConfig(config);
  showToast({ title: 'UPI ID saved!', type: 'success' });
});

// ── Save Bank ──
document.getElementById('pm-save-bank')?.addEventListener('click', () => {
  const config = getPlatformConfig();
  if (!config.paymentMethods) config.paymentMethods = {};
  config.paymentMethods.bankDetails = {
    accountName: document.getElementById('pm-bank-name').value.trim(),
    accountNumber: document.getElementById('pm-bank-account').value.trim(),
    ifscCode: document.getElementById('pm-bank-ifsc').value.trim(),
    bankName: document.getElementById('pm-bank-bankname').value.trim(),
  };
  savePlatformConfig(config);
  showToast({ title: 'Bank details saved!', type: 'success' });
});

// Initial render handled by async init

// ═══════════════════════════════════════
//  TAX CONFIGURATION
// ═══════════════════════════════════════

function renderTaxes() {
  const config = getPlatformConfig();
  const restaurants = getAllRestaurants();

  // Default tax
  document.getElementById('sa-default-tax').value = config.defaultTaxPercentage ?? 5;

  // Per-restaurant tax grid
  const grid = document.getElementById('sa-tax-grid');
  if (!restaurants.length) {
    grid.innerHTML = '<p style="color:var(--text-tertiary);font-size:var(--text-sm);padding:var(--space-md) 0">No restaurants registered yet</p>';
    return;
  }

  grid.innerHTML = restaurants.map(r => {
    const taxRate = getRestaurantTaxRate(r.id);
    return `
      <div class="tax-restaurant-card glass">
        <div class="tax-rest-info">
          <div class="tax-rest-avatar">🏪</div>
          <div class="tax-rest-details">
            <div class="tax-rest-name">${r.name}</div>
            <div class="tax-rest-email">${r.email}</div>
          </div>
        </div>
        <div class="tax-rest-control">
          <div class="tax-input-wrapper">
            <input type="number" class="input tax-rate-input" data-id="${r.id}" value="${taxRate}" min="0" max="50" step="0.5" />
            <span class="tax-percent-sign">%</span>
          </div>
          <button class="btn btn-sm btn-primary tax-save-btn" data-id="${r.id}">Save</button>
        </div>
      </div>
    `;
  }).join('');

  // Save handlers
  grid.querySelectorAll('.tax-save-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const input = grid.querySelector(`.tax-rate-input[data-id="${id}"]`);
      const rate = parseFloat(input.value);
      if (isNaN(rate) || rate < 0 || rate > 50) {
        showToast({ title: 'Invalid tax rate', message: 'Must be between 0 and 50', type: 'error' });
        return;
      }
      setRestaurantTaxRate(id, rate);
      showToast({ title: 'Tax rate updated', type: 'success' });
    });
  });
}

// Save default tax
document.getElementById('sa-save-default-tax')?.addEventListener('click', () => {
  const val = parseFloat(document.getElementById('sa-default-tax').value);
  if (isNaN(val) || val < 0 || val > 50) {
    showToast({ title: 'Invalid tax rate', message: 'Must be between 0 and 50', type: 'error' });
    return;
  }
  setDefaultTaxRate(val);
  showToast({ title: 'Default tax rate saved', type: 'success' });
});
