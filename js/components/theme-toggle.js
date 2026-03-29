// ── RestroDyn Theme Toggle ──

export function initTheme() {
  const saved = localStorage.getItem('restrodyn_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
  return theme;
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('restrodyn_theme', next);
  return next;
}

export function getTheme() {
  return document.documentElement.getAttribute('data-theme') || 'dark';
}

export function createThemeToggle() {
  const btn = document.createElement('button');
  btn.className = 'btn btn-icon btn-secondary theme-toggle-btn';
  btn.id = 'theme-toggle';
  btn.setAttribute('aria-label', 'Toggle theme');
  btn.innerHTML = getTheme() === 'dark' ? '☀️' : '🌙';
  btn.addEventListener('click', () => {
    const theme = toggleTheme();
    btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
  });
  return btn;
}
