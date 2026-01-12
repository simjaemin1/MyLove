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
  
  // data-only 메시지에서 정보 추출 (최상위 또는 data 안)
  const title = payload.title || (payload.data && payload.data.title) || '새 메시지';
  const body = payload.body || (payload.data && payload.data.body) || '';
  
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
  console.log('=== Push 이벤트 수신 ===');
  console.log('event:', event);
  console.log('event.data:', event.data);
  
  // FCM 푸시는 onBackgroundMessage에서 처리하므로 여기서는 스킵
  // Web Push만 처리 (Safari용)
  if (!event.data) {
    console.log('Push 데이터 없음 - 기본 알림 표시');
    // 데이터 없어도 알림은 표시
    event.waitUntil(
      self.registration.showNotification('새 메시지', {
        body: '메시지가 도착했습니다',
        icon: 'https://simjaemin1.github.io/MyLove/icon-192.png',
        badge: 'https://simjaemin1.github.io/MyLove/icon-192.png',
        tag: 'chat-message'
      })
    );
    return;
  }

  let payload;
  let rawText;
  try {
    // Safari에서는 text()로 받아서 파싱하는 게 더 안정적
    rawText = event.data.text();
    console.log('Push 데이터 (text):', rawText);
    console.log('Push 데이터 길이:', rawText ? rawText.length : 0);
    
    if (!rawText || rawText.trim() === '') {
      console.log('빈 텍스트 - 기본 알림 표시');
      event.waitUntil(
        self.registration.showNotification('새 메시지', {
          body: '메시지가 도착했습니다',
          icon: 'https://simjaemin1.github.io/MyLove/icon-192.png',
          tag: 'chat-message'
        })
      );
      return;
    }
    
    payload = JSON.parse(rawText);
  } catch (err) {
    console.error('Push 데이터 파싱 실패:', err);
    console.error('rawText:', rawText);
    // 파싱 실패 시 json() 시도
    try {
      payload = event.data.json();
      console.log('json() 파싱 성공:', payload);
    } catch (err2) {
      console.error('json() 파싱도 실패:', err2);
      // 완전 실패 - 기본 알림
      event.waitUntil(
        self.registration.showNotification('새 메시지', {
          body: '메시지가 도착했습니다',
          icon: 'https://simjaemin1.github.io/MyLove/icon-192.png',
          tag: 'chat-message'
        })
      );
      return;
    }
  }

  console.log('Push payload:', payload);
  console.log('payload.title:', payload.title);
  console.log('payload.body:', payload.body);

  // FCM 메시지는 특정 구조를 가지므로 체크
  // FCM은 from, collapseKey 등의 필드가 있음
  if (payload.from || payload.fcmMessageId) {
    console.log('FCM 메시지는 onBackgroundMessage에서 처리. 스킵.');
    return;
  }

  // Web Push만 처리
  const title = payload.title || '새 메시지';
  const options = {
    body: payload.body || '메시지가 도착했습니다',
    icon: payload.icon || 'https://simjaemin1.github.io/MyLove/icon-192.png',
    badge: payload.badge || 'https://simjaemin1.github.io/MyLove/icon-192.png',
    data: payload.data || {},
    tag: 'chat-message'
  };
  
  console.log('알림 표시:', title, options.body);

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});