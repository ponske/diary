#!/bin/bash

# EMFILEエラーを防ぐための起動スクリプト

echo "Clearing watchman cache..."
watchman watch-del-all 2>/dev/null || true

echo "Setting file descriptor limit..."
ulimit -n 4096

echo "Starting Expo with cleared cache..."
npx expo start --clear
