# アセットファイルについて

このディレクトリには、WonderPasNaviアプリで使用する画像とデータファイルが格納されています。

## 必要なアセットファイル

### 1. icon.png
- **サイズ**: 1024x1024 px
- **形式**: PNG（透過背景可）
- **用途**: アプリのホーム画面アイコン
- **推奨**: 角丸は不要（iOSが自動的に角丸にします）

### 2. splash.png
- **サイズ**: 1242x2436 px（iPhone用標準サイズ）
- **形式**: PNG
- **用途**: アプリ起動時のスプラッシュ画面
- **背景色**: 白（#FFFFFF）推奨

### 3. adaptive-icon.png
- **サイズ**: 1024x1024 px
- **形式**: PNG（透過背景可）
- **用途**: Android用アダプティブアイコン
- **注意**: 中央の512x512px領域にメインコンテンツを配置

### 4. favicon.png
- **サイズ**: 48x48 px
- **形式**: PNG
- **用途**: Web版のファビコン

## プレースホルダーの作成方法

現在、実際の画像ファイルがない場合は、以下のコマンドでプレースホルダーを作成できます：

### macOS/Linuxの場合

```bash
# プレースホルダーの作成（ImageMagickが必要）
# インストール: brew install imagemagick

# アプリアイコン
convert -size 1024x1024 xc:green -pointsize 72 -fill white -gravity center \
  -annotate +0+0 "WPN" icon.png

# スプラッシュ画面
convert -size 1242x2436 xc:white -pointsize 144 -fill green -gravity center \
  -annotate +0+0 "WonderPasNavi" splash.png

# アダプティブアイコン
convert -size 1024x1024 xc:green -pointsize 72 -fill white -gravity center \
  -annotate +0+0 "WPN" adaptive-icon.png

# ファビコン
convert -size 48x48 xc:green -pointsize 24 -fill white -gravity center \
  -annotate +0+0 "W" favicon.png
```

### オンラインツールを使用する場合

1. **Canva** (https://www.canva.com/)
   - 無料で使用可能
   - テンプレートが豊富

2. **Figma** (https://www.figma.com/)
   - デザインツール
   - 無料プランあり

3. **Photoshop** / **GIMP**
   - プロフェッショナルツール

## データファイル

### data/attractions.json
アトラクションの基本情報を格納するJSONファイル。

**必須フィールド**:
- `id`: 一意の数値ID
- `name`: アトラクション名
- `official_id`: 公式識別子
- `entrance_lat`, `entrance_lng`: 入口の緯度経度
- `area_name`: エリア名
- `genre`: ジャンル
- `icon`: 絵文字アイコン
- `duration_minutes`: 体験時間
- `is_seated`: 座れるか
- `is_active`: 有効か
- `is_invalid`: 無効フラグ

### data/waiting_times.json
時刻別の待ち時間データを格納するJSONファイル。

**必須フィールド**:
- `attr_id`: アトラクションの識別子（attractions.jsonのofficial_idと対応）
- `waiting_minutes`: 代表的な待ち時間
- `updated_at`: 更新日時
- `time_series`: 時刻別の待ち時間配列

## アイコンデザインのガイドライン

### カラースキーム

アプリのメインカラー:
- プライマリ: #4CAF50（グリーン）
- セカンダリ: #2196F3（ブルー）
- アクセント: #FF6B6B（レッド）

### デザインのヒント

1. **シンプルさを保つ**: 小さいサイズでも認識できるデザイン
2. **ブランディング**: ディズニーをイメージさせつつも非公式であることを明示
3. **カラフル**: 楽しさを表現
4. **アイコン要素**: 地図、ルート、城、アトラクションなどを含める

### 参考デザイン要素

- 🗺️ 地図
- 🏰 城
- 🎢 ジェットコースター
- 📍 ピン/マーカー
- 🧭 コンパス
- ✨ 魔法のエフェクト

## ライセンスと著作権

- アプリアイコンやスプラッシュ画面は、自作またはライセンスフリーの素材を使用してください
- ディズニーの公式ロゴや商標は使用しないでください
- このアプリは非公式であり、株式会社オリエンタルランドとは無関係です

## アセットの更新

新しいアセットファイルを作成したら、このディレクトリに配置するだけで自動的に反映されます。

```bash
# アプリを再起動
expo start -c
```

---

素敵なアイコンを作成して、アプリをもっと魅力的にしましょう！🎨
