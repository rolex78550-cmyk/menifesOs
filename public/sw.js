// ManifestOS / Vibe OS Background Service Worker for Ritual Reminders
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

let registeredHabits = [];

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_HABITS') {
    registeredHabits = event.data.habits || [];
  }
});

// Resilient background interval checking for precise minute alarms
setInterval(() => {
  const now = new Date();
  
  // Format as HH:mm matching formatTimeHHMM in App.tsx
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${hours}:${minutes}`;

  registeredHabits.forEach(habit => {
    if (!habit.completed && habit.reminderTime === currentTime) {
      const cacheKey = `notified_${habit.id}_${currentTime}`;
      
      // Prevent duplicate notification within the same minute span
      // Use local variable with timeout to clear cache so it can trigger tomorrow
      if (self[cacheKey]) return;
      self[cacheKey] = true;
      
      // Auto cleanup cache after 70 seconds to allow next day trigger
      setTimeout(() => {
        delete self[cacheKey];
      }, 70000);

      // Send local notification immediately
      self.registration.showNotification(`⚡ Ritual Time: ${habit.name}`, {
        body: `Usi time pe, exact reminder! Ritual start kigiye: "${habit.name}". Align your frequency now.`,
        vibrate: [400, 150, 400, 150, 500],
        icon: '/vite.svg',
        tag: `ritual-alarm-${habit.id}-${currentTime}`,
        requireInteraction: true,
        data: { url: '/', playKaching: true, habitId: habit.id }
      });
    }
  });
}, 10000); // Check every 10 seconds for higher background reliability

// Deep Link / Focus on main application when notification is clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a tab is already open, focus it
      for (const client of clientList) {
        if ('focus' in client) {
          // Tell client to trigger kaching sound on focusing back
          try {
            client.postMessage({ type: 'PLAY_KACHING_FROM_BG', habitId: event.notification.data?.habitId });
          } catch (e) {}
          return client.focus();
        }
      }
      // If no tab is open, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
