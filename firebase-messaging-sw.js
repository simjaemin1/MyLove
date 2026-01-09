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

// FCM이 자동으로 알림을 표시하므로 onBackgroundMessage 불필요
// Cloud Functions에서 notification 필드를 보내면 자동 표시됨

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/MyLove/')
  );
});