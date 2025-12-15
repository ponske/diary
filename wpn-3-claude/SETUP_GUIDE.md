# WonderPasNavi セットアップガイド

このドキュメントでは、WonderPasNaviアプリの初回セットアップから起動までの詳細な手順を説明します。

## 前提条件

### 必須ソフトウェア

1. **Node.js** (v16.x 以上)
   - [https://nodejs.org/](https://nodejs.org/) からダウンロード
   - インストール確認: `node --version`

2. **npm** または **yarn**
   - Node.jsと一緒にインストールされます
   - 確認: `npm --version` または `yarn --version`

3. **Expo CLI**
   ```bash
   npm install -g expo-cli
   ```
   確認: `expo --version`

### iOS開発の場合（追加）

4. **Xcode** (macOSのみ)
   - Mac App Storeからインストール
   - Command Line Toolsのインストール:
     ```bash
     xcode-select --install
     ```

5. **iOS Simulator**
   - Xcodeに含まれています
   - Xcode > Preferences > Components からダウンロード

### Android開発の場合（追加）

6. **Android Studio**
   - [https://developer.android.com/studio](https://developer.android.com/studio) からダウンロード
   - Android SDK、AVD（Android Virtual Device）をセットアップ

## ステップバイステップ セットアップ

### ステップ 1: プロジェクトディレクトリへ移動

```bash
cd /path/to/wpn-3-claude
```

### ステップ 2: 依存パッケージのインストール

```bash
npm install
```

**予想所要時間**: 3-5分

インストール中に警告が表示される場合がありますが、通常は問題ありません。

### ステップ 3: アセットファイルの確認

以下のディレクトリに必要なファイルが存在することを確認してください：

```
assets/
├── icon.png              # アプリアイコン
├── splash.png            # スプラッシュ画面
├── adaptive-icon.png     # Androidアイコン
├── favicon.png           # Webアイコン
└── data/
    ├── attractions.json      # アトラクションデータ
    └── waiting_times.json    # 待ち時間データ
```

**注**: アイコン画像は現在プレースホルダーです。実際の画像に差し替える場合は、指定されたサイズで作成してください。

### ステップ 4: アプリの起動

#### 方法A: Expo Goアプリを使用（推奨・最も簡単）

1. スマートフォンにExpo Goアプリをインストール
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. 開発サーバーを起動
   ```bash
   npm start
   ```
   または
   ```bash
   expo start
   ```

3. 表示されるQRコードをスキャン
   - iOS: カメラアプリでスキャン
   - Android: Expo Goアプリ内でスキャン

#### 方法B: iOSシミュレータで起動（macOSのみ）

```bash
npm run ios
```

初回起動時は、シミュレータのビルドに時間がかかります（5-10分程度）。

#### 方法C: Androidエミュレータで起動

1. Android Studioを起動し、AVDを作成・起動

2. プロジェクトを起動
   ```bash
   npm run android
   ```

### ステップ 5: 動作確認

アプリが正常に起動したら、以下を確認してください：

1. **アトラクション選択画面**が表示される
2. 12種類のアトラクションカードが表示される
3. 優先度ボタン（高・中・低）が機能する
4. アトラクションをタップして選択できる
5. 「ルートを決める」ボタンが表示される

## トラブルシューティング

### エラー: "Unable to resolve module"

**原因**: パッケージのインストールが不完全

**解決策**:
```bash
rm -rf node_modules
rm package-lock.json  # または yarn.lock
npm install
```

### エラー: "Metro bundler failed"

**原因**: キャッシュの問題

**解決策**:
```bash
expo start -c
```

### エラー: "iOS build failed"

**原因**: Xcodeの設定問題

**解決策**:
1. Xcodeを最新版に更新
2. Command Line Toolsを再インストール
   ```bash
   sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
   sudo xcodebuild -runFirstLaunch
   ```

### エラー: "Could not connect to development server"

**原因**: ネットワーク設定の問題

**解決策**:
1. PCとスマートフォンが同じWi-Fiネットワークに接続されているか確認
2. ファイアウォール設定を確認
3. Expo CLIを再起動

### 地図が表示されない

**原因**: react-native-mapsの設定問題

**解決策（iOS）**:
- 位置情報の権限が正しく設定されているか確認（app.jsonで設定済み）
- 実機の場合、設定 > プライバシー > 位置情報サービスを確認

**解決策（Android）**:
- Google Play Servicesが有効になっているか確認

## パフォーマンスの最適化

### 開発モード vs プロダクションモード

開発中は、アプリのパフォーマンスが遅く感じる場合があります。これは正常です。

プロダクションビルドでは大幅に高速化されます：

```bash
expo build:ios
# または
expo build:android
```

### リロード時間の短縮

- ファストリフレッシュを有効にする（デフォルトで有効）
- 不要なコンソールログを削除する
- 大きな画像ファイルを最適化する

## 次のステップ

セットアップが完了したら：

1. **データのカスタマイズ**: `assets/data/` 内のJSONファイルを編集
2. **UIの調整**: `src/screens/` 内のコンポーネントを編集
3. **新機能の追加**: README.mdの「今後の拡張予定」を参照

## 開発環境の推奨設定

### Visual Studio Code 拡張機能

- **ESLint**: コード品質チェック
- **Prettier**: コード整形
- **React Native Tools**: React Native開発支援
- **TypeScript**: TypeScript言語サポート

### デバッグツール

- **React Native Debugger**: Standalone app for debugging
- **Flipper**: モバイルアプリデバッグ用プラットフォーム

## よくある質問（FAQ）

### Q: オフラインでも動作しますか？

A: はい、すべてのデータはアプリ内に同梱されているため、インターネット接続は不要です。

### Q: 待ち時間データはリアルタイムですか？

A: いいえ、現在のバージョンではサンプルデータです。実際のパークの待ち時間とは異なります。

### Q: アトラクションを追加できますか？

A: はい、`assets/data/attractions.json` を編集することで追加できます。詳細はREADME.mdを参照してください。

### Q: 実機でテストするにはApple Developer Programが必要ですか？

A: Expo Goアプリを使用する場合は不要です。App Storeに公開する場合は必要です。

## サポート

問題が解決しない場合は、以下の情報を含めてGitHub Issuesで報告してください：

- エラーメッセージの全文
- 使用しているOS（macOS/Windows/Linux）
- Node.jsのバージョン
- Expo CLIのバージョン
- 実行したコマンド
- スクリーンショット（可能であれば）

---

セットアップガイドは以上です。素晴らしいアプリ開発を！🚀
