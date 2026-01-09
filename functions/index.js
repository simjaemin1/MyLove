const {onValueCreated} = require("firebase-functions/v2/database");
const admin = require("firebase-admin");

admin.initializeApp();

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

      const senderName = message.name || "익명";
      const senderId = message.userId || null;
      const text = message.text || (message.imageUrl ? "사진" : "");

      // 모든 FCM 토큰 가져오기
      const tokensSnapshot = await admin.database()
          .ref("fcmTokens").once("value");
      const tokensData = tokensSnapshot.val();

      if (!tokensData) {
        console.log("등록된 토큰이 없습니다.");
        return null;
      }

      const tokens = [];
      const tokenKeys = [];

      Object.entries(tokensData).forEach(([key, data]) => {
        // 로그인 사용자: userId로 체크
        if (senderId && data.userId === senderId) {
          return;
        }
        // 비로그인 사용자: name으로 체크
        if (!senderId && data.name === senderName) {
          return;
        }
        tokens.push(data.token);
        tokenKeys.push(key);
      });

      if (tokens.length === 0) {
        console.log("알림을 받을 사용자가 없습니다.");
        return null;
      }

      const bodyText = text.length > 50 ?
          text.substring(0, 50) + "..." : text;

      const payload = {
        notification: {
          title: senderName,
          body: bodyText,
        },
        data: {
          messageId: event.params.messageId,
          senderId: senderId || "",
          senderName: senderName,
        },
      };

      console.log(`${tokens.length}개의 디바이스에 알림 전송`);

      const response = await admin.messaging().sendEachForMulticast({
        tokens: tokens,
        notification: payload.notification,
        data: payload.data,
      });

      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errorCode = resp.error && resp.error.code;
            const invalid = "messaging/invalid-registration-token";
            const notReg = "messaging/registration-token-not-registered";
            if (errorCode === invalid || errorCode === notReg) {
              failedTokens.push(tokenKeys[idx]);
            }
          }
        });

        const deletePromises = failedTokens.map((key) =>
          admin.database().ref(`fcmTokens/${key}`).remove(),
        );
        await Promise.all(deletePromises);
        console.log(`${failedTokens.length}개의 유효하지 않은 토큰 삭제`);
      }

      console.log(`성공: ${response.successCount}`);
      return null;
    },
);
