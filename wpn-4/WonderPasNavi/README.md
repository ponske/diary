# WonderPasNavi

東京ディズニーランドの1日の過ごし方をシミュレーションするReact Native (Expo)アプリです。

## 機能

### 主要機能
- **アトラクション選択**: 行きたいアトラクションを優先度付きで選択
- **ルート最適化**: 4つの最適化方法から選択可能
  - 距離最短ルート（最近傍法）
  - 時間最短ルート（待ち時間を考慮した貪欲法）
  - ユーザー入力順
  - 全探索（10件以下の場合、真の最短時間ルート）
- **時間設定**: 開始時刻と退園時刻の設定
- **ルート結果表示**: 各アトラクションの到着/出発時刻、待ち時間、体験時間を表示
- **地図表示**: ルートを地図上に可視化（アニメーション付き）
- **エクスポート機能**: ルートをテキストでコピー・共有
- **設定機能**: 歩行速度、デフォルト最適化方法などをカスタマイズ

### 技術的特徴
- オフライン動作（ネットワーク接続不要）
- アプリ内にJSONデータを同梱
- ローカルストレージで設定を永続化
- Haversine公式による距離計算
- 待ち時間の時系列データに基づく精密な計算

## セットアップ

### 前提条件
- Node.js (v18以上)
- npm または yarn
- Expo CLI
- iOS Simulator (Mac) または Android Emulator

### インストール

```bash
cd wpn-4/WonderPasNavi
npm install
```

### 実行

#### iOS
```bash
npx expo start --ios
```

#### Android
```bash
npx expo start --android
```

#### Web
```bash
npx expo start --web
```

#### 開発モード
```bash
npm start
```

その後、Expo Goアプリでスキャンして実行するか、エミュレータで実行します。

## データファイル

アプリは以下のJSONファイルを使用します：

### `src/data/attractions.json`
アトラクションの基本情報（座標、エリア名など）

### `src/data/waiting_times.json`
待ち時間の時系列データ

## プロジェクト構造

```
WonderPasNavi/
├── App.tsx                      # メインアプリケーション
├── src/
│   ├── types/
│   │   └── index.ts            # 型定義
│   ├── data/
│   │   ├── attractions.json    # アトラクションデータ
│   │   └── waiting_times.json  # 待ち時間データ
│   ├── utils/
│   │   ├── distance.ts         # 距離計算
│   │   └── routeOptimizer.ts   # ルート最適化アルゴリズム
│   ├── services/
│   │   ├── DataLoader.ts       # データ読み込み
│   │   └── StorageService.ts   # ローカルストレージ
│   ├── screens/
│   │   ├── AttractionSelectionScreen.tsx  # アトラクション選択画面
│   │   ├── RouteSettingsScreen.tsx        # ルート設定画面
│   │   ├── RouteResultScreen.tsx          # ルート結果画面
│   │   ├── MapScreen.tsx                  # 地図表示画面
│   │   └── SettingsScreen.tsx             # 設定画面
│   └── components/
│       ├── AttractionCard.tsx             # アトラクションカード
│       ├── PrioritySelector.tsx           # 優先度選択
│       ├── RouteItemCard.tsx              # ルートアイテムカード
│       └── LoadingSpinner.tsx             # キラキラスピナー（全探索時）
├── package.json
└── README.md
```

## アルゴリズム

### 距離計算
Haversine公式を使用して、2点間の地球上の距離を計算します。

### ルート最適化

#### 1. 距離最短ルート（最近傍法）
- パーク入り口に最も近いアトラクションから開始
- 現在地から最も近い未訪問アトラクションを順次選択

#### 2. 時間最短ルート（貪欲法）
- 移動時間 + 待ち時間 + 体験時間の合計が最小となるアトラクションを順次選択
- 到着時刻に応じた待ち時間を動的に取得

#### 3. ユーザー入力順
- ユーザーが選択した順番通りに訪問

#### 4. 全探索
- 10件以下の場合のみ有効
- 全ての順列を計算し、真の最短時間ルートを発見
- 計算中はキラキラするアニメーション付きスピナーを表示

## 設定

### 歩行速度
- 車椅子: 60m/分
- 標準: 80m/分
- 早歩き: 100m/分

### デフォルト時刻
- 開始時刻: 09:00
- 閉園時刻: 21:00

## 注意事項

### Google Maps APIキー
地図機能を使用するには、Google Maps APIキーが必要です。
`app.json`の`android.config.googleMaps.apiKey`を設定してください。

### データ更新
待ち時間データは定期的に更新する必要があります。
データ更新はアプリのアップデートとして配信されます。

## ライセンス

このアプリは個人利用およびデモ目的で作成されています。

## 作成者

このアプリは仕様書 `wpn-4/prompt-1.md` に基づいて作成されました。
