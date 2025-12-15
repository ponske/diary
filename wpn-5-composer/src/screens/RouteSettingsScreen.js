import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  InteractionManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RouteOptimizer } from '../services/RouteOptimizer';
import { DataLoader } from '../services/DataLoader';
import { StorageService } from '../utils/storage';
import { timeStringToMinutes, minutesToTime } from '../utils/time';
import LoadingSpinner from '../components/LoadingSpinner';

export default function RouteSettingsScreen({ route, navigation }) {
  const { selectedAttractions } = route.params;
  const [startTime, setStartTime] = useState('09:00');
  const [endTimeOption, setEndTimeOption] = useState('closing'); // 'closing' or 'custom'
  const [customEndTime, setCustomEndTime] = useState('21:00');
  const [optimizationMethod, setOptimizationMethod] = useState('time');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [waitingTimes, setWaitingTimes] = useState([]);
  const [walkingSpeed, setWalkingSpeed] = useState(80);

  useEffect(() => {
    loadSettings();
    loadWaitingTimes();
  }, []);

  const loadSettings = async () => {
    const savedStartTime = await StorageService.getDefaultStartTime();
    const savedMethod = await StorageService.getOptimizationMethod();
    const savedSpeed = await StorageService.getWalkingSpeed();
    if (savedStartTime) setStartTime(savedStartTime);
    if (savedMethod) setOptimizationMethod(savedMethod);
    if (savedSpeed) setWalkingSpeed(savedSpeed);
  };

  const loadWaitingTimes = async () => {
    const times = await DataLoader.loadWaitingTimes();
    setWaitingTimes(times);
  };

  const validateTime = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return false;
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return false;
    return true;
  };

  const clampTime = (timeString, minHour = 9, maxHour = 21) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    let clampedHours = Math.max(minHour, Math.min(maxHour, hours));
    let clampedMinutes = minutes;
    if (clampedHours === minHour && clampedMinutes < 0) {
      clampedHours = minHour;
      clampedMinutes = 0;
    }
    if (clampedHours === maxHour && clampedMinutes > 0) {
      clampedHours = maxHour;
      clampedMinutes = 0;
    }
    return `${String(clampedHours).padStart(2, '0')}:${String(clampedMinutes).padStart(2, '0')}`;
  };

  const handleOptimize = async () => {
    try {
      console.log('handleOptimize called');
      console.log('selectedAttractions:', selectedAttractions.length);
      console.log('optimizationMethod:', optimizationMethod);
      
      // 時刻の検証と補正
      if (!validateTime(startTime)) {
        Alert.alert('エラー', '開始時刻が無効です');
        return;
      }
      
      console.log('Validation passed, starting optimization...');

      let clampedStart = clampTime(startTime, 9, 21);
      console.log('clampedStart:', clampedStart);
      setStartTime(clampedStart);

      let endTimeMinutes = 21 * 60; // 21:00
      if (endTimeOption === 'custom') {
        if (!validateTime(customEndTime)) {
          Alert.alert('エラー', '退園時刻が無効です');
          return;
        }
        let clampedEnd = clampTime(customEndTime, 10, 21);
        setCustomEndTime(clampedEnd);
        endTimeMinutes = timeStringToMinutes(
          parseInt(clampedEnd.split(':')[0]),
          parseInt(clampedEnd.split(':')[1])
        );
      }
      console.log('endTimeMinutes:', endTimeMinutes);

      const startMinutes = timeStringToMinutes(
        parseInt(clampedStart.split(':')[0]),
        parseInt(clampedStart.split(':')[1])
      );
      console.log('startMinutes:', startMinutes);

      if (endTimeMinutes <= startMinutes) {
        Alert.alert('エラー', '退園時刻は開始時刻より後である必要があります');
        return;
      }

      // 状態を更新してスピナーを表示
      console.log('Setting loading to true');
      setLoading(true);
      setProgress(null);
      console.log('Loading state set, waiting for UI update...');

      // UIが更新されるのを待つ（Reactの状態更新を確実に反映）
      // シンプルにsetTimeoutで待機
      await new Promise(resolve => {
        setTimeout(() => {
          console.log('UI update wait completed, starting optimization');
          resolve();
        }, 200);
      });

      console.log('Starting optimization...');
      console.log('waitingTimes length:', waitingTimes.length);
      console.log('walkingSpeed:', walkingSpeed);
      
      if (!waitingTimes || waitingTimes.length === 0) {
        Alert.alert('エラー', '待ち時間データが読み込まれていません');
        setLoading(false);
        return;
      }
      
      const optimizer = new RouteOptimizer(
        selectedAttractions.map(item => item.attraction),
        waitingTimes,
        walkingSpeed
      );

      let optimizedRoute = [];
      const priorityOrder = selectedAttractions.map(item => ({
        attraction: item.attraction,
        priority: item.priority,
      }));

      // 非同期で実行してUIをブロックしないようにする
      if (optimizationMethod === 'distance') {
        optimizedRoute = await new Promise((resolve) => {
          setTimeout(() => {
            const result = optimizer.optimizeByDistance(
              priorityOrder,
              clampedStart,
              priorityOrder
            );
            resolve(result);
          }, 200); // スピナーを表示するための遅延
        });
      } else if (optimizationMethod === 'time') {
        optimizedRoute = await new Promise((resolve) => {
          setTimeout(() => {
            const result = optimizer.optimizeByTime(
              priorityOrder,
              clampedStart,
              priorityOrder
            );
            resolve(result);
          }, 200); // スピナーを表示するための遅延
        });
      } else if (optimizationMethod === 'exhaustive') {
        // 全探索の場合はプログレスバーを表示
        optimizedRoute = await new Promise((resolve) => {
          const onProgress = (prog) => {
            // プログレスを更新（Reactの状態更新を確実に実行）
            setProgress(prog);
          };
          // 非同期で実行してUIスレッドをブロックしない
          setTimeout(() => {
            const result = optimizer.optimizeByExhaustive(
              priorityOrder,
              clampedStart,
              priorityOrder,
              onProgress
            );
            resolve(result);
          }, 200);
        });
      } else if (optimizationMethod === 'user') {
        optimizedRoute = await new Promise((resolve) => {
          setTimeout(() => {
            const result = optimizer.optimizeByUserOrder(
              priorityOrder,
              clampedStart
            );
            resolve(result);
          }, 200); // スピナーを表示するための遅延
        });
      }

      console.log('Optimization completed, route length:', optimizedRoute.length);
      
      // 閉園時刻超過チェック
      const lastItem = optimizedRoute[optimizedRoute.length - 1];
      if (lastItem && lastItem.arrivalTimeMinutes > endTimeMinutes) {
        console.log('Closing time exceeded');
        Alert.alert(
          '閉園時刻超過',
          '一部のアトラクションが閉園時刻を超えています。',
          [
            {
              text: 'そのまま表示',
              onPress: () => navigateToResult(optimizedRoute, endTimeMinutes),
            },
            {
              text: '低優先度を削除して再作成',
              onPress: () => handleRemoveLowPriorityAndRetry(
                priorityOrder,
                clampedStart,
                endTimeMinutes
              ),
            },
            { text: 'キャンセル', style: 'cancel' },
          ]
        );
      } else {
        console.log('Navigating to result screen');
        navigateToResult(optimizedRoute, endTimeMinutes);
      }
    } catch (error) {
      console.error('Optimization error:', error);
      console.error('Error stack:', error.stack);
      Alert.alert('エラー', `ルート最適化中にエラーが発生しました: ${error.message}`);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
      setProgress(null);
    }
  };

  const handleRemoveLowPriorityAndRetry = async (
    priorityOrder,
    startTime,
    endTimeMinutes
  ) => {
    setLoading(true);
    try {
      let filtered = priorityOrder.filter(item => item.priority !== 'low');
      if (filtered.length < 2) {
        Alert.alert('エラー', '削除後、アトラクションが2つ未満になりました');
        setLoading(false);
        return;
      }

      const optimizer = new RouteOptimizer(
        filtered.map(item => item.attraction),
        waitingTimes,
        walkingSpeed
      );

      let route = optimizer.optimizeByTime(filtered, startTime, filtered);
      let lastItem = route[route.length - 1];

      while (lastItem && lastItem.arrivalTimeMinutes > endTimeMinutes && filtered.length >= 2) {
        const lowPriorityIndex = filtered.findIndex(item => item.priority === 'low');
        if (lowPriorityIndex >= 0) {
          filtered.splice(lowPriorityIndex, 1);
        } else {
          // 低優先度がない場合は、最後の低優先度以外を削除
          filtered.pop();
        }
        route = optimizer.optimizeByTime(filtered, startTime, filtered);
        lastItem = route[route.length - 1];
      }

      if (lastItem && lastItem.arrivalTimeMinutes <= endTimeMinutes) {
        navigateToResult(route, endTimeMinutes);
      } else {
        Alert.alert('エラー', '閉園時刻内に収まるルートが見つかりませんでした');
      }
    } catch (error) {
      console.error('Retry error:', error);
      Alert.alert('エラー', '再計算中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const navigateToResult = (route, endTimeMinutes) => {
    console.log('navigateToResult called with route length:', route.length);
    try {
      navigation.navigate('RouteResult', {
        route,
        startTime,
        endTime: endTimeOption === 'closing' ? '21:00' : customEndTime,
        endTimeMinutes,
      });
      console.log('Navigation successful');
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('エラー', `画面遷移中にエラーが発生しました: ${error.message}`);
    }
  };

  // デバッグ用のログ（レンダリング時のみ）
  useEffect(() => {
    console.log('Render - loading:', loading, 'progress:', progress, 'method:', optimizationMethod);
  }, [loading, progress, optimizationMethod]);
  
  if (loading) {
    console.log('Rendering LoadingSpinner - loading is true');
    return (
      <View style={{ flex: 1, backgroundColor: '#E8D5FF' }}>
        <LoadingSpinner
          progress={optimizationMethod === 'exhaustive' ? progress : null}
          message={
            optimizationMethod === 'exhaustive'
              ? '✨ 全探索で最適ルートを計算中... ✨'
              : '✨ ルートを最適化中... ✨'
          }
        />
      </View>
    );
  }

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
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={styles.settingsButton}
            >
              <Text style={styles.settingsButtonText}>⚙️</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>ルート設定</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>開始時刻</Text>
          <TextInput
            style={styles.timeInput}
            value={startTime}
            onChangeText={setStartTime}
            placeholder="09:00"
            keyboardType="numeric"
          />
          <Text style={styles.hint}>範囲: 09:00 - 21:00</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>退園時刻</Text>
          <View style={styles.optionButtons}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                endTimeOption === 'closing' && styles.optionButtonActive,
              ]}
              onPress={() => setEndTimeOption('closing')}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  endTimeOption === 'closing' && styles.optionButtonTextActive,
                ]}
              >
                閉園まで (21:00)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                endTimeOption === 'custom' && styles.optionButtonActive,
              ]}
              onPress={() => setEndTimeOption('custom')}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  endTimeOption === 'custom' && styles.optionButtonTextActive,
                ]}
              >
                時刻指定
              </Text>
            </TouchableOpacity>
          </View>
          {endTimeOption === 'custom' && (
            <TextInput
              style={styles.timeInput}
              value={customEndTime}
              onChangeText={setCustomEndTime}
              placeholder="21:00"
              keyboardType="numeric"
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>最適化方法</Text>
          {[
            { key: 'time', label: '時間最短', desc: '待ち時間を考慮した最短時間ルート' },
            { key: 'distance', label: '距離最短', desc: '移動距離が最短のルート' },
            {
              key: 'exhaustive',
              label: '全探索',
              desc: '10地点以下で真の最適解を探索（時間がかかります）',
            },
            { key: 'user', label: '選択順', desc: '選択した順番で回る' },
          ].map(method => (
            <TouchableOpacity
              key={method.key}
              style={[
                styles.methodButton,
                optimizationMethod === method.key && styles.methodButtonActive,
              ]}
              onPress={() => setOptimizationMethod(method.key)}
            >
              <Text
                style={[
                  styles.methodButtonText,
                  optimizationMethod === method.key && styles.methodButtonTextActive,
                ]}
              >
                {method.label}
              </Text>
              <Text style={styles.methodDesc}>{method.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.optimizeButton} 
          onPress={() => {
            console.log('Button pressed');
            handleOptimize();
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#6B46C1', '#8B5CF6']}
            style={styles.optimizeButtonGradient}
          >
            <Text style={styles.optimizeButtonText}>ルートを最適化 ✨</Text>
          </LinearGradient>
        </TouchableOpacity>
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
  settingsButton: {
    padding: 8,
  },
  settingsButtonText: {
    fontSize: 24,
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
  timeInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  optionButtons: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  optionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
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
    marginBottom: 4,
  },
  methodButtonTextActive: {
    color: '#6B46C1',
  },
  methodDesc: {
    fontSize: 12,
    color: '#666',
  },
  optimizeButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  optimizeButtonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  optimizeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
