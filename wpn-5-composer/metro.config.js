const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// ファイルウォッチャーの設定を最適化してEMFILEエラーを防ぐ
config.watcher = {
  ...config.watcher,
  healthCheck: {
    enabled: true,
    interval: 2000,
    timeout: 10000,
  },
  watchman: {
    deferStates: ['hg.update'],
  },
};

// resolver設定
config.resolver = {
  ...config.resolver,
  sourceExts: [...config.resolver.sourceExts, 'json'],
};

module.exports = config;
