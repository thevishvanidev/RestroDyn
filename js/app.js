// ── RestroDyn Landing Page Entry ──

import { initHeroScene } from './three/hero-scene.js';
import { initTheme, createThemeToggle } from './components/theme-toggle.js';
import { seedData } from './data/seed-data.js';
import { getAllRestaurants, getPlatformConfig } from './data/platform-store.js';
import { formatCurrency } from './utils/helpers.js';

// Initialize
initTheme();
seedData();

// Three.js Hero
const canvas = document.getElementById('hero-canvas');
if (canvas) {
  initHeroScene(canvas);
}

// Theme toggle
const themeContainer = document.getElementById('theme-toggle-container');
if (themeContainer) {
  themeContainer.appendChild(createThemeToggle());
}

// Trust counter
const trustCount = document.getElementById('landing-trust-count');
if (trustCount) {
  const restaurants = getAllRestaurants();
  trustCount.textContent = restaurants.length;
}

// Pricing section
const pricingGrid = document.getElementById('pricing-grid');
if (pricingGrid) {
  const config = getPlatformConfig();
  pricingGrid.innerHTML = config.subscriptionPlans.map((plan, i) => `
    <div class="pricing-card glass ${i === 1 ? 'pricing-popular' : ''}">
      ${i === 1 ? '<div class="pricing-popular-badge">⭐ Most Popular</div>' : ''}
      <div class="pricing-name">${plan.name}</div>
      <div class="pricing-price">${formatCurrency(plan.price)}<span>/${plan.duration} days</span></div>
      <ul class="pricing-features">
        ${(plan.features || []).map(f => `<li>✓ ${f}</li>`).join('')}
      </ul>
      <a href="/register.html" class="btn ${i === 1 ? 'btn-primary' : 'btn-secondary'} btn-lg pricing-cta">
        Start Free Trial
      </a>
    </div>
  `).join('');
}

// Nav scroll effect
const nav = document.getElementById('main-nav');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});

// Mobile menu toggle
const mobileToggle = document.getElementById('mobile-menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');
if (mobileToggle && mobileMenu) {
  mobileToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
  });
}

// Intersection Observer for scroll animations
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-fade-up');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.feature-card, .step, .pricing-card').forEach(el => {
  observer.observe(el);
});

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      console.log('SW registration skipped in dev mode');
    });
  });
}

// PWA Install Prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});
