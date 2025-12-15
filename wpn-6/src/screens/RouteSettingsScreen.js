import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

import LoadingSpinner from '../components/LoadingSpinner';
import GlassPanel from '../components/GlassPanel';
import AppBackground from '../components/AppBackground';
import { DataLoader } from '../services/DataLoader';
import { RouteOptimizer } from '../services/RouteOptimizer';
import { StorageService } from '../utils/storage';
import { timeStringToMinutes } from '../utils/time';
import { Theme } from '../theme';

function validateTimeHHMM(s) {
  if (!s || typeof s !== 'string') return false;
  const m = s.match(/^\d{1,2}:\d{2}$/);
  if (!m) return false;
  const [hh, mm] = s.split(':').map((x) => parseInt(x, 10));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return false;
  if (hh < 0 || hh > 23) return false;
  if (mm < 0 || mm > 59) return false;
  return true;
}

function clampTime(s, minMinutes, maxMinutes) {
  const t = timeStringToMinutes(s);
  const clamped = Math.max(minMinutes, Math.min(maxMinutes, t));
  const hh = Math.floor(clamped / 60);
  const mm = clamped % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export default function RouteSettingsScreen({ route, navigation }) {
  const { selectedAttractions } = route.params;

  const [startTime, setStartTime] = useState('09:00');
  const [endTimeOption, setEndTimeOption] = useState('closing'); // closing | custom
  const [customEndTime, setCustomEndTime] = useState('21:00');
  const [optimizationMethod, setOptimizationMethod] = useState('time');
  const [walkingSpeed, setWalkingSpeed] = useState(80);

  const [waitingTimes, setWaitingTimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const cancelRef = useRef(false);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const formatHHMM = (d) => {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const hhmmToDate = (s) => {
    const d = new Date();
    const parts = s.split(':');
    const hh = parseInt(parts[0], 10);
    const mm = parseInt(parts[1], 10);
    d.setHours(Number.isNaN(hh) ? 9 : hh, Number.isNaN(mm) ? 0 : mm, 0, 0);
    return d;
  };

  useEffect(() => {
    (async () => {
      const savedStart = await StorageService.getDefaultStartTime();
      const savedMethod = await StorageService.getOptimizationMethod();
      const savedSpeed = await StorageService.getWalkingSpeed();
      setStartTime(savedStart || '09:00');
      setOptimizationMethod(savedMethod || 'time');
      setWalkingSpeed(savedSpeed || 80);

      const wt = await DataLoader.loadWaitingTimes();
      setWaitingTimes(wt);
    })();
  }, []);

  const handleOptimize = async () => {
    try {
      cancelRef.current = false;

      if (!validateTimeHHMM(startTime)) {
        Alert.alert('エラー', '開始時刻が無効です（例: 09:00）');
        return;
      }
      const clampedStart = clampTime(startTime, 9 * 60, 21 * 60);
      setStartTime(clampedStart);

      let endMinutes = 21 * 60;
      let endTimeLabel = '21:00';

      if (endTimeOption === 'custom') {
        if (!validateTimeHHMM(customEndTime)) {
          Alert.alert('エラー', '退園時刻が無効です（例: 18:30）');
          return;
        }
        const clampedEnd = clampTime(customEndTime, 10 * 60, 21 * 60);
        setCustomEndTime(clampedEnd);
        endMinutes = timeStringToMinutes(clampedEnd);
        endTimeLabel = clampedEnd;
      }

      const startMinutes = timeStringToMinutes(clampedStart);
      if (endMinutes <= startMinutes) {
        Alert.alert('エラー', '退園時刻は開始時刻より後である必要があります');
        return;
      }

      if (!waitingTimes || waitingTimes.length === 0) {
        Alert.alert('エラー', '待ち時間データが読み込めませんでした');
        return;
      }

      await StorageService.setDefaultStartTime(clampedStart);
      await StorageService.setOptimizationMethod(optimizationMethod);
      await StorageService.setWalkingSpeed(parseInt(String(walkingSpeed), 10) || 80);

      setLoading(true);
      setProgress(null);

      // UI反映待ち
      await new Promise((r) => setTimeout(r, 150));

      const optimizer = new RouteOptimizer(waitingTimes, parseInt(String(walkingSpeed), 10) || 80);

      let routeItems = [];
      if (optimizationMethod === 'distance') {
        routeItems = optimizer.optimizeByDistance(selectedAttractions, clampedStart);
      } else if (optimizationMethod === 'time') {
        routeItems = optimizer.optimizeByTime(selectedAttractions, clampedStart);
      } else if (optimizationMethod === 'user') {
        routeItems = optimizer.optimizeByUserOrder(selectedAttractions, clampedStart);
      } else if (optimizationMethod === 'exhaustive') {
        routeItems = await optimizer.optimizeByExhaustive(
          selectedAttractions,
          clampedStart,
          (p) => setProgress(p),
          () => cancelRef.current
        );
      }

      if (cancelRef.current) {
        Alert.alert('中断', '全探索を中断しました');
        return;
      }

      const effect = await StorageService.getTransitionEffect();

      const goWithEffect = (params) => {
        if (!effect || effect === 'none') {
          navigation.navigate('RouteResult', params);
          return;
        }
        navigation.navigate('Transition', { effect, nextParams: params });
      };

      const last = routeItems[routeItems.length - 1];
      const exceeds = last && last.arrivalTimeMinutes > endMinutes;
      if (exceeds) {
        Alert.alert('退園時刻超過', '一部の到着時刻が退園時刻を超えています。', [
          {
            text: 'そのまま表示',
            onPress: () =>
              goWithEffect({
                route: routeItems,
                startTime: clampedStart,
                endTime: endTimeLabel,
                endTimeMinutes: endMinutes,
              }),
          },
          {
            text: '低優先度を削除して再作成',
            onPress: async () => {
              const filtered = selectedAttractions.filter((x) => x.priority !== 'low');
              if (filtered.length < 2) {
                Alert.alert('エラー', '低優先度を除くと2件未満になります');
                return;
              }
              setLoading(true);
              await new Promise((r) => setTimeout(r, 150));
              const reroute = optimizer.optimizeByTime(filtered, clampedStart);
              goWithEffect({
                route: reroute,
                startTime: clampedStart,
                endTime: endTimeLabel,
                endTimeMinutes: endMinutes,
                removedLowPriority: true,
              });
            },
          },
          { text: 'キャンセル', style: 'cancel' },
        ]);
        return;
      }

      goWithEffect({
        route: routeItems,
        startTime: clampedStart,
        endTime: endTimeLabel,
        endTimeMinutes: endMinutes,
      });
    } catch (e) {
      console.error(e);
      Alert.alert('エラー', `ルート最適化に失敗しました: ${e?.message || e}`);
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#E8D5FF' }}>
        <LoadingSpinner
          progress={optimizationMethod === 'exhaustive' ? progress : null}
          message={
            optimizationMethod === 'exhaustive'
              ? '✨ 全探索で最適ルートを計算中... ✨\n（地点数が多いと時間がかかります）'
              : '✨ ルートを最適化中... ✨'
          }
        />
        {optimizationMethod === 'exhaustive' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              cancelRef.current = true;
            }}
          >
            <Text style={styles.cancelButtonText}>中断する</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <AppBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backButtonText}>← 戻る</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.settingsButton}>
              <Text style={styles.settingsButtonText}>⚙️</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>ルート設定</Text>
        </View>

        <GlassPanel style={styles.section}>
          <Text style={styles.sectionTitle}>開始時刻</Text>
          <TouchableOpacity style={styles.timePickRow} onPress={() => setShowStartPicker(true)}>
            <Text style={styles.timePickValue}>{startTime}</Text>
            <Text style={styles.timePickHint}>変更</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>範囲: 09:00 - 21:00（範囲外は自動補正）</Text>
          {showStartPicker && (
            <View style={styles.pickerWrap}>
              <DateTimePicker
                value={hhmmToDate(startTime)}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => {
                  if (Platform.OS !== 'ios') setShowStartPicker(false);
                  if (date) setStartTime(formatHHMM(date));
                }}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity style={styles.pickerDone} onPress={() => setShowStartPicker(false)}>
                  <Text style={styles.pickerDoneText}>完了</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </GlassPanel>

        <GlassPanel style={styles.section}>
          <Text style={styles.sectionTitle}>退園時刻</Text>
          <View style={styles.optionButtons}>
            <TouchableOpacity
              style={[styles.optionButton, endTimeOption === 'closing' && styles.optionButtonActive]}
              onPress={() => setEndTimeOption('closing')}
            >
              <Text
                style={[styles.optionButtonText, endTimeOption === 'closing' && styles.optionButtonTextActive]}
              >
                閉園まで (21:00)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, endTimeOption === 'custom' && styles.optionButtonActive]}
              onPress={() => setEndTimeOption('custom')}
            >
              <Text
                style={[styles.optionButtonText, endTimeOption === 'custom' && styles.optionButtonTextActive]}
              >
                時刻指定
              </Text>
            </TouchableOpacity>
          </View>
          {endTimeOption === 'custom' && (
            <>
              <TouchableOpacity style={styles.timePickRow} onPress={() => setShowEndPicker(true)}>
                <Text style={styles.timePickValue}>{customEndTime}</Text>
                <Text style={styles.timePickHint}>変更</Text>
              </TouchableOpacity>
              {showEndPicker && (
                <View style={styles.pickerWrap}>
                  <DateTimePicker
                    value={hhmmToDate(customEndTime)}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, date) => {
                      if (Platform.OS !== 'ios') setShowEndPicker(false);
                      if (date) setCustomEndTime(formatHHMM(date));
                    }}
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity style={styles.pickerDone} onPress={() => setShowEndPicker(false)}>
                      <Text style={styles.pickerDoneText}>完了</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </>
          )}
        </GlassPanel>

        <GlassPanel style={styles.section}>
          <Text style={styles.sectionTitle}>歩行速度（分速m）</Text>
          <TextInput
            style={styles.timeInput}
            value={String(walkingSpeed)}
            onChangeText={setWalkingSpeed}
            placeholder="80"
            keyboardType="numeric"
          />
          <Text style={styles.hint}>デフォルトは分速80m（車椅子/早歩きは今後拡張）</Text>
        </GlassPanel>

        <GlassPanel style={styles.section}>
          <Text style={styles.sectionTitle}>最適化方法</Text>
          {[{
            key: 'time',
            label: '時間最短',
            desc: '待ち時間+移動+体験の合計が小さい順に選ぶ（優先度も考慮）',
          }, {
            key: 'distance',
            label: '距離最短',
            desc: '最近傍法で近い順に回る（優先度も考慮）',
          }, {
            key: 'exhaustive',
            label: '全探索（10地点以下）',
            desc: '優先度グループ内で真の最小所要時間ルートを探索（時間がかかる）',
          }, {
            key: 'user',
            label: '選択順',
            desc: '選択した順番で回る',
          }].map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[styles.methodButton, optimizationMethod === m.key && styles.methodButtonActive]}
              onPress={() => setOptimizationMethod(m.key)}
            >
              <Text style={[styles.methodButtonText, optimizationMethod === m.key && styles.methodButtonTextActive]}>
                {m.label}
              </Text>
              <Text style={styles.methodDesc}>{m.desc}</Text>
            </TouchableOpacity>
          ))}
        </GlassPanel>

        <TouchableOpacity style={styles.optimizeButton} onPress={handleOptimize} activeOpacity={0.85}>
          <LinearGradient colors={Theme.gradients.primary} style={styles.optimizeButtonGradient}>
            <Text style={styles.optimizeButtonText}>ルートを最適化 ✨</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 60, paddingBottom: 30 },
  header: { marginBottom: 22 },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: { padding: 8 },
  backButtonText: {
    fontSize: 16,
    fontFamily: Theme.fonts.black,
    color: 'rgba(255,255,255,0.96)',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  settingsButton: { padding: 8 },
  settingsButtonText: { fontSize: 24 },
  title: {
    fontSize: 28,
    fontFamily: Theme.fonts.black,
    color: 'rgba(255,255,255,0.98)',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
  section: { marginBottom: 18, padding: 16, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.0)' },
  sectionTitle: { fontSize: 16, fontFamily: Theme.fonts.bold, color: Theme.colors.text, marginBottom: 10 },
  timeInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  timePickRow: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.72)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timePickValue: {
    fontSize: 18,
    fontFamily: Theme.fonts.bold,
    color: '#111827',
    letterSpacing: 0.2,
  },
  timePickHint: {
    fontSize: 13,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.primary,
  },
  pickerWrap: {
    marginTop: 10,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pickerDone: {
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: Theme.colors.dark,
  },
  pickerDoneText: {
    color: '#FFFFFF',
    fontFamily: Theme.fonts.bold,
  },
  hint: { fontSize: 12, color: '#6B7280', marginTop: 6 },
  optionButtons: { flexDirection: 'row', marginBottom: 12, gap: 8 },
  optionButton: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center' },
  optionButtonActive: { backgroundColor: Theme.colors.primary },
  optionButtonText: { fontSize: 13, fontFamily: Theme.fonts.regular, color: '#6B7280' },
  optionButtonTextActive: { color: '#FFFFFF' },
  methodButton: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  methodButtonActive: { borderColor: Theme.colors.primary, backgroundColor: 'rgba(37, 99, 235, 0.12)' },
  methodButtonText: { fontSize: 15, fontFamily: Theme.fonts.bold, color: '#111827', marginBottom: 4 },
  methodButtonTextActive: { color: Theme.colors.primary },
  methodDesc: { fontSize: 12, color: '#6B7280' },
  optimizeButton: { borderRadius: 14, overflow: 'hidden', marginTop: 6 },
  optimizeButtonGradient: { padding: 16, alignItems: 'center' },
  optimizeButtonText: { fontSize: 18, fontFamily: Theme.fonts.bold, color: '#FFFFFF' },
  cancelButton: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: { color: '#FFFFFF', fontFamily: Theme.fonts.bold, fontSize: 16 },
});
