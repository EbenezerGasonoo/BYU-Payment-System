// Register service worker for PWA functionality
export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // Use static URL, not cache-busted (prevents infinite loops)
      const swUrl = '/service-worker.js';

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration);

          // Only check for updates manually, not automatically
          // Remove aggressive update checking that causes loops

          // Check for updates on page focus (less aggressive)
          window.addEventListener('focus', () => {
            // Only check once per session
            if (!sessionStorage.getItem('swUpdateChecked')) {
              registration.update().catch(() => {});
              sessionStorage.setItem('swUpdateChecked', 'true');
            }
          });

          // Handle updates found
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            console.log('🔄 Service Worker update found');

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New content available - but don't auto-reload
                  console.log('🔄 New version available. Reload page to update.');
                  // Don't auto-reload - let user decide or reload on next navigation
                } else {
                  console.log('✅ Service Worker installed for the first time');
                }
              }
            });
          });
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });
    });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

// Check if app can be installed
export function checkInstallability() {
  let deferredPrompt;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing
    e.preventDefault();
    // Save the event for later
    deferredPrompt = e;
    
    // Show install button or prompt
    console.log('💡 App can be installed');
    
    // Store for later use
    window.deferredPrompt = deferredPrompt;
  });

  window.addEventListener('appinstalled', () => {
    console.log('✅ App installed successfully');
    deferredPrompt = null;
  });
}

// Request notification permission
export async function requestNotificationPermission() {
  if ('Notification' in window && 'serviceWorker' in navigator) {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('✅ Notification permission granted');
      return true;
    }
  }
  return false;
}


