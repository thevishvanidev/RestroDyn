// ── RestroDyn Utility Helpers ──

export function formatCurrency(amount, currency = '₹') {
  return `${currency}${amount.toLocaleString('en-IN')}`;
}

export function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return formatDate(timestamp);
}

export function elapsedMinutes(timestamp) {
  return Math.floor((Date.now() - timestamp) / 60000);
}

export function getSpiceLevelText(level) {
  const levels = ['Mild', 'Medium', 'Spicy', 'Extra Hot'];
  return levels[level] || 'Mild';
}

export function getSpiceLevelEmoji(level) {
  return '🌶️'.repeat(Math.max(1, level));
}

export function getStatusInfo(status) {
  const statuses = {
    new: { label: 'New Order', color: 'primary', icon: '🆕' },
    accepted: { label: 'Accepted', color: 'primary', icon: '✅' },
    preparing: { label: 'Preparing', color: 'warning', icon: '👨‍🍳' },
    ready: { label: 'Ready', color: 'success', icon: '🔔' },
    served: { label: 'Served', color: 'neutral', icon: '✨' },
    cancelled: { label: 'Cancelled', color: 'error', icon: '❌' },
  };
  return statuses[status] || statuses.new;
}

export function getTagInfo(tag) {
  const tags = {
    vegan: { label: 'Vegan', emoji: '🌱', color: '#4CAF50' },
    vegetarian: { label: 'Veg', emoji: '🟢', color: '#66BB6A' },
    'gluten-free': { label: 'GF', emoji: '🌾', color: '#FF9800' },
    'nut-free': { label: 'NF', emoji: '🥜', color: '#E91E63' },
  };
  return tags[tag] || { label: tag, emoji: '🏷️', color: '#9E9E9E' };
}

export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for non-secure contexts (HTTP/IP-based testing)
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
}

// Simple fuzzy search
export function fuzzyMatch(text, query) {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  return lower.includes(q);
}
