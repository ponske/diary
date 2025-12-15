// ローカルストレージサービス

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, OptimizationMethod } from '../types';

const SETTINGS_KEY = '@wonderpasnavi_settings';

// デフォルト設定
const DEFAULT_SETTINGS: AppSettings = {
  language: 'ja',
  defaultOptimizationMethod: OptimizationMethod.TIME,
  walkingSpeedMps: 80,
  defaultStartTime: '09:00',
  resultTitle: 'まわるじゅんばん',
};

/**
 * 設定を読み込む
 */
export async function loadSettings(): Promise<AppSettings> {
  try {
    const jsonValue = await AsyncStorage.getItem(SETTINGS_KEY);
    if (jsonValue != null) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(jsonValue) };
    }
  } catch (error) {
    console.error('設定の読み込みに失敗:', error);
  }
  return DEFAULT_SETTINGS;
}

/**
 * 設定を保存する
 */
export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    const jsonValue = JSON.stringify(settings);
    await AsyncStorage.setItem(SETTINGS_KEY, jsonValue);
  } catch (error) {
    console.error('設定の保存に失敗:', error);
    throw error;
  }
}

/**
 * 設定を初期化する
 */
export async function resetSettings(): Promise<AppSettings> {
  try {
    await AsyncStorage.removeItem(SETTINGS_KEY);
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('設定のリセットに失敗:', error);
    throw error;
  }
}
