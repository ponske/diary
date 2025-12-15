import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';

import GlassPanel from '../components/GlassPanel';
import AppBackground from '../components/AppBackground';
import { StorageService } from '../utils/storage';
import { Theme } from '../theme';

export default function SettingsScreen({ navigation }) {
  const [method, setMethod] = useState('time');
  const [speed, setSpeed] = useState('80');
  const [resultTitle, setResultTitle] = useState('まわるじゅんばん');
  const [transitionEffect, setTransitionEffect] = useState('none'); // none | balloons | bubbles

  useEffect(() => {
    (async () => {
      setMethod(await StorageService.getOptimizationMethod());
      setSpeed(String(await StorageService.getWalkingSpeed()));
      setResultTitle(await StorageService.getResultTitle());
      setTransitionEffect(await StorageService.getTransitionEffect());
    })();
  }, []);

  const save = async () => {
    await StorageService.setOptimizationMethod(method);
    await StorageService.setWalkingSpeed(parseInt(speed, 10) || 80);
    await StorageService.setResultTitle(resultTitle || 'まわるじゅんばん');
    await StorageService.setTransitionEffect(transitionEffect || 'none');
    navigation.goBack();
  };

  return (
    <AppBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← 戻る</Text>
          </TouchableOpacity>
          <Text style={styles.title}>設定</Text>
        </View>

        <GlassPanel style={styles.section}>
          <Text style={styles.sectionTitle}>デフォルト最適化方法</Text>
          {[
            { key: 'time', label: '時間最短' },
            { key: 'distance', label: '距離最短' },
            { key: 'exhaustive', label: '全探索' },
            { key: 'user', label: '選択順' },
          ].map((x) => (
            <TouchableOpacity
              key={x.key}
              style={[styles.methodButton, method === x.key && styles.methodButtonActive]}
              onPress={() => setMethod(x.key)}
            >
              <Text style={[styles.methodText, method === x.key && styles.methodTextActive]}>{x.label}</Text>
            </TouchableOpacity>
          ))}
        </GlassPanel>

        <GlassPanel style={styles.section}>
          <Text style={styles.sectionTitle}>歩行速度（分速m）</Text>
          <Text style={styles.speedValue}>{parseInt(speed, 10) || 80} m/分</Text>
          <Slider
            minimumValue={40}
            maximumValue={140}
            step={5}
            value={parseInt(speed, 10) || 80}
            minimumTrackTintColor={Theme.colors.primary}
            maximumTrackTintColor={Theme.colors.strokeSoft}
            thumbTintColor={Theme.colors.dark}
            onValueChange={(v) => setSpeed(String(Math.round(v)))}
          />
          <Text style={styles.hint}>目安: 車椅子 50 / ふつう 80 / 早歩き 110</Text>
        </GlassPanel>

        <GlassPanel style={styles.section}>
          <Text style={styles.sectionTitle}>結果タイトル</Text>
          <TextInput style={styles.input} value={resultTitle} onChangeText={setResultTitle} />
          <Text style={styles.hint}>例: まわるじゅんばん / 今日のルート</Text>
        </GlassPanel>

        <GlassPanel style={styles.section}>
          <Text style={styles.sectionTitle}>遷移演出（結果表示前）</Text>
          {[
            { key: 'none', label: 'なし（演出しない）' },
            { key: 'balloons', label: '🎈 風船がたくさん' },
            { key: 'bubbles', label: '🫧 泡がボコボコ' },
          ].map((x) => (
            <TouchableOpacity
              key={x.key}
              style={[styles.methodButton, transitionEffect === x.key && styles.methodButtonActive]}
              onPress={() => setTransitionEffect(x.key)}
            >
              <Text style={[styles.methodText, transitionEffect === x.key && styles.methodTextActive]}>{x.label}</Text>
            </TouchableOpacity>
          ))}
          <Text style={styles.hint}>ルート結果へ移る直前に再生されます</Text>
        </GlassPanel>

        <TouchableOpacity style={styles.saveButton} onPress={save}>
          <Text style={styles.saveButtonText}>保存</Text>
        </TouchableOpacity>
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 60, paddingBottom: 30 },
  header: { marginBottom: 18 },
  backButton: { padding: 8, alignSelf: 'flex-start' },
  backButtonText: {
    fontSize: 16,
    fontFamily: Theme.fonts.black,
    color: 'rgba(255,255,255,0.96)',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: Theme.fonts.black,
    color: 'rgba(255,255,255,0.98)',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
  section: { borderRadius: 16, padding: 16, marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.0)' },
  sectionTitle: { fontSize: 16, fontFamily: Theme.fonts.bold, color: Theme.colors.text, marginBottom: 10 },
  methodButton: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    marginBottom: 10,
  },
  methodButtonActive: { borderColor: Theme.colors.primary, backgroundColor: 'rgba(37, 99, 235, 0.12)' },
  methodText: { fontFamily: Theme.fonts.regular, color: Theme.colors.text },
  methodTextActive: { color: Theme.colors.primary },
  speedValue: {
    fontSize: 16,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  hint: { marginTop: 6, color: '#6B7280', fontSize: 12, fontFamily: Theme.fonts.regular },
  saveButton: {
    marginTop: 6,
    backgroundColor: Theme.colors.dark,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: { color: '#FFFFFF', fontFamily: Theme.fonts.bold, fontSize: 16 },
});
