// Firebase 設定（ユーザー固有の値）
const firebaseConfig = {
  apiKey: "AIzaSyAUs-5nOz1Kez9LIgwpzldbwIL0h7iU4Z0",
  authDomain: "pastel-dairy-notebook.firebaseapp.com",
  projectId: "pastel-dairy-notebook",
  storageBucket: "pastel-dairy-notebook.firebasestorage.app",
  messagingSenderId: "707021237886",
  appId: "1:707021237886:web:eb43ec8bc5c30d7a3db22f",
  measurementId: "G-WN25RPR8KS"
};

// Firebase SDKが読み込まれるまで待機して初期化
(function() {
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDKが読み込まれていません');
        return;
    }
    
    try {
        // 互換 API で初期化
        firebase.initializeApp(firebaseConfig);

        // よく使うサービスをグローバルに
        const auth = firebase.auth();
        const db   = firebase.firestore();

        // グローバルスコープに公開（route-optimizer.htmlから使用するため）
        window.auth = auth;
        window.db = db;
    } catch (error) {
        console.error('Firebase初期化エラー:', error);
    }
})();
