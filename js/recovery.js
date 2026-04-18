/**
 * 🛠️ RestroDyn Emergency Recovery Script
 * Use this in the Browser Console (F12) to force-link your session to a specific Restaurant ID.
 * 
 * Instructions:
 * 1. Copy the code below.
 * 2. Paste into the Console of your Admin or Kitchen dashboard.
 * 3. Change 'YOUR_TARGET_ID' to the correct ID (e.g. from your Menu URL).
 * 4. Press Enter.
 */

window.restrodynRecovery = function(targetId, targetSlug) {
  const sessionData = localStorage.getItem('restrodyn_session');
  if (!sessionData) {
    console.error('❌ No active session found. Please log in first.');
    return;
  }
  
  const session = JSON.parse(sessionData);
  const updatedSession = { 
    ...session, 
    restaurantId: targetId, 
    slug: targetSlug || session.slug 
  };
  
  localStorage.setItem('restrodyn_session', JSON.stringify(updatedSession));
  console.log('✅ Identity Repaired! Reloading page...');
  setTimeout(() => window.location.reload(), 1000);
};

console.log('🏁 RestroDyn Recovery Tool Loaded.');
console.log('👉 usage: restrodynRecovery("target-id-here", "slug-here")');
