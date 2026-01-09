importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDVn1_utqTMBFOXnGNAt78i1LH8nH9AWjs",
  authDomain: "mylove-1e603.firebaseapp.com",
  projectId: "mylove-1e603",
  storageBucket: "mylove-1e603.firebasestorage.app",
  messagingSenderId: "28187724372",
  appId: "1:28187724372:web:8bd8796f047482c848bbc1"
});

const messaging = firebase.messaging();

// 백그라운드 메시지 처리
messaging.onBackgroundMessage((payload) => {
  console.log('백그라운드 메시지:', payload);
  
  const title = (payload.notification && payload.notification.title) || '새 메시지';
  const options = {
    body: (payload.notification && payload.notification.body) || '',
    icon: 'https://simjaemin1.github.io/MyLove/icon-192.png',
    badge: 'https://simjaemin1.github.io/MyLove/icon-192.png',
    data: payload.data
  };

  return self.registration.showNotification(title, options);
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/MyLove/')
  );
});