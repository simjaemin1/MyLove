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

// skipWaiting 메시지 처리
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 백그라운드 메시지 처리 (data-only)
messaging.onBackgroundMessage(async (payload) => {
  console.log('백그라운드 메시지:', payload);
  console.log('payload.data:', payload.data);
  
  // data-only 메시지에서 정보 추출
  const title = (payload.data && payload.data.title) || '새 메시지';
  const body = (payload.data && payload.data.body) || '';
  
  console.log('알림 title:', title);
  console.log('알림 body:', body);
  
  const options = {
    body: body,
    icon: 'https://simjaemin1.github.io/MyLove/icon-192.png',
    badge: 'https://simjaemin1.github.io/MyLove/icon-192.png',
    data: payload.data,
    tag: 'chat-message'
  };

  return self.registration.showNotification(title, options);
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/MyLove/';
  event.waitUntil(
    clients.openWindow(url)
  );
});

// 표준 Web Push 이벤트 처리 (Safari용)
self.addEventListener('push', (event) => {
  console.log('표준 Push 이벤트 수신:', event);
  
  if (!event.data) {
    console.log('Push 데이터 없음');
    return;
  }

  let payload;
  try {
    payload = event.data.json();
  } catch (err) {
    console.error('Push 데이터 파싱 실패:', err);
    return;
  }

  console.log('Push payload:', payload);

  const title = payload.title || '새 메시지';
  const options = {
    body: payload.body || '',
    icon: payload.icon || 'https://simjaemin1.github.io/MyLove/icon-192.png',
    badge: payload.badge || 'https://simjaemin1.github.io/MyLove/icon-192.png',
    data: payload.data || {},
    tag: 'chat-message'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});