// ── RestroDyn Firebase Store ──
// Provides async Firestore CRUD with localStorage caching.
// Falls back to pure localStorage when Firebase is not configured.

import { db, isFirebaseConfigured } from './firebase-config.js';
import {
  doc, getDoc, setDoc, getDocs, deleteDoc, updateDoc,
  collection, query, where, onSnapshot
} from 'firebase/firestore';

const useFirebase = isFirebaseConfigured() && db !== null;

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
    if (snap.exists()) {
      const data = snap.data()?.value ?? snap.data();
      localSet(cacheKey, data); // Update cache
      return data;
    }
    // Not in Firestore yet — try local cache
    return localGet(cacheKey);
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
      if (snap.exists()) {
        const data = snap.data()?.value ?? snap.data();
        localSet(cacheKey, data);
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

  await preloadFirestoreData([
    { collection: 'platform', docId: 'restaurants', cacheKey: 'restrodyn_platform_restaurants' },
    { collection: 'platform', docId: 'config', cacheKey: 'restrodyn_platform_config' },
    { collection: 'platform', docId: 'superAdmin', cacheKey: 'restrodyn_super_admin' },
    { collection: 'platform', docId: 'initialized', cacheKey: 'restrodyn_platform_initialized' },
    { collection: 'platform', docId: 'paymentRecords', cacheKey: 'restrodyn_payment_records' },
  ]);
}

/**
 * Sync a specific restaurant's data from Firestore to localStorage.
 */
export async function syncRestaurantData(restaurantId) {
  if (!useFirebase) return;

  const prefix = `restrodyn_${restaurantId}_`;
  const keys = ['categories', 'items', 'orders', 'settings', 'initialized', 'paymentSettings'];

  await preloadFirestoreData(
    keys.map(key => ({
      collection: 'restaurantData',
      docId: `${restaurantId}_${key}`,
      cacheKey: `${prefix}${key}`,
    }))
  );
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
