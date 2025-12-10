# Firebase設定手順

## 1. Firebaseコンソールでの設定

### 1.1 匿名認証を有効にする

1. Firebaseコンソール（https://console.firebase.google.com/）にアクセス
2. プロジェクト「pastel-dairy-notebook」を選択
3. 左メニューから「Authentication」を選択
4. 「Sign-in method」タブを開く
5. 「匿名」を選択して有効にする（Enable）

### 1.2 Firestoreセキュリティルールを設定

1. Firebaseコンソールで「Firestore Database」を選択
2. 「ルール」タブを開く
3. 以下のルールを設定して「公開」をクリック：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // waiting_timesコレクション: 誰でも読み取り可能
    match /waiting_times/{document} {
      allow read: if true;  // 誰でも読み取り可能
      allow write: if false;  // 書き込みは不可（Admin SDKからのみ）
    }
    
    // その他のコレクションは既存のルールに従う
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 2. バッチスクリプトの設定

### 2.1 Firebaseサービスアカウントキーの取得

1. Firebaseコンソールで「プロジェクトの設定」を開く
2. 「サービスアカウント」タブを選択
3. 「新しい秘密鍵の生成」をクリック
4. ダウンロードしたJSONファイルを `WonderPasNavi/batch/firebase-credentials.json` として保存

### 2.2 バッチスクリプトの実行

```bash
# 5分おきに実行（タスクスケジューラに登録推奨）
cd WonderPasNavi/batch
python sync_to_firebase.py --loop
```

## 3. トラブルシューティング

### 権限エラーが発生する場合

- Firestoreのセキュリティルールが正しく設定されているか確認
- 匿名認証が有効になっているか確認
- ブラウザのコンソールでエラーメッセージを確認

### データが表示されない場合

- バッチスクリプトが正常に実行されているか確認
- FirebaseコンソールのFirestoreでデータが存在するか確認
- ブラウザのコンソールでエラーメッセージを確認




