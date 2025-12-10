// Firebase 設定（環境変数から読み込み）
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || window.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || window.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID || window.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || window.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || window.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID || window.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || window.FIREBASE_MEASUREMENT_ID
};

// Firebase SDKが読み込まれるまで待機して初期化
(function() {
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDKが読み込まれていません');
        return;
    }
    
    try {
        firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();
        const db   = firebase.firestore();
        window.auth = auth;
        window.db = db;
    } catch (error) {
        console.error('Firebase初期化エラー:', error);
    }
})();
