# WonderPasNavi - ディズニーランド1日シミュレーションアプリ

このディレクトリには、React Native (Expo) で実装されたディズニーランドの1日の過ごし方をシミュレーションするアプリが含まれています。

## 📁 ディレクトリ構成

```
wpn-4/
├── README.md                    # このファイル
├── prompt-1.md                  # アプリの仕様書
├── attractions.json             # アトラクション基本データ
├── waiting_times.json           # 待ち時間データ
└── WonderPasNavi/              # メインアプリケーション
    ├── App.tsx                 # メインアプリ
    ├── README.md               # 詳細な使用方法
    ├── PROJECT_SUMMARY.md      # プロジェクト概要
    ├── app.json                # Expo設定
    ├── package.json            # 依存関係
    └── src/                    # ソースコード
        ├── types/              # TypeScript型定義
        ├── data/               # JSONデータ
        ├── utils/              # ユーティリティ
        ├── services/           # サービス層
        ├── screens/            # 画面コンポーネント
        └── components/         # UIコンポーネント
```

## 🚀 クイックスタート

### 1. アプリディレクトリに移動
```bash
cd WonderPasNavi
```

### 2. 依存関係をインストール
```bash
npm install
```

### 3. アプリを起動
```bash
# iOS
npx expo start --ios

# Android
npx expo start --android

# Web
npx expo start --web
```

## 📱 機能一覧

### ✅ 実装済み機能

1. **アトラクション選択**
   - 43のアトラクションから選択可能
   - 優先度（高・中・低）の設定
   - 検索・フィルタ機能

2. **ルート最適化**
   - 距離最短ルート（最近傍法）
   - 時間最短ルート（待ち時間考慮）
   - ユーザー入力順
   - 全探索（10件以下）

3. **時間設定**
   - 開始時刻設定（09:00-21:00）
   - 退園時刻設定（閉園まで/時刻指定）
   - 閉園時刻超過の警告

4. **ルート結果表示**
   - 各アトラクションの到着/出発時刻
   - 待ち時間・体験時間の表示
   - 移動距離・総時間の統計

5. **地図表示**
   - ルートの可視化
   - アニメーション付きルート描画
   - 優先度別のピン色分け

6. **エクスポート・共有**
   - クリップボードへのコピー
   - SNS共有機能

7. **設定機能**
   - 言語設定（日本語/英語）
   - 歩行速度設定（車椅子/標準/早歩き）
   - デフォルト最適化方法
   - 設定の永続化

## 📊 データ

### アトラクションデータ (`attractions.json`)
- 43施設の座標情報
- エリア名
- 公式ID

### 待ち時間データ (`waiting_times.json`)
- 実際の待ち時間の時系列データ
- 2025年12月のデータを含む
- 時刻別の待ち時間推移

## 🛠 技術仕様

### フレームワーク
- React Native 0.81.5
- Expo SDK 54
- TypeScript 5.9

### 主要ライブラリ
- react-native-maps
- @react-native-async-storage/async-storage
- expo-clipboard
- expo-sharing
- expo-location

### アルゴリズム
- Haversine公式による距離計算
- 最近傍法（距離最短）
- 貪欲法（時間最短）
- 全探索（10!通りの順列計算）

## 📖 詳細ドキュメント

詳しい使用方法や実装の詳細については、以下のファイルを参照してください：

- **仕様書**: `prompt-1.md`
- **アプリ使用方法**: `WonderPasNavi/README.md`
- **プロジェクト概要**: `WonderPasNavi/PROJECT_SUMMARY.md`

## ⚠️ 注意事項

### Google Maps API（Android）
Androidで地図機能を使用する場合、Google Maps APIキーが必要です。
`WonderPasNavi/app.json`を編集してAPIキーを設定してください。

### データ更新
待ち時間データは定期的に更新する必要があります。
最新のデータに更新する場合は、`waiting_times.json`を置き換えてください。

## 🎯 開発状況

### ✅ 完了
- [x] プロジェクト初期化
- [x] 型定義
- [x] データローダー
- [x] 距離計算・ルート最適化
- [x] 全画面の実装
- [x] 設定機能
- [x] エクスポート機能
- [x] TypeScript型チェック

### 今後の拡張可能性
- [ ] 休憩機能のUI実装
- [ ] 疲労度グラフ
- [ ] パレード/ショー対応
- [ ] ディズニーシー対応
- [ ] ログイン機能
- [ ] ルート保存機能

## 📝 ライセンス

このアプリケーションは、個人利用およびデモ目的で作成されています。

## 👤 作成

仕様書 `prompt-1.md` に基づいて実装されました。
