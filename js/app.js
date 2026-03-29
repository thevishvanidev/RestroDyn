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
  trustCount.textContent = '100+';
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
  showInstallBanner();
});

function showInstallBanner() {
  // Don't show if dismissed recently
  const dismissed = localStorage.getItem('restrodyn_install_dismissed');
  if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

  // Only show on mobile / tablet
  if (window.innerWidth > 768 && !deferredPrompt) return;

  // Don't show if already installed (standalone mode)
  if (window.matchMedia('(display-mode: standalone)').matches) return;

  // Remove existing banner if any
  document.getElementById('pwa-install-banner')?.remove();

  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.innerHTML = `
    <div class="pwa-banner-content">
      <div class="pwa-banner-icon">🍽️</div>
      <div class="pwa-banner-text">
        <strong>Download RestroDyn App</strong>
        <span>Get the best experience with our app</span>
      </div>
    </div>
    <div class="pwa-banner-actions">
      <button class="btn btn-primary btn-sm" id="pwa-install-btn">Install</button>
      <button class="pwa-banner-close" id="pwa-dismiss-btn">✕</button>
    </div>
  `;
  document.body.appendChild(banner);

  // Show with animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      banner.classList.add('visible');
    });
  });

  document.getElementById('pwa-install-btn').addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        banner.classList.remove('visible');
        setTimeout(() => banner.remove(), 400);
      }
      deferredPrompt = null;
    } else {
      // iOS fallback
      alert('To install: tap the Share button (↑) in your browser, then "Add to Home Screen".');
    }
  });

  document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
    localStorage.setItem('restrodyn_install_dismissed', Date.now().toString());
    banner.classList.remove('visible');
    setTimeout(() => banner.remove(), 400);
  });
}

// Also show on iOS after delay
if (/iPhone|iPad|iPod/.test(navigator.userAgent) && !window.matchMedia('(display-mode: standalone)').matches) {
  setTimeout(() => showInstallBanner(), 3000);
}
