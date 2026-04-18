// ── RestroDyn Firebase Store ──
// Provides async Firestore CRUD with localStorage caching.
// Falls back to pure localStorage when Firebase is not configured.

import { db, isFirebaseConfigured } from './firebase-config.js';
import {
  doc, getDoc, setDoc, getDocs, deleteDoc, updateDoc,
  collection, query, where, onSnapshot
} from 'firebase/firestore';

const useFirebase = isFirebaseConfigured() && db !== null;
let platformSyncPromise = null;
let restaurantSyncPromises = {};
let activeListeners = {}; // To prevent duplicate listeners

// ═══════════════════════════════════════
//  Local Cache Helpers (localStorage)
// ═══════════════════════════════════════

function localGet(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

function localSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('localStorage write failed:', e);
  }
}

function localRemove(key) {
  localStorage.removeItem(key);
}

// ═══════════════════════════════════════
//  Sync Data Mergers
// ═══════════════════════════════════════

/**
 * Merges local and remote data to prevent data loss.
 * Specifically handles arrays of objects with IDs (like restaurants).
 */
function mergeData(local, remote, cacheKey) {
  if (local === null || local === undefined) return remote;
  if (remote === null || remote === undefined) return local;

  // If both are arrays and look like ID-based lists (like restaurants or orders)
  if (Array.isArray(local) && Array.isArray(remote)) {
    // 1. Self-deduplicate the remote array first (in case the cloud has duplicates)
    const uniqueRemote = [];
    remote.forEach(rItem => {
      const existsIdx = uniqueRemote.findIndex(uItem => 
        (rItem.id && uItem.id === rItem.id) || 
        (rItem.email && uItem.email === rItem.email && rItem.email.includes('@')) ||
        (rItem.slug && uItem.slug === rItem.slug)
      );
      if (existsIdx === -1) {
        uniqueRemote.push(rItem);
      } else {
        // Merge duplicates in remote, preferring the one with more data
        uniqueRemote[existsIdx] = { ...uniqueRemote[existsIdx], ...rItem };
      }
    });

    const combined = [...uniqueRemote];
    local.forEach(lItem => {
      // Identity check: match by ID, Email, or Slug (for restaurants)
      const existsIdx = combined.findIndex(rItem => 
        (lItem.id && rItem.id === lItem.id) || 
        (lItem.email && rItem.email === lItem.email && lItem.email.includes('@')) ||
        (lItem.slug && rItem.slug === lItem.slug)
      );

      if (existsIdx === -1) {
        combined.push(lItem);
      } else {
        // If it exists, merge the objects to ensure no data loss
        combined[existsIdx] = { ...lItem, ...combined[existsIdx] };
      }
    });
    return combined;
  }

  // Default: Remote wins for single objects/settings but we log it
  return remote;
}

// ═══════════════════════════════════════
//  Firestore Document Operations
// ═══════════════════════════════════════

/**
 * Read a Firestore document; fall back to localStorage cache.
 * @param {string} collectionName - Firestore collection
 * @param {string} docId - Document ID
 * @param {string} cacheKey - localStorage cache key
 * @returns {Promise<any>}
 */
export async function fbGet(collectionName, docId, cacheKey) {
  if (!useFirebase) return localGet(cacheKey);

  try {
    const snap = await getDoc(doc(db, collectionName, docId));
    const remoteData = snap.exists() ? (snap.data()?.value ?? snap.data()) : null;
    const localData = localGet(cacheKey);

    const merged = mergeData(localData, remoteData, cacheKey);

    // If we merged local data that wasn't in Cloud, sync it back up
    if (JSON.stringify(merged) !== JSON.stringify(remoteData)) {
      await setDoc(doc(db, collectionName, docId), { value: merged, updatedAt: Date.now() }, { merge: true }).catch(console.warn);
    }

    localSet(cacheKey, merged);
    return merged;
  } catch (e) {
    console.warn(`Firestore read failed for ${collectionName}/${docId}, using cache`, e);
    return localGet(cacheKey);
  }
}

/**
 * Write a Firestore document and update localStorage cache.
 */
export async function fbSet(collectionName, docId, value, cacheKey) {
  localSet(cacheKey, value); // Always write cache first (optimistic)

  if (!useFirebase) return;

  try {
    await setDoc(doc(db, collectionName, docId), { value, updatedAt: Date.now() }, { merge: true });
  } catch (e) {
    console.warn(`Firestore write failed for ${collectionName}/${docId}`, e);
  }
}

/**
 * Delete a Firestore document and remove from localStorage.
 */
export async function fbDelete(collectionName, docId, cacheKey) {
  localRemove(cacheKey);

  if (!useFirebase) return;

  try {
    await deleteDoc(doc(db, collectionName, docId));
  } catch (e) {
    console.warn(`Firestore delete failed for ${collectionName}/${docId}`, e);
  }
}

/**
 * Delete multiple keys from Firestore that match a prefix.
 */
export async function fbDeletePrefix(collectionName, prefix) {
  // Remove from localStorage
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));

  if (!useFirebase) return;

  try {
    const q = query(collection(db, collectionName));
    const snapshot = await getDocs(q);
    const batch = [];
    snapshot.forEach(docSnap => {
      if (docSnap.id.startsWith(prefix)) {
        batch.push(deleteDoc(doc(db, collectionName, docSnap.id)));
      }
    });
    await Promise.all(batch);
  } catch (e) {
    console.warn(`Firestore prefix delete failed for ${collectionName}/${prefix}`, e);
  }
}

// ═══════════════════════════════════════
//  Synchronous Getters (from cache)
//  For backward compatibility with existing
//  synchronous code, these read from localStorage.
//  The data should be pre-loaded from Firestore on init.
// ═══════════════════════════════════════

export function fbGetSync(cacheKey) {
  return localGet(cacheKey);
}

export function fbSetSync(cacheKey, value) {
  localSet(cacheKey, value);
}

// ═══════════════════════════════════════
//  Data Sync — Preload from Firestore
//  Call this on app startup to populate
//  localStorage cache from Firestore.
// ═══════════════════════════════════════

/**
 * Preload a set of Firestore docs into localStorage.
 * @param {Array<{collection: string, docId: string, cacheKey: string}>} items
 */
export async function preloadFirestoreData(items) {
  if (!useFirebase) return;

  const promises = items.map(async ({ collection: coll, docId, cacheKey }) => {
    try {
      const snap = await getDoc(doc(db, coll, docId));
      const remoteData = snap.exists() ? (snap.data()?.value ?? snap.data()) : null;
      const localData = localGet(cacheKey);

      const merged = mergeData(localData, remoteData, cacheKey);

      // Save locally
      localSet(cacheKey, merged);

      // If local data exists that isn't in remote, push it up (Merge back-sync)
      if (JSON.stringify(merged) !== JSON.stringify(remoteData)) {
        await setDoc(doc(db, coll, docId), { value: merged, updatedAt: Date.now() }, { merge: true }).catch(console.warn);
      }
    } catch (e) {
      console.warn(`Preload failed for ${coll}/${docId}`, e);
    }
  });

  await Promise.all(promises);
}

/**
 * Sync all platform data from Firestore to localStorage on startup.
 */
export async function syncPlatformData() {
  if (!useFirebase) return;
  if (platformSyncPromise) return platformSyncPromise;

  platformSyncPromise = (async () => {
    try {
      await preloadFirestoreData([
        { collection: 'platform', docId: 'restaurants', cacheKey: 'restrodyn_platform_restaurants' },
        { collection: 'platform', docId: 'config', cacheKey: 'restrodyn_platform_config' },
        { collection: 'platform', docId: 'superAdmin', cacheKey: 'restrodyn_super_admin' },
        { collection: 'platform', docId: 'initialized', cacheKey: 'restrodyn_platform_initialized' },
        { collection: 'platform', docId: 'paymentRecords', cacheKey: 'restrodyn_payment_records' },
      ]);
    } finally {
      // We don't clear the promise so future calls return the same completed state
      // but we mark it as done internally if needed
    }
  })();

  return platformSyncPromise;
}

export async function syncRestaurantData(restaurantId) {
  if (!useFirebase) return;
  if (restaurantSyncPromises[restaurantId]) return restaurantSyncPromises[restaurantId];

  restaurantSyncPromises[restaurantId] = (async () => {
    const prefix = `restrodyn_${restaurantId}_`;
    const keys = ['categories', 'items', 'orders', 'settings', 'initialized', 'paymentSettings', 'waiterAlerts'];

    await preloadFirestoreData(
      keys.map(key => ({
        collection: 'restaurantData',
        docId: `${restaurantId}_${key}`,
        cacheKey: `${prefix}${key}`,
      }))
    );
  })();

  return restaurantSyncPromises[restaurantId];
}

/**
 * Listen to real-time changes for a specific restaurant.
 * @param {string} restaurantId 
 * @param {Function} onUpdate Callback when data changes
 */
export function subscribeToRestaurantData(restaurantId, onUpdate) {
  if (!useFirebase) return () => {};
  
  const prefix = `restrodyn_${restaurantId}_`;
  const keys = ['categories', 'items', 'orders', 'settings', 'initialized', 'paymentSettings', 'waiterAlerts'];
  const unsubscribers = [];

  keys.forEach(key => {
    const docRef = doc(db, 'restaurantData', `${restaurantId}_${key}`);
    const cacheKey = `${prefix}${key}`;
    
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const remoteData = snap.data()?.value ?? snap.data();
        const localData = localGet(cacheKey);

        // Intelligent merge to prefer remote but avoid clobbering unsaved local data
        const merged = mergeData(localData, remoteData, cacheKey);
        
        // Only update and notify if there's an actual change
        if (JSON.stringify(merged) !== JSON.stringify(localData)) {
          localSet(cacheKey, merged);
          if (onUpdate) onUpdate(key, merged);
        }
      }
    }, (err) => {
      console.warn(`Real-time listen failed for ${key}:`, err);
    });
    
    unsubscribers.push(unsub);
  });

  return () => {
    unsubscribers.forEach(unsub => unsub());
  };
}

/**
 * Write-through: writes to both localStorage and Firestore.
 * For platform-level data.
 */
export function platformWrite(docId, cacheKey, value) {
  localSet(cacheKey, value);
  if (useFirebase) {
    setDoc(doc(db, 'platform', docId), { value, updatedAt: Date.now() }, { merge: true })
      .catch(e => console.warn('Platform write-through failed:', e));
  }
}

/**
 * Write-through for restaurant-level data.
 */
export function restaurantWrite(restaurantId, dataKey, cacheKey, value) {
  localSet(cacheKey, value);
  if (useFirebase) {
    const docId = `${restaurantId}_${dataKey}`;
    setDoc(doc(db, 'restaurantData', docId), { value, updatedAt: Date.now() }, { merge: true })
      .catch(e => console.warn('Restaurant write-through failed:', e));
  }
}

export { useFirebase };

/**
 * High-speed sync for customers.
 * Skips all platform administrative data and only fetches core menu data.
 */
export async function syncCustomerEssentials(slug) {
  if (!useFirebase) return null;

  try {
    // 1. Fetch only the restaurants list to resolve the slug - FAST
    const restSnap = await getDoc(doc(db, 'platform', 'restaurants'));
    const allRestos = restSnap.exists() ? (restSnap.data()?.value ?? []) : [];
    
    // Identity-aware merge into local cache
    const localRestos = localGet('restrodyn_platform_restaurants') || [];
    const mergedRestos = mergeData(localRestos, allRestos, 'restrodyn_platform_restaurants');
    localSet('restrodyn_platform_restaurants', mergedRestos);

    const restaurant = mergedRestos.find(r => r.slug === slug);
    if (!restaurant) return null;

    // 2. Fetch only core menu data in one parallel batch
    const restaurantId = restaurant.id;
    const prefix = `restrodyn_${restaurantId}_`;
    const coreKeys = ['settings', 'categories', 'items']; // ONLY what customers need

    await preloadFirestoreData(
      coreKeys.map(key => ({
        collection: 'restaurantData',
        docId: `${restaurantId}_${key}`,
        cacheKey: `${prefix}${key}`,
      }))
    );

    return restaurant;
  } catch (e) {
    console.warn('Customer essentials sync failed:', e);
    return null;
  }
}

