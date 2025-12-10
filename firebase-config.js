// Firebase 設定（環境変数から読み込み）
const firebaseConfig = {
  apiKey: window.FIREBASE_API_KEY,
  authDomain: window.FIREBASE_AUTH_DOMAIN,
  projectId: window.FIREBASE_PROJECT_ID,
  storageBucket: window.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: window.FIREBASE_MESSAGING_SENDER_ID,
  appId: window.FIREBASE_APP_ID,
  measurementId: window.FIREBASE_MEASUREMENT_ID
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
