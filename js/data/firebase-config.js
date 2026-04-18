// ── RestroDyn Firebase Configuration ──
// Replace the config below with your Firebase project credentials.
// Get them from: https://console.firebase.google.com → Project Settings → General → Your apps → Web app

import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  // ╔════════════════════════════════════════════════════════╗
  // ║  PASTE YOUR FIREBASE CONFIG HERE                      ║
  // ║  Get it from Firebase Console → Project Settings      ║
  // ╚════════════════════════════════════════════════════════╝
  apiKey: "AIzaSyCPUPxazgHqEyAXJrP7Vognu_3t1ZSD5Tk",
  authDomain: "restrodyn.firebaseapp.com",
  projectId: "restrodyn",
  storageBucket: "restrodyn.firebasestorage.app",
  messagingSenderId: "345915017372",
  appId: "1:345915017372:web:66a317fbdbf9b0a5e4c559",
};

// Check if Firebase is configured
export function isFirebaseConfigured() {
  return firebaseConfig.apiKey !== 'YOUR_API_KEY' && firebaseConfig.projectId !== 'YOUR_PROJECT_ID';
}

let app = null;
let db = null;

if (isFirebaseConfigured()) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);

    // Enable offline persistence for Firestore
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence: Multiple tabs open, only one can enable persistence.');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence: Browser does not support IndexedDB.');
      }
    });

    console.log('🔥 Firebase initialized successfully');
  } catch (e) {
    console.error('Firebase init error:', e);
  }
} else {
  console.warn('⚠️ Firebase not configured — using localStorage fallback. See js/data/firebase-config.js');
}

export { app, db };
