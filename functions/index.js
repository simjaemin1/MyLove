const {onValueCreated} = require("firebase-functions/v2/database");
const admin = require("firebase-admin");
const webpush = require("web-push");

admin.initializeApp();

// VAPID 설정
webpush.setVapidDetails(
    "mailto:shimjaemin1@gmail.com",
    "BA2f4E796BWArflJL5ab3dlGwqHS4_8UCmEBr1aE-6QSAdH8QPVLHFHkGF8yn27tiS7YVFA4ro34ZFOKnwaODZ0",
    "Ob7h3pTDNGTsKdc4uySVUFgbRbvLDvvnYc1bupfK-eI"
);

// 새 메시지가 추가되면 푸시 알림 전송
exports.sendPushNotification = onValueCreated(
    {
      ref: "/messages/{messageId}",
      instance: "mylove-1e603-default-rtdb",
      region: "asia-southeast1",
    },
    async (event) => {
      const message = event.data.val();

      if (!message) return null;

      const senderId = message.userId || null;
      let senderName = message.name || "익명";

      // userId가 있으면 users에서 이름 가져오기
      if (senderId) {
        try {
          const userSnapshot = await admin.database()
              .ref(`users/${senderId}`).once("value");
          const userData = userSnapshot.val();
          if (userData && userData.name) {
            senderName = userData.name;
          }
        } catch (err) {
          console.error("사용자 이름 가져오기 실패:", err);
        }
      }

      const text = message.text || (message.imageUrl ? "사진" : "");
      const bodyText = text.length > 50 ?
          text.substring(0, 50) + "..." : text;

      // 1. FCM 토큰 처리
      const fcmTokensSnapshot = await admin.database()
          .ref("fcmTokens").once("value");
      const fcmTokensData = fcmTokensSnapshot.val();

      const fcmTokens = [];
      const fcmTokenKeys = [];

      if (fcmTokensData) {
        Object.entries(fcmTokensData).forEach(([key, data]) => {
          // 본인 제외
          if (senderId && data.userId === senderId) return;
          if (!senderId && data.name === senderName) return;

          fcmTokens.push(data.token);
          fcmTokenKeys.push(key);
        });
      }

      // 2. Web Push 구독 처리
      const webPushSubscriptionsSnapshot = await admin.database()
          .ref("webPushSubscriptions").once("value");
      const webPushData = webPushSubscriptionsSnapshot.val();

      const webPushSubscriptions = [];

      if (webPushData) {
        Object.entries(webPushData).forEach(([key, data]) => {
          // 본인 제외
          if (senderId && data.userId === senderId) return;
          if (!senderId && data.name === senderName) return;

          webPushSubscriptions.push(data.subscription);
        });
      }

      // FCM 메시지 전송
      if (fcmTokens.length > 0) {
        const fcmPayload = {
          data: {
            messageId: event.params.messageId,
            senderId: senderId || "",
            senderName: senderName,
            title: senderName,
            body: bodyText,
          },
        };

        console.log(`${fcmTokens.length}개의 FCM 디바이스에 알림 전송`);

        const fcmResponse = await admin.messaging().sendEachForMulticast({
          tokens: fcmTokens,
          data: fcmPayload.data,
        });

        console.log("FCM 성공:", fcmResponse.successCount);

        // 실패한 토큰 삭제
        if (fcmResponse.failureCount > 0) {
          const failedTokens = [];
          fcmResponse.responses.forEach((resp, idx) => {
            if (!resp.success) {
              failedTokens.push(fcmTokenKeys[idx]);
            }
          });

          if (failedTokens.length > 0) {
            const deletePromises = failedTokens.map((key) =>
              admin.database().ref(`fcmTokens/${key}`).remove()
            );
            await Promise.all(deletePromises);
            console.log(`${failedTokens.length}개의 유효하지 않은 FCM 토큰 삭제`);
          }
        }
      }

      // Web Push 전송 (Safari용)
      if (webPushSubscriptions.length > 0) {
        console.log(`${webPushSubscriptions.length}개의 Web Push 구독에 알림 전송`);

        const webPushPayload = JSON.stringify({
          title: senderName,
          body: bodyText,
          icon: "https://simjaemin1.github.io/MyLove/icon-192.png",
          badge: "https://simjaemin1.github.io/MyLove/icon-192.png",
          data: {
            url: "https://simjaemin1.github.io/MyLove/",
            messageId: event.params.messageId,
          },
        });

        const webPushPromises = webPushSubscriptions.map((subscription) =>
          webpush.sendNotification(subscription, webPushPayload)
              .catch((err) => {
                console.error("Web Push 전송 실패:", err);
              })
        );

        await Promise.all(webPushPromises);
        console.log("Web Push 전송 완료");
      }

      return null;
    }
);
