# WonderPasNavi - ディズニーランド ルート最適化アプリ

React Native (Expo) を使用した、東京ディズニーランドのアトラクション回遊ルートを最適化するiOSアプリです。

## 概要

WonderPasNaviは、ユーザーが訪れたいアトラクションを選択すると、待ち時間や移動距離を考慮した最適な回り方を提案するアプリです。

### 主な機能

- **アトラクション選択**: 12種類のアトラクションから訪れたいものを選択
- **優先度設定**: 各アトラクションに優先度（高・中・低）を設定可能
- **3つの最適化方法**:
  - 距離最短: 移動距離を最小化
  - 時間最短: 待ち時間を考慮した総時間を最小化
  - 選択順: ユーザーが選んだ順番で回る
- **時間設定**: 開始時刻と退園時刻を指定可能
- **ルート結果表示**: 
  - 各アトラクションの到着・出発時刻
  - 待ち時間と体験時間
  - 総移動距離
- **地図表示**: ルートを地図上で視覚的に確認
- **クリップボードコピー**: ルート情報をテキストとしてコピー

### オフライン動作

このアプリはオフライン前提で設計されており、すべてのデータ（アトラクション情報、待ち時間データ）はアプリ内に同梱されています。ネットワーク接続は不要です。

## システム要件

- Node.js 16以上
- npm または yarn
- Expo CLI
- iOS開発環境（iOSシミュレータまたは実機）
- macOS（iOS開発の場合）

## セットアップ手順

### 1. リポジトリのクローン

```bash
cd wpn-3-claude
```

### 2. 依存パッケージのインストール

```bash
npm install
```

または

```bash
yarn install
```

### 3. アセットの準備

以下のアセットファイルを配置してください：

- `assets/icon.png` (1024x1024px): アプリアイコン
- `assets/splash.png` (1242x2436px): スプラッシュ画面
- `assets/adaptive-icon.png` (1024x1024px): Androidアダプティブアイコン
- `assets/favicon.png` (48x48px): Web用ファビコン

**注**: 現在はプレースホルダーファイルが配置されています。必要に応じて実際の画像に差し替えてください。

### 4. アプリの起動

#### iOSシミュレータで起動

```bash
npm run ios
```

または

```bash
expo start --ios
```

#### Androidエミュレータで起動

```bash
npm run android
```

または

```bash
expo start --android
```

#### Expo Goアプリを使用（実機テスト）

```bash
npm start
```

または

```bash
expo start
```

起動後、表示されるQRコードをExpo Goアプリでスキャンしてください。

## プロジェクト構成

```
wpn-3-claude/
├── App.tsx                 # メインアプリケーション、ナビゲーション設定
├── app.json               # Expo設定
├── package.json           # 依存パッケージ管理
├── tsconfig.json          # TypeScript設定
├── babel.config.js        # Babel設定
├── assets/               # アセットファイル
│   ├── data/            # JSONデータファイル
│   │   ├── attractions.json      # アトラクション情報
│   │   └── waiting_times.json    # 待ち時間データ
│   ├── icon.png
│   ├── splash.png
│   ├── adaptive-icon.png
│   └── favicon.png
└── src/
    ├── types/
    │   └── Models.ts            # TypeScript型定義
    ├── utils/
    │   ├── distance.ts          # 距離計算（Haversine公式）
    │   ├── timeUtils.ts         # 時刻関連のユーティリティ
    │   └── routeOptimizer.ts    # ルート最適化アルゴリズム
    ├── services/
    │   └── DataLoader.ts        # JSONデータローダー
    └── screens/
        ├── AttractionSelectionScreen.tsx  # アトラクション選択画面
        ├── RouteResultScreen.tsx          # ルート結果表示画面
        └── MapScreen.tsx                  # 地図表示画面
```

## データ構造

### attractions.json

アトラクションの基本情報を格納：

```json
{
  "id": 1,
  "name": "アトラクション名",
  "official_id": "識別子",
  "entrance_lat": 35.6329,
  "entrance_lng": 139.8804,
  "area_name": "エリア名",
  "genre": "ride",
  "icon": "🎢",
  "duration_minutes": 5,
  "is_seated": true,
  "is_active": true,
  "is_invalid": false
}
```

### waiting_times.json

時刻別の待ち時間データを格納：

```json
{
  "attr_id": "識別子",
  "waiting_minutes": 30,
  "updated_at": "2025-12-13T10:00:00+09:00",
  "time_series": [
    {
      "timestamp": "2025-12-13T09:00:00+09:00",
      "waiting_minutes": 10
    }
  ]
}
```

## アルゴリズム

### 距離最短ルート（最近傍法）

1. 選択されたアトラクションを優先度順（高→中→低）にソート
2. 各優先度グループ内で、最近傍法を適用
3. 現在地から最も近いアトラクションを次の訪問先とする

### 時間最短ルート

1. 選択されたアトラクションを優先度順にソート
2. 各ステップで、「移動時間 + 待ち時間 + 体験時間」の合計が最小になるアトラクションを選択
3. 到着予定時刻に最も近い待ち時間データを使用

### 距離計算（Haversine公式）

緯度経度から実際の地球上の距離（メートル）を計算します。

- 地球半径: 6,371,000m
- 歩行速度: 80m/分（デフォルト）
- 移動時間は切り上げ

## カスタマイズ

### アトラクションデータの追加

`assets/data/attractions.json` に新しいアトラクションを追加できます。必須フィールド：

- `id`: 一意の数値ID
- `name`: アトラクション名
- `official_id`: 公式識別子（待ち時間データと紐付け）
- `entrance_lat`, `entrance_lng`: 入口の緯度経度
- `area_name`: エリア名
- `genre`: ジャンル（ride, coaster, theater, greeting, restaurant, walking, other）
- `icon`: 絵文字アイコン
- `duration_minutes`: 体験時間（分）
- `is_seated`: 座れる施設か（true/false）
- `is_active`: 有効なアトラクションか（true/false）
- `is_invalid`: 無効フラグ（true/false）

### 待ち時間データの更新

`assets/data/waiting_times.json` を編集して、待ち時間データを更新できます。

## トラブルシューティング

### 依存パッケージのエラー

```bash
# node_modulesを削除して再インストール
rm -rf node_modules
npm install
```

### Expo Cacheのクリア

```bash
expo start -c
```

### iOSシミュレータが起動しない

```bash
# Xcodeが正しくインストールされているか確認
xcode-select --install
```

### 地図が表示されない

- `app.json`の`ios.infoPlist`に位置情報の権限設定が必要です（既に設定済み）
- iOS実機の場合、位置情報サービスが有効になっているか確認してください

## 今後の拡張予定

- [ ] 日付別の待ち時間データ対応
- [ ] 休憩ポイントの追加機能
- [ ] ディズニーシー対応
- [ ] 英語対応
- [ ] レストラン予約時間の考慮
- [ ] ショー鑑賞時間の組み込み
- [ ] パレード時間の考慮

## ライセンス

このプロジェクトは教育・研究目的で作成されています。

## 注意事項

- このアプリは非公式であり、株式会社オリエンタルランドとは一切関係ありません
- 待ち時間データはサンプルデータです
- 実際のパーク運営状況とは異なる場合があります
- アトラクションの位置情報は概算値です

## 開発者向け情報

### TypeScriptの型チェック

```bash
npx tsc --noEmit
```

### ビルド（iOS）

```bash
expo build:ios
```

### ビルド（Android）

```bash
expo build:android
```

## サポート

問題が発生した場合は、GitHubのIssuesセクションで報告してください。

---

**WonderPasNavi** - あなたのディズニーランド体験を最適化します 🎢✨
