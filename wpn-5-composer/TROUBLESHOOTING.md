# トラブルシューティング

## EMFILE: too many open files エラー

このエラーが発生した場合、以下の解決策を試してください：

### 解決策1: watchmanをインストール（推奨）

watchmanはファイルシステムの変更を効率的に監視するツールです。

```bash
# Homebrewを使用してインストール
brew install watchman

# インストール後、watchmanを再起動
watchman shutdown-server
```

### 解決策2: ファイルディスクリプタの上限を増やす（一時的な解決策）

```bash
# 現在のセッションでのみ有効
ulimit -n 4096

# その後、Expoを再起動
npx expo start --clear
```

### 解決策3: Metroのキャッシュをクリア

```bash
# Metroのキャッシュをクリア
npx expo start --clear

# または、node_modulesを再インストール
rm -rf node_modules
npm install
npx expo start --clear
```

### 解決策4: 大きなJSONファイルの扱い

`waiting_times.json`は非常に大きいファイル（10512行）のため、Metroバンドラーが監視する際に問題が発生する可能性があります。

現在、これらのファイルは`assets/data/`フォルダに移動されており、`.watchmanconfig`で最適化されています。

## その他の問題

### アプリが起動しない

1. 依存関係を再インストール：
```bash
rm -rf node_modules package-lock.json
npm install
```

2. Expoのキャッシュをクリア：
```bash
npx expo start --clear
```

### 地図が表示されない

iOSシミュレーターでは、地図の表示に追加の設定が必要な場合があります。
実機でのテストを推奨します。
