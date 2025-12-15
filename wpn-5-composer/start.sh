#!/bin/bash

# watchmanのキャッシュをクリア
watchman watch-del-all 2>/dev/null || true

# Metroのキャッシュをクリアして起動
npx expo start --clear
