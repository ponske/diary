#!/bin/bash

# クリーンな状態で起動するスクリプト

echo "Clearing all caches..."
rm -rf .expo node_modules/.cache .metro

echo "Clearing watchman cache..."
watchman watch-del-all 2>/dev/null || true

echo "Killing any running Metro processes..."
lsof -ti:8081 | xargs kill -9 2>/dev/null || true

echo "Setting file descriptor limit..."
ulimit -n 4096

echo "Starting Expo with cleared cache..."
npx expo start --clear
