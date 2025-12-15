// ルート設定画面

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  SelectedAttraction,
  OptimizationMethod,
  RouteResult,
} from '../types';
import {
  calculateRouteResult,
  timeStringToMinutes,
  minutesToTimeString,
} from '../utils/routeOptimizer';
import LoadingSpinner from '../components/LoadingSpinner';

interface RouteSettingsScreenProps {
  selectedAttractions: SelectedAttraction[];
  onRouteCalculated: (result: RouteResult, method: OptimizationMethod) => void;
  onBack: () => void;
}

const RouteSettingsScreen: React.FC<RouteSettingsScreenProps> = ({
  selectedAttractions,
  onRouteCalculated,
  onBack,
}) => {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('21:00');
  const [useClosingTime, setUseClosingTime] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<OptimizationMethod>(
    OptimizationMethod.TIME
  );
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const methods = [
    {
      value: OptimizationMethod.DISTANCE,
      label: '距離最短',
      description: '移動距離が最も短いルート',
    },
    {
      value: OptimizationMethod.TIME,
      label: '時間最短',
      description: '待ち時間を考慮した最短時間ルート',
    },
    {
      value: OptimizationMethod.USER_ORDER,
      label: '選択順',
      description: 'あなたが選んだ順番通り',
    },
    {
      value: OptimizationMethod.BRUTE_FORCE,
      label: '全探索',
      description: '真の最短時間ルート（10件以下の場合のみ）',
      disabled: selectedAttractions.length > 10,
    },
  ];

  const handleCalculateRoute = async () => {
    const startMinutes = timeStringToMinutes(startTime);
    const endMinutes = useClosingTime ? 1260 : timeStringToMinutes(endTime); // 21:00 = 1260分

    if (!useClosingTime && endMinutes <= startMinutes) {
      Alert.alert('エラー', '退園時刻は開始時刻よりも後に設定してください。');
      return;
    }

    // 全探索の場合はスピナーを表示
    if (selectedMethod === OptimizationMethod.BRUTE_FORCE && selectedAttractions.length <= 10) {
      setIsCalculating(true);
      
      // UIスレッドをブロックしないために少し遅延
      await new Promise(resolve => setTimeout(resolve, 100));
      
      try {
        const result = calculateRouteResult(
          selectedAttractions,
          selectedMethod,
          startMinutes,
          endMinutes
        );

        setIsCalculating(false);

        if (result.exceedsClosingTime) {
          Alert.alert(
            '閉園時刻超過',
            'ルートが閉園時刻を超えています。どうしますか？',
            [
              {
                text: 'そのまま表示',
                onPress: () => onRouteCalculated(result, selectedMethod),
              },
              {
                text: '低優先度を削除して再計算',
                onPress: () => handleRemoveLowPriority(startMinutes, endMinutes),
              },
              {
                text: 'キャンセル',
                style: 'cancel',
              },
            ]
          );
        } else {
          onRouteCalculated(result, selectedMethod);
        }
      } catch (error) {
        setIsCalculating(false);
        Alert.alert('エラー', 'ルート計算に失敗しました。');
      }
    } else {
      // 通常の計算
      const result = calculateRouteResult(
        selectedAttractions,
        selectedMethod,
        startMinutes,
        endMinutes
      );

      if (result.exceedsClosingTime) {
        Alert.alert(
          '閉園時刻超過',
          'ルートが閉園時刻を超えています。どうしますか？',
          [
            {
              text: 'そのまま表示',
              onPress: () => onRouteCalculated(result, selectedMethod),
            },
            {
              text: '低優先度を削除して再計算',
              onPress: () => handleRemoveLowPriority(startMinutes, endMinutes),
            },
            {
              text: 'キャンセル',
              style: 'cancel',
            },
          ]
        );
      } else {
        onRouteCalculated(result, selectedMethod);
      }
    }
  };

  const handleRemoveLowPriority = async (startMinutes: number, endMinutes: number) => {
    // 全探索の場合はスピナーを表示
    if (selectedMethod === OptimizationMethod.BRUTE_FORCE) {
      setIsCalculating(true);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    try {
      // 低優先度のアトラクションを削除して再計算
      let filtered = [...selectedAttractions];
      
      while (filtered.length > 0) {
        const result = calculateRouteResult(
          filtered,
          selectedMethod,
          startMinutes,
          endMinutes
        );

        if (!result.exceedsClosingTime) {
          setIsCalculating(false);
          onRouteCalculated(result, selectedMethod);
          return;
        }

        // 最も後ろの低優先度アイテムを削除
        const lowPriorityIndex = filtered.findIndex(
          (item) => item.priority === 'low'
        );

        if (lowPriorityIndex !== -1) {
          filtered.splice(lowPriorityIndex, 1);
        } else {
          // 低優先度がない場合はそのまま表示
          setIsCalculating(false);
          onRouteCalculated(result, selectedMethod);
          return;
        }
      }
      
      setIsCalculating(false);
    } catch (error) {
      setIsCalculating(false);
      Alert.alert('エラー', 'ルート計算に失敗しました。');
    }
  };

  const onStartTimeChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      const hours = selectedDate.getHours();
      const minutes = selectedDate.getMinutes();
      setStartTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    }
  };

  const onEndTimeChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      const hours = selectedDate.getHours();
      const minutes = selectedDate.getMinutes();
      setEndTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    }
  };

  const getDateFromTime = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    return date;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.title}>ルート設定</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>時間設定</Text>

          <View style={styles.timeRow}>
            <Text style={styles.label}>開始時刻:</Text>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => setShowStartPicker(true)}
            >
              <Text style={styles.timeText}>{startTime}</Text>
            </TouchableOpacity>
          </View>

          {showStartPicker && (
            <DateTimePicker
              value={getDateFromTime(startTime)}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={onStartTimeChange}
            />
          )}

          <View style={styles.timeRow}>
            <Text style={styles.label}>退園時刻:</Text>
            <View style={styles.endTimeContainer}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  useClosingTime && styles.optionButtonActive,
                ]}
                onPress={() => setUseClosingTime(true)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    useClosingTime && styles.optionButtonTextActive,
                  ]}
                >
                  閉園まで
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  !useClosingTime && styles.optionButtonActive,
                ]}
                onPress={() => setUseClosingTime(false)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    !useClosingTime && styles.optionButtonTextActive,
                  ]}
                >
                  時刻指定
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {!useClosingTime && (
            <>
              <View style={styles.timeRow}>
                <Text style={styles.label}>終了時刻:</Text>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Text style={styles.timeText}>{endTime}</Text>
                </TouchableOpacity>
              </View>

              {showEndPicker && (
                <DateTimePicker
                  value={getDateFromTime(endTime)}
                  mode="time"
                  is24Hour={true}
                  display="default"
                  onChange={onEndTimeChange}
                />
              )}
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>最適化方法</Text>
          {methods.map((method) => (
            <TouchableOpacity
              key={method.value}
              style={[
                styles.methodCard,
                selectedMethod === method.value && styles.methodCardActive,
                method.disabled && styles.methodCardDisabled,
              ]}
              onPress={() => !method.disabled && setSelectedMethod(method.value)}
              disabled={method.disabled}
            >
              <View style={styles.methodHeader}>
                <View
                  style={[
                    styles.radio,
                    selectedMethod === method.value && styles.radioActive,
                  ]}
                />
                <Text
                  style={[
                    styles.methodLabel,
                    method.disabled && styles.methodLabelDisabled,
                  ]}
                >
                  {method.label}
                </Text>
              </View>
              <Text
                style={[
                  styles.methodDescription,
                  method.disabled && styles.methodDescriptionDisabled,
                ]}
              >
                {method.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            選択中のアトラクション: {selectedAttractions.length}件
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.calculateButton}
          onPress={handleCalculateRoute}
        >
          <Text style={styles.calculateButtonText}>ルートを計算</Text>
        </TouchableOpacity>
      </View>

      <LoadingSpinner
        visible={isCalculating}
        message={`最適なルートを計算中...${
          selectedMethod === OptimizationMethod.BRUTE_FORCE
            ? `\n${selectedAttractions.length}地点の全ての順列を探索`
            : ''
        }`}
      />
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
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: '#333',
  },
  timeButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  endTimeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#DDD',
  },
  optionButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  optionButtonText: {
    fontSize: 14,
    color: '#666',
  },
  optionButtonTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  methodCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#DDD',
    marginBottom: 12,
  },
  methodCardActive: {
    borderColor: '#4A90E2',
    backgroundColor: '#F0F8FF',
  },
  methodCardDisabled: {
    opacity: 0.5,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
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
  methodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  methodLabelDisabled: {
    color: '#999',
  },
  methodDescription: {
    fontSize: 14,
    color: '#666',
    marginLeft: 32,
  },
  methodDescriptionDisabled: {
    color: '#AAA',
  },
  summary: {
    backgroundColor: '#FFF',
    marginTop: 16,
    padding: 16,
    marginBottom: 100,
  },
  summaryText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  calculateButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  calculateButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default RouteSettingsScreen;
