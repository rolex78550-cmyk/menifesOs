// Scripts for firebase and firebase-messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId
firebase.initializeApp({
  apiKey: "AIzaSyD4PEHEnO-AodC2eTzeukP3PdNQNEQbZxE",
  authDomain: "p-key-kyznn8lq7ajo.firebaseapp.com",
  projectId: "p-key-kyznn8lq7ajo",
  storageBucket: "p-key-kyznn8lq7ajo.firebasestorage.app",
  messagingSenderId: "665389713780",
  appId: "1:665389713780:web:f8eba71806152c46d0c421",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg',
    data: {
        url: '/'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
