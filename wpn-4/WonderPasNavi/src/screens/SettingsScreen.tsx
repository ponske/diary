// 設定画面

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
} from 'react-native';
import { AppSettings, OptimizationMethod } from '../types';
import { loadSettings, saveSettings, resetSettings } from '../services/StorageService';

interface SettingsScreenProps {
  onBack: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const [settings, setSettings] = useState<AppSettings>({
    language: 'ja',
    defaultOptimizationMethod: OptimizationMethod.TIME,
    walkingSpeedMps: 80,
    defaultStartTime: '09:00',
    resultTitle: 'まわるじゅんばん',
  });

  useEffect(() => {
    loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    const loadedSettings = await loadSettings();
    setSettings(loadedSettings);
  };

  const handleSave = async () => {
    try {
      await saveSettings(settings);
      Alert.alert('保存完了', '設定を保存しました');
    } catch (error) {
      Alert.alert('エラー', '設定の保存に失敗しました');
    }
  };

  const handleReset = () => {
    Alert.alert(
      '設定をリセット',
      '設定を初期状態に戻しますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: 'リセット',
          onPress: async () => {
            const defaultSettings = await resetSettings();
            setSettings(defaultSettings);
            Alert.alert('完了', '設定をリセットしました');
          },
          style: 'destructive',
        },
      ]
    );
  };

  const optimizationMethods = [
    { value: OptimizationMethod.DISTANCE, label: '距離最短' },
    { value: OptimizationMethod.TIME, label: '時間最短' },
    { value: OptimizationMethod.USER_ORDER, label: '選択順' },
    { value: OptimizationMethod.BRUTE_FORCE, label: '全探索' },
  ];

  const walkingSpeeds = [
    { value: 60, label: '車椅子 (60m/分)' },
    { value: 80, label: '標準 (80m/分)' },
    { value: 100, label: '早歩き (100m/分)' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.title}>設定</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>表示設定</Text>

          <View style={styles.settingItem}>
            <Text style={styles.label}>言語</Text>
            <View style={styles.optionRow}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  settings.language === 'ja' && styles.optionButtonActive,
                ]}
                onPress={() => setSettings({ ...settings, language: 'ja' })}
              >
                <Text
                  style={[
                    styles.optionText,
                    settings.language === 'ja' && styles.optionTextActive,
                  ]}
                >
                  日本語
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  settings.language === 'en' && styles.optionButtonActive,
                ]}
                onPress={() => setSettings({ ...settings, language: 'en' })}
              >
                <Text
                  style={[
                    styles.optionText,
                    settings.language === 'en' && styles.optionTextActive,
                  ]}
                >
                  English
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.label}>結果タイトル</Text>
            <TextInput
              style={styles.input}
              value={settings.resultTitle}
              onChangeText={(text) =>
                setSettings({ ...settings, resultTitle: text })
              }
              placeholder="例: まわるじゅんばん"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ルート設定</Text>

          <View style={styles.settingItem}>
            <Text style={styles.label}>デフォルト最適化方法</Text>
            <View style={styles.methodList}>
              {optimizationMethods.map((method) => (
                <TouchableOpacity
                  key={method.value}
                  style={[
                    styles.methodButton,
                    settings.defaultOptimizationMethod === method.value &&
                      styles.methodButtonActive,
                  ]}
                  onPress={() =>
                    setSettings({
                      ...settings,
                      defaultOptimizationMethod: method.value,
                    })
                  }
                >
                  <View
                    style={[
                      styles.radio,
                      settings.defaultOptimizationMethod === method.value &&
                        styles.radioActive,
                    ]}
                  />
                  <Text style={styles.methodText}>{method.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.label}>歩行速度</Text>
            <View style={styles.speedList}>
              {walkingSpeeds.map((speed) => (
                <TouchableOpacity
                  key={speed.value}
                  style={[
                    styles.speedButton,
                    settings.walkingSpeedMps === speed.value &&
                      styles.speedButtonActive,
                  ]}
                  onPress={() =>
                    setSettings({ ...settings, walkingSpeedMps: speed.value })
                  }
                >
                  <Text
                    style={[
                      styles.speedText,
                      settings.walkingSpeedMps === speed.value &&
                        styles.speedTextActive,
                    ]}
                  >
                    {speed.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.label}>デフォルト開始時刻</Text>
            <TextInput
              style={styles.input}
              value={settings.defaultStartTime}
              onChangeText={(text) =>
                setSettings({ ...settings, defaultStartTime: text })
              }
              placeholder="09:00"
            />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>設定を保存</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>設定をリセット</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4A90E2',
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFF',
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  settingItem: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#DDD',
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
  },
  optionTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  methodList: {
    gap: 8,
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#DDD',
  },
  methodButtonActive: {
    borderColor: '#4A90E2',
    backgroundColor: '#F0F8FF',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#DDD',
    marginRight: 12,
  },
  radioActive: {
    borderColor: '#4A90E2',
    backgroundColor: '#4A90E2',
  },
  methodText: {
    fontSize: 16,
    color: '#333',
  },
  speedList: {
    gap: 8,
  },
  speedButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#DDD',
    alignItems: 'center',
  },
  speedButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  speedText: {
    fontSize: 14,
    color: '#666',
  },
  speedTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
    marginBottom: 40,
  },
  saveButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  resetButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default SettingsScreen;
