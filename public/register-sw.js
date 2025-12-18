/**
 * Service Worker Registration for Silent Updates
 * Helps manage cache and enables background updates
 */

// Only register service worker in production
if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
  window.addEventListener('load', async () => {
    try {
      // Unregister any existing service workers first
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
      
      console.log('Service workers cleared for fresh updates');
    } catch (error) {
      console.warn('Failed to clear service workers:', error);
    }
  });
}

// Clear caches on page load to ensure fresh content
window.addEventListener('load', async () => {
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('Browser caches cleared');
    } catch (error) {
      console.warn('Failed to clear caches:', error);
    }
  }
});