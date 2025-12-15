import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StorageService } from '../utils/storage';

export default function SettingsScreen({ navigation }) {
  const [language, setLanguage] = useState('ja');
  const [optimizationMethod, setOptimizationMethod] = useState('time');
  const [defaultStartTime, setDefaultStartTime] = useState('09:00');
  const [walkingSpeed, setWalkingSpeed] = useState('80');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const lang = await StorageService.getLanguage();
    const method = await StorageService.getOptimizationMethod();
    const startTime = await StorageService.getDefaultStartTime();
    const speed = await StorageService.getWalkingSpeed();
    setLanguage(lang);
    setOptimizationMethod(method);
    setDefaultStartTime(startTime);
    setWalkingSpeed(speed.toString());
  };

  const saveLanguage = async (lang) => {
    setLanguage(lang);
    await StorageService.setLanguage(lang);
  };

  const saveOptimizationMethod = async (method) => {
    setOptimizationMethod(method);
    await StorageService.setOptimizationMethod(method);
  };

  const saveDefaultStartTime = async (time) => {
    setDefaultStartTime(time);
    await StorageService.setDefaultStartTime(time);
  };

  const saveWalkingSpeed = async (speed) => {
    setWalkingSpeed(speed);
    await StorageService.setWalkingSpeed(parseInt(speed, 10));
  };

  return (
    <LinearGradient colors={['#E8D5FF', '#FFFFFF']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>← 戻る</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>⚙️ 設定</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>表示言語</Text>
          <View style={styles.optionButtons}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                language === 'ja' && styles.optionButtonActive,
              ]}
              onPress={() => saveLanguage('ja')}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  language === 'ja' && styles.optionButtonTextActive,
                ]}
              >
                日本語
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                language === 'en' && styles.optionButtonActive,
              ]}
              onPress={() => saveLanguage('en')}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  language === 'en' && styles.optionButtonTextActive,
                ]}
              >
                English
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>デフォルト最適化方法</Text>
          {[
            { key: 'time', label: '時間最短' },
            { key: 'distance', label: '距離最短' },
            { key: 'exhaustive', label: '全探索' },
            { key: 'user', label: '選択順' },
          ].map(method => (
            <TouchableOpacity
              key={method.key}
              style={[
                styles.methodButton,
                optimizationMethod === method.key && styles.methodButtonActive,
              ]}
              onPress={() => saveOptimizationMethod(method.key)}
            >
              <Text
                style={[
                  styles.methodButtonText,
                  optimizationMethod === method.key && styles.methodButtonTextActive,
                ]}
              >
                {method.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>デフォルト開始時刻</Text>
          <TextInput
            style={styles.timeInput}
            value={defaultStartTime}
            onChangeText={saveDefaultStartTime}
            placeholder="09:00"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>歩行速度（分速）</Text>
          <View style={styles.speedButtons}>
            {[
              { key: '60', label: '車椅子 (60m/分)' },
              { key: '80', label: '通常 (80m/分)' },
              { key: '100', label: '早歩き (100m/分)' },
            ].map(speed => (
              <TouchableOpacity
                key={speed.key}
                style={[
                  styles.speedButton,
                  walkingSpeed === speed.key && styles.speedButtonActive,
                ]}
                onPress={() => saveWalkingSpeed(speed.key)}
              >
                <Text
                  style={[
                    styles.speedButtonText,
                    walkingSpeed === speed.key && styles.speedButtonTextActive,
                  ]}
                >
                  {speed.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.timeInput}
            value={walkingSpeed}
            onChangeText={saveWalkingSpeed}
            placeholder="80"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            WonderPasNavi v1.0.0{'\n'}
            ディズニーランドの1日をシミュレート
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6B46C1',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6B46C1',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  optionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: '#6B46C1',
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  optionButtonTextActive: {
    color: '#FFFFFF',
  },
  methodButton: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  methodButtonActive: {
    borderColor: '#6B46C1',
    backgroundColor: '#F3E8FF',
  },
  methodButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  methodButtonTextActive: {
    color: '#6B46C1',
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  speedButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  speedButton: {
    flex: 1,
    minWidth: '30%',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  speedButtonActive: {
    backgroundColor: '#6B46C1',
  },
  speedButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  speedButtonTextActive: {
    color: '#FFFFFF',
  },
  footer: {
    marginTop: 24,
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
