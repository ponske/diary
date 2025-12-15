# WonderPasNavi - ディズニーランド予定作成アプリ

React Native (Expo SDK 54)を使用して作成された、ディズニーランドの1日の過ごし方をシミュレートするアプリです。

## 機能

- 🎢 アトラクション選択機能
- 🗺️ ルート最適化（距離最短・時間最短・全探索・選択順）
- 📍 地図表示機能
- ⏰ 待ち時間を考慮した時刻計算
- 💾 設定の永続化
- 📋 ルートのコピー・共有機能

## セットアップ

1. 依存関係のインストール
```bash
cd wpn-5-composer
npm install
```

2. アプリの起動
```bash
npm start
```

または、EMFILEエラーを防ぐために推奨される起動方法:
```bash
./start-fixed.sh
```

または、iOS/Androidで直接起動:
```bash
npm run ios
npm run android
```

## スマホでの起動方法

1. **Expo Goアプリをインストール**
   - iOS: App Storeから「Expo Go」をインストール
   - Android: Google Play Storeから「Expo Go」をインストール
   - **重要**: Expo GoはSDK 54に対応している必要があります

2. **アプリを起動**
   ```bash
   npm start
   ```
   または
   ```bash
   ./start-fixed.sh
   ```

3. **QRコードをスキャン**
   - ターミナルに表示されるQRコードをExpo Goアプリでスキャン
   - または、同じWi-Fiネットワークに接続している場合、自動的に検出されます

## EMFILEエラーが発生した場合

大きなJSONファイル（`waiting_times.json`）が原因でEMFILEエラーが発生する場合：

1. **推奨される起動方法を使用**:
```bash
./start-fixed.sh
```

2. **または、手動でクリアして起動**:
```bash
watchman watch-del-all
ulimit -n 4096
npx expo start --clear
```

詳細は `TROUBLESHOOTING.md` を参照してください。

## 注意事項

- `attractions.json` と `waiting_times.json` は`assets/data/`フォルダに配置されています
- アプリはオフラインで動作します（ネットワーク接続不要）
- 地図表示には `react-native-maps` を使用しています（iOS/Androidで動作）
- 大きなJSONファイルは`.watchmanconfig`で監視対象から除外されています
- Expo SDK 54を使用しています（Expo GoアプリもSDK 54が必要です）

## プロジェクト構造

```
wpn-5-composer/
├── App.js                    # メインアプリコンポーネント
├── src/
│   ├── components/          # 再利用可能なコンポーネント
│   │   ├── AttractionCard.js
│   │   └── LoadingSpinner.js
│   ├── models/              # データモデル
│   │   ├── Attraction.js
│   │   └── RouteItem.js
│   ├── screens/             # 画面コンポーネント
│   │   ├── AttractionSelectionScreen.js
│   │   ├── RouteSettingsScreen.js
│   │   ├── RouteResultScreen.js
│   │   └── SettingsScreen.js
│   ├── services/            # ビジネスロジック
│   │   ├── RouteOptimizer.js
│   │   └── DataLoader.js
│   └── utils/               # ユーティリティ関数
│       ├── distance.js
│       ├── time.js
│       └── storage.js
├── assets/
│   └── data/
│       ├── attractions.json         # アトラクションデータ
│       └── waiting_times.json       # 待ち時間データ
└── app.json                  # Expo設定
```

## 使用方法

1. **アトラクション選択**
   - アトラクション一覧から行きたいアトラクションを選択
   - 優先度（高・中・低）を設定して選択

2. **ルート設定**
   - 開始時刻と退園時刻を設定
   - 最適化方法を選択（時間最短・距離最短・全探索・選択順）

3. **ルート結果確認**
   - 最適化されたルートを確認
   - 地図上でルートを確認
   - ルートをコピーまたは共有

## 技術スタック

- React Native 0.81.5
- Expo SDK 54
- React Navigation
- React Native Maps
- AsyncStorage
- Linear Gradient

## ライセンス

このプロジェクトは個人利用を目的としています。
