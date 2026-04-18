// ── RestroDyn Register / Login App ──

import { initTheme } from './components/theme-toggle.js';
import { showToast } from './components/toast.js';
import { registerRestaurant, loginRestaurant, getAllRestaurants } from './data/platform-store.js';
import { initializePlatform } from './data/platform-store.js';
import { setSession, isLoggedIn } from './data/auth.js';
import { seedData } from './data/seed-data.js';
import { seedRestaurantDefaults } from './data/seed-data.js';
import { syncPlatformData } from './data/firebase-store.js';

// Init
initTheme();

// Async init: sync Firebase data then seed
(async () => {
  await syncPlatformData();
  await seedData();
  // Redirect if already logged in (after sync)
  if (isLoggedIn()) {
    window.location.href = '/admin.html';
  }
})();

// Update trust count
const trustCount = document.getElementById('trust-count');
if (trustCount) trustCount.textContent = '100+';

// ── State ──
let activeTab = 'register';

// ── Tab Switching ──
const tabRegister = document.getElementById('tab-register');
const tabLogin = document.getElementById('tab-login');
const tabIndicator = document.getElementById('tab-indicator');
const registerForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');
const authMessage = document.getElementById('auth-message');
const authMessageIcon = document.getElementById('auth-message-icon');
const authMessageText = document.getElementById('auth-message-text');

function switchTab(tab) {
  activeTab = tab;
  hideMessage();

  if (tab === 'register') {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    tabIndicator.classList.remove('right');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  } else {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    tabIndicator.classList.add('right');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
  }
}

tabRegister.addEventListener('click', () => switchTab('register'));
tabLogin.addEventListener('click', () => switchTab('login'));

// Switch link buttons
document.querySelectorAll('.auth-switch-link').forEach(link => {
  link.addEventListener('click', () => switchTab(link.dataset.switch));
});

// ── Messages ──
function showMessage(type, icon, text) {
  authMessage.className = `auth-message ${type}`;
  authMessageIcon.textContent = icon;
  authMessageText.textContent = text;
}

function hideMessage() {
  authMessage.className = 'auth-message hidden';
}

// ── Password Toggles ──
document.querySelectorAll('.password-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = btn.previousElementSibling;
    if (input.type === 'password') {
      input.type = 'text';
      btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
    } else {
      input.type = 'password';
      btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
    }
  });
});

// ── Register ──
registerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  hideMessage();

  const data = {
    name: document.getElementById('reg-restaurant-name').value.trim(),
    ownerName: document.getElementById('reg-owner-name').value.trim(),
    email: document.getElementById('reg-email').value.trim(),
    password: document.getElementById('reg-password').value,
    phone: document.getElementById('reg-phone').value.trim(),
    cuisine: document.getElementById('reg-cuisine').value.trim(),
    address: document.getElementById('reg-address').value.trim(),
  };

  if (!data.name || !data.ownerName || !data.email || !data.password) {
    showMessage('error', '❌', 'Please fill all required fields');
    return;
  }

  if (data.password.length < 6) {
    showMessage('error', '❌', 'Password must be at least 6 characters');
    return;
  }

  const submitBtn = document.getElementById('register-submit');
  submitBtn.classList.add('loading');
  submitBtn.disabled = true;

  // Simulate a tiny delay for UX
  setTimeout(() => {
    const result = registerRestaurant(data);

    if (result.success) {
      // Seed default menu structure for them
      seedRestaurantDefaults(result.restaurant.id, result.restaurant.name);

      // Auto-login
      setSession(result.restaurant);

      showMessage('success', '✅', 'Restaurant registered! Redirecting...');
      showToast({ title: 'Welcome to RestroDyn!', message: '14-day free trial activated', type: 'success', duration: 3000 });

      setTimeout(() => {
        window.location.href = '/admin.html';
      }, 1500);
    } else {
      showMessage('error', '❌', result.error);
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  }, 600);
});

// ── Login ──
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  hideMessage();

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    showMessage('error', '❌', 'Please fill all fields');
    return;
  }

  const submitBtn = document.getElementById('login-submit');
  submitBtn.classList.add('loading');
  submitBtn.disabled = true;

  (async () => {
    try {
      // Ensure we have the latest data from cloud before checking login
      await syncPlatformData();
      
      const result = loginRestaurant(email, password);

      if (result.success) {
        setSession(result.restaurant);
        showMessage('success', '✅', 'Login successful! Redirecting...');

        setTimeout(() => {
          window.location.href = '/admin.html';
        }, 800);
      } else {
        showMessage('error', '❌', result.error);
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
      }
    } catch (e) {
      console.error('Login sync error:', e);
      showMessage('error', '❌', 'Connection error. Please try again.');
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  })();
});




// Check URL params for auto-switch
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('tab') === 'login') {
  switchTab('login');
}
