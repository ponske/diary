import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {
  SelectedAttraction,
  OptimizationMethod,
  RouteItem,
  Priority,
  RouteItemType,
} from '../types/Models';
import {
  loadWaitingTimes,
  createWaitingTimesMap,
} from '../services/DataLoader';
import {
  optimizeRoute,
  calculateTotalDistance,
} from '../utils/routeOptimizer';
import { timeStringToMinutes, minutesToTimeString } from '../utils/timeUtils';

interface RouteResultScreenProps {
  route: any;
  navigation: any;
}

export default function RouteResultScreen({
  route,
  navigation,
}: RouteResultScreenProps) {
  const { selectedAttractions } = route.params as {
    selectedAttractions: SelectedAttraction[];
  };

  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('21:00');
  const [useClosingTime, setUseClosingTime] = useState(true);
  const [optimizationMethod, setOptimizationMethod] =
    useState<OptimizationMethod>(OptimizationMethod.Distance);
  const [routeItems, setRouteItems] = useState<RouteItem[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [isCalculated, setIsCalculated] = useState(false);

  const calculateRoute = async () => {
    try {
      const waitingTimes = await loadWaitingTimes();
      const waitingTimesMap = createWaitingTimesMap(waitingTimes);

      const startTimeMinutes = timeStringToMinutes(startTime);
      const endTimeMinutes = useClosingTime
        ? 21 * 60
        : timeStringToMinutes(endTime);

      const { items } = optimizeRoute(
        selectedAttractions,
        optimizationMethod,
        startTimeMinutes,
        waitingTimesMap
      );

      // 閉園時刻超過チェック
      const overTimeItems = items.filter(
        (item) => item.arrivalTimeMinutes > endTimeMinutes
      );

      if (overTimeItems.length > 0) {
        Alert.alert(
          '閉園時刻を超過しています',
          `${overTimeItems.length}件のアトラクションが閉園時刻を超えています。そのまま表示しますか？`,
          [
            {
              text: 'キャンセル',
              style: 'cancel',
            },
            {
              text: '低優先度を削除して再計算',
              onPress: () => {
                // 低優先度のアトラクションを削除して再計算
                const filteredAttractions = selectedAttractions.filter(
                  (sa) => sa.priority !== Priority.Low
                );
                if (filteredAttractions.length >= 2) {
                  const { items: newItems } = optimizeRoute(
                    filteredAttractions,
                    optimizationMethod,
                    startTimeMinutes,
                    waitingTimesMap
                  );
                  setRouteItems(newItems);
                  setTotalDistance(calculateTotalDistance(newItems));
                  setIsCalculated(true);
                } else {
                  Alert.alert(
                    'エラー',
                    '削除後のアトラクション数が2件未満になります。'
                  );
                }
              },
            },
            {
              text: 'そのまま表示',
              onPress: () => {
                setRouteItems(items);
                setTotalDistance(calculateTotalDistance(items));
                setIsCalculated(true);
              },
            },
          ]
        );
        return;
      }

      setRouteItems(items);
      setTotalDistance(calculateTotalDistance(items));
      setIsCalculated(true);
    } catch (error) {
      console.error('Route calculation error:', error);
      Alert.alert('エラー', 'ルート計算中にエラーが発生しました。');
    }
  };

  const getPriorityColor = (priority?: Priority): string => {
    switch (priority) {
      case Priority.High:
        return '#FF6B6B';
      case Priority.Medium:
        return '#4ECDC4';
      case Priority.Low:
        return '#95E1D3';
      default:
        return '#CCCCCC';
    }
  };

  const getPriorityLabel = (priority?: Priority): string => {
    switch (priority) {
      case Priority.High:
        return '高';
      case Priority.Medium:
        return '中';
      case Priority.Low:
        return '低';
      default:
        return '';
    }
  };

  const copyToClipboard = async () => {
    let text = 'まわるじゅんばん\n\n';
    text += `総移動距離: ${totalDistance}m\n`;
    text += `アトラクション数: ${routeItems.filter((item) => item.type === RouteItemType.Attraction).length}件\n\n`;

    routeItems.forEach((item) => {
      if (item.type === RouteItemType.Attraction && item.attraction) {
        text += `${item.order}. ${item.attraction.name}\n`;
        text += `   ${minutesToTimeString(item.arrivalTimeMinutes)} 到着 / ${minutesToTimeString(item.departureTimeMinutes)} 出発\n`;
        text += `   （待ち ${item.waitingMinutes}分 + 体験 ${item.durationMinutes}分）\n\n`;
      }
    });

    await Clipboard.setStringAsync(text);
    Alert.alert('コピー完了', 'ルートをクリップボードにコピーしました。');
  };

  const showMap = () => {
    navigation.navigate('Map', { routeItems });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>時間設定</Text>

          <View style={styles.inputRow}>
            <Text style={styles.label}>開始時刻:</Text>
            <TextInput
              style={styles.input}
              value={startTime}
              onChangeText={setStartTime}
              placeholder="09:00"
            />
          </View>

          <View style={styles.inputRow}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                useClosingTime && styles.toggleButtonActive,
              ]}
              onPress={() => setUseClosingTime(true)}
            >
              <Text style={styles.toggleButtonText}>閉園まで</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                !useClosingTime && styles.toggleButtonActive,
              ]}
              onPress={() => setUseClosingTime(false)}
            >
              <Text style={styles.toggleButtonText}>時刻指定</Text>
            </TouchableOpacity>
          </View>

          {!useClosingTime && (
            <View style={styles.inputRow}>
              <Text style={styles.label}>退園時刻:</Text>
              <TextInput
                style={styles.input}
                value={endTime}
                onChangeText={setEndTime}
                placeholder="21:00"
              />
            </View>
          )}
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>最適化方法</Text>

          <View style={styles.methodButtons}>
            <TouchableOpacity
              style={[
                styles.methodButton,
                optimizationMethod === OptimizationMethod.Distance &&
                  styles.methodButtonActive,
              ]}
              onPress={() => setOptimizationMethod(OptimizationMethod.Distance)}
            >
              <Text style={styles.methodButtonText}>距離最短</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.methodButton,
                optimizationMethod === OptimizationMethod.Time &&
                  styles.methodButtonActive,
              ]}
              onPress={() => setOptimizationMethod(OptimizationMethod.Time)}
            >
              <Text style={styles.methodButtonText}>時間最短</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.methodButton,
                optimizationMethod === OptimizationMethod.Selection &&
                  styles.methodButtonActive,
              ]}
              onPress={() =>
                setOptimizationMethod(OptimizationMethod.Selection)
              }
            >
              <Text style={styles.methodButtonText}>選択順</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.calculateButton}
          onPress={calculateRoute}
        >
          <Text style={styles.calculateButtonText}>ルートを計算する</Text>
        </TouchableOpacity>

        {isCalculated && (
          <>
            <View style={styles.resultSection}>
              <Text style={styles.resultTitle}>まわるじゅんばん</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>
                  総移動距離: {totalDistance}m
                </Text>
                <Text style={styles.summaryText}>
                  アトラクション数:{' '}
                  {
                    routeItems.filter(
                      (item) => item.type === RouteItemType.Attraction
                    ).length
                  }
                  件
                </Text>
              </View>
            </View>

            {routeItems.map((item, index) => {
              if (item.type === RouteItemType.Attraction && item.attraction) {
                return (
                  <View key={index} style={styles.routeCard}>
                    <View style={styles.routeCardHeader}>
                      <Text style={styles.orderNumber}>{item.order}</Text>
                      <View style={styles.routeCardTitle}>
                        <Text style={styles.attractionIcon}>
                          {item.attraction.icon}
                        </Text>
                        <Text style={styles.attractionNameText}>
                          {item.attraction.name}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.priorityBadge,
                          { backgroundColor: getPriorityColor(item.priority) },
                        ]}
                      >
                        <Text style={styles.priorityText}>
                          {getPriorityLabel(item.priority)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.timeInfo}>
                      <Text style={styles.timeText}>
                        🚶 到着:{' '}
                        {minutesToTimeString(item.arrivalTimeMinutes)}
                      </Text>
                      <Text style={styles.timeText}>
                        🏁 出発:{' '}
                        {minutesToTimeString(item.departureTimeMinutes)}
                      </Text>
                    </View>
                    <View style={styles.durationInfo}>
                      <Text style={styles.durationText}>
                        ⏱️ 待ち時間: {item.waitingMinutes}分
                      </Text>
                      <Text style={styles.durationText}>
                        🎢 体験時間: {item.durationMinutes}分
                      </Text>
                    </View>
                  </View>
                );
              }
              return null;
            })}

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={copyToClipboard}
              >
                <Text style={styles.actionButtonText}>📋 コピー</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={showMap}
              >
                <Text style={styles.actionButtonText}>🗺️ 地図を見る</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  settingsSection: {
    backgroundColor: '#FFFFFF',
    margin: 10,
    padding: 15,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333333',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    marginRight: 10,
    width: 100,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  toggleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 5,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#4CAF50',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  methodButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  methodButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 5,
    alignItems: 'center',
  },
  methodButtonActive: {
    backgroundColor: '#2196F3',
  },
  methodButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
  },
  calculateButton: {
    backgroundColor: '#4CAF50',
    padding: 18,
    margin: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  calculateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultSection: {
    backgroundColor: '#FFFFFF',
    margin: 10,
    padding: 15,
    borderRadius: 10,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333333',
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryText: {
    fontSize: 14,
    color: '#666666',
  },
  routeCard: {
    backgroundColor: '#FFFFFF',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginRight: 10,
    width: 30,
  },
  routeCardTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  attractionIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  attractionNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  priorityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 13,
    color: '#555555',
  },
  durationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  durationText: {
    fontSize: 13,
    color: '#777777',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
  },
  actionButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
