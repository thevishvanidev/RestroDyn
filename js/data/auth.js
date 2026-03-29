// ── RestroDyn Authentication System ──
// Simple localStorage-based session management for demo purposes

const SESSION_KEY = 'restrodyn_session';
const SUPER_ADMIN_SESSION_KEY = 'restrodyn_sa_session';

// ══════════════════════════════════════════
//  RESTAURANT AUTH
// ══════════════════════════════════════════

export function setSession(restaurant) {
  const session = {
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    slug: restaurant.slug,
    email: restaurant.email,
    logo: restaurant.logo || '',
    subscription: restaurant.subscription,
    loginAt: Date.now(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getSession() {
  try {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function isLoggedIn() {
  return getSession() !== null;
}

export function getRestaurantId() {
  const session = getSession();
  return session?.restaurantId || null;
}

export function getRestaurantSlug() {
  const session = getSession();
  return session?.slug || null;
}

export function requireAuth(redirectUrl = '/register.html') {
  if (!isLoggedIn()) {
    window.location.href = redirectUrl;
    return false;
  }
  return true;
}

// Check subscription status
export function getSubscriptionStatus() {
  const session = getSession();
  if (!session?.subscription) return { valid: false, status: 'none' };

  const now = Date.now();
  const expiry = session.subscription.expiryDate;

  if (expiry && now > expiry) {
    return { valid: false, status: 'expired', plan: session.subscription.plan };
  }

  return {
    valid: true,
    status: session.subscription.status,
    plan: session.subscription.plan,
    expiryDate: expiry,
    daysRemaining: expiry ? Math.ceil((expiry - now) / (24 * 60 * 60 * 1000)) : null,
  };
}

// ══════════════════════════════════════════
//  SUPER ADMIN AUTH
// ══════════════════════════════════════════

export function setSuperAdminSession() {
  localStorage.setItem(SUPER_ADMIN_SESSION_KEY, JSON.stringify({
    loggedIn: true,
    loginAt: Date.now(),
  }));
}

export function isSuperAdminLoggedIn() {
  try {
    const data = localStorage.getItem(SUPER_ADMIN_SESSION_KEY);
    return data ? JSON.parse(data).loggedIn === true : false;
  } catch {
    return false;
  }
}

export function clearSuperAdminSession() {
  localStorage.removeItem(SUPER_ADMIN_SESSION_KEY);
}

export function requireSuperAdmin(redirectUrl = '/super-admin.html') {
  if (!isSuperAdminLoggedIn()) {
    return false;
  }
  return true;
}

// ══════════════════════════════════════════
//  LOGOUT
// ══════════════════════════════════════════

export function logout() {
  clearSession();
  window.location.href = '/';
}

export function logoutSuperAdmin() {
  clearSuperAdminSession();
  window.location.href = '/';
}
