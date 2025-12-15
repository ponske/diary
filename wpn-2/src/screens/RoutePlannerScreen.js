import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ScrollView,
} from 'react-native';
import {
  buildDistanceOptimizedOrder,
  buildTimeOptimizedOrder,
  buildSelectedOrder,
  buildRouteItems,
  minutesToTimeString,
} from '../logic/routeOptimizer';

const OPTIMIZATION_MODES = ['distance', 'time', 'manual'];

function parseTimeToMinutes(value) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const [hh, mm] = trimmed.split(':');
  const h = Number(hh);
  const m = Number(mm);
  if (
    Number.isNaN(h) ||
    Number.isNaN(m) ||
    h < 0 ||
    h > 23 ||
    m < 0 ||
    m > 59
  ) {
    return null;
  }
  return h * 60 + m;
}

function clampMinutes(value, min, max) {
  if (value == null) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export default function RoutePlannerScreen({ route, navigation }) {
  const { selected } = route.params;

  const [startTimeText, setStartTimeText] = useState('09:00');
  const [endTimeText, setEndTimeText] = useState('21:00');
  const [endMode, setEndMode] = useState('close'); // close | custom
  const [optimizationMode, setOptimizationMode] = useState('distance');
  const [routeResult, setRouteResult] = useState(null);

  const selectedCount = selected.length;

  const computeRoute = () => {
    if (selectedCount < 2) {
      Alert.alert('アトラクション不足', '2つ以上選択してください。');
      return;
    }

    let start = parseTimeToMinutes(startTimeText);
    start = clampMinutes(start, 9 * 60, 21 * 60);

    let end;
    if (endMode === 'close') {
      end = 21 * 60;
    } else {
      end = parseTimeToMinutes(endTimeText);
      end = clampMinutes(end, 10 * 60, 21 * 60);
      if (end <= start) {
        Alert.alert('時刻エラー', '退園時刻は開始時刻より後にしてください。');
        return;
      }
    }

    let ordered;
    if (optimizationMode === 'distance') {
      ordered = buildDistanceOptimizedOrder(selected);
    } else if (optimizationMode === 'time') {
      ordered = buildTimeOptimizedOrder(selected, start);
    } else {
      ordered = buildSelectedOrder(selected);
    }

    const { items, totalDistanceMeters } = buildRouteItems({
      ordered,
      startMinutes: start,
    });

    const lastItem = items[items.length - 1];
    const finishTime = lastItem?.departureTimeMinutes ?? start;

    const exceed = finishTime > end;
    const baseResult = {
      startMinutes: start,
      endMinutes: end,
      items,
      totalDistanceMeters,
      exceed,
    };

    if (!exceed) {
      setRouteResult(baseResult);
      return;
    }

    Alert.alert(
      '閉園時刻をオーバーしています',
      '低優先度のアトラクションを減らして作り直しますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
          onPress: () => setRouteResult(null),
        },
        {
          text: 'そのまま表示',
          onPress: () => setRouteResult(baseResult),
        },
        {
          text: '低優先度を削除して再作成',
          onPress: () => {
            const filtered = ordered.filter((s) => s.priority !== 'low');
            if (filtered.length < 2) {
              Alert.alert(
                '削除後に2件未満',
                '低優先度を削除すると2件未満になるため、そのまま表示します。',
              );
              setRouteResult(baseResult);
              return;
            }
            const { items: items2, totalDistanceMeters: dist2 } = buildRouteItems(
              {
                ordered: filtered,
                startMinutes: start,
              },
            );
            const last2 = items2[items2.length - 1];
            const finish2 = last2?.departureTimeMinutes ?? start;
            setRouteResult({
              startMinutes: start,
              endMinutes: end,
              items: items2,
              totalDistanceMeters: dist2,
              exceed: finish2 > end,
            });
          },
        },
      ],
    );
  };

  const totalDistanceKm = useMemo(() => {
    if (!routeResult) return 0;
    return routeResult.totalDistanceMeters / 1000;
  }, [routeResult]);

  const onCopyRoute = () => {
    if (!routeResult) return;
    const lines = [];
    routeResult.items.forEach((item) => {
      if (item.type === 'attraction') {
        lines.push(
          `${item.index}. ${item.attraction.name}`,
        );
        lines.push(
          `   ${minutesToTimeString(
            item.arrivalTimeMinutes,
          )} 到着 / ${minutesToTimeString(
            item.departureTimeMinutes,
          )} 出発（待ち ${item.waitingMinutes}分 + 体験 ${item.durationMinutes}分）`,
        );
        lines.push('');
      }
    });
    const text = lines.join('\n');
    Alert.alert('コピー', '実装環境では Clipboard 未実装のため、ここではテキストをダイアログに表示します。\n\n' + text);
    // 実機実装時は以下を利用:
    // import * as Clipboard from 'expo-clipboard';
    // Clipboard.setStringAsync(text);
  };

  const onOpenMap = () => {
    if (!routeResult) return;
    navigation.navigate('Map', { items: routeResult.items });
  };

  const renderItem = ({ item }) => {
    if (item.type === 'break') {
      return (
        <View style={styles.resultRow}>
          <Text style={styles.resultIndex}>休憩</Text>
          <View style={styles.resultBody}>
            <Text style={styles.resultTitle}>休憩</Text>
            <Text style={styles.resultMeta}>
              {minutesToTimeString(item.arrivalTimeMinutes)} -
              {minutesToTimeString(item.departureTimeMinutes)} / {item.durationMinutes}分
            </Text>
          </View>
        </View>
      );
    }
    return (
      <View style={styles.resultRow}>
        <Text style={styles.resultIndex}>{item.index}</Text>
        <View style={styles.resultBody}>
          <Text style={styles.resultTitle}>{item.attraction.name}</Text>
          <Text style={styles.resultMeta}>
            到着 {minutesToTimeString(item.arrivalTimeMinutes)} / 出発{' '}
            {minutesToTimeString(item.departureTimeMinutes)}
          </Text>
          <Text style={styles.resultMeta}>
            待ち {item.waitingMinutes}分 / 体験 {item.durationMinutes}分 / 移動{' '}
            {item.travelMinutes}分
          </Text>
          <Text style={styles.resultMeta}>
            優先度:{' '}
            {item.priority === 'high'
              ? '高'
              : item.priority === 'medium'
              ? '中'
              : '低'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>時間設定</Text>
      <View style={styles.row}>
        <Text style={styles.label}>開始時刻</Text>
        <TextInput
          style={styles.timeInput}
          value={startTimeText}
          onChangeText={setStartTimeText}
          placeholder="09:00"
        />
        <Text style={styles.hint}>09:00–21:00</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>退園</Text>
        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              endMode === 'close' && styles.segmentButtonActive,
            ]}
            onPress={() => setEndMode('close')}
          >
            <Text
              style={[
                styles.segmentText,
                endMode === 'close' && styles.segmentTextActive,
              ]}
            >
              閉園まで(21:00)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              endMode === 'custom' && styles.segmentButtonActive,
            ]}
            onPress={() => setEndMode('custom')}
          >
            <Text
              style={[
                styles.segmentText,
                endMode === 'custom' && styles.segmentTextActive,
              ]}
            >
              時刻指定
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {endMode === 'custom' && (
        <View style={styles.row}>
          <Text style={styles.label}>退園時刻</Text>
          <TextInput
            style={styles.timeInput}
            value={endTimeText}
            onChangeText={setEndTimeText}
            placeholder="20:00"
          />
          <Text style={styles.hint}>10:00–21:00</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>最適化方法</Text>
      <View style={styles.segmentRow}>
        {OPTIMIZATION_MODES.map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.segmentButton,
              optimizationMode === mode && styles.segmentButtonActive,
            ]}
            onPress={() => setOptimizationMode(mode)}
          >
            <Text
              style={[
                styles.segmentText,
                optimizationMode === mode && styles.segmentTextActive,
              ]}
            >
              {mode === 'distance'
                ? '距離最短'
                : mode === 'time'
                ? '時間最短'
                : '選択順'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={computeRoute}>
        <Text style={styles.primaryButtonText}>ルートを決める</Text>
      </TouchableOpacity>

      {routeResult && (
        <View style={styles.resultSection}>
          <Text style={styles.sectionTitle}>結果</Text>
          <Text style={styles.summary}>
            総距離: {totalDistanceKm.toFixed(2)} km / スポット数:{' '}
            {routeResult.items.length}
          </Text>
          {routeResult.exceed && (
            <Text style={styles.warning}>
              ※ 閉園時刻を超える可能性があります
            </Text>
          )}
          <FlatList
            data={routeResult.items}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.type}-${index}`}
          />
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={onCopyRoute}>
              <Text style={styles.secondaryButtonText}>ルートをコピー</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={onOpenMap}>
              <Text style={styles.secondaryButtonText}>地図を開く</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7fb',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 80,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    width: 80,
    fontSize: 14,
  },
  timeInput: {
    flex: 0,
    width: 80,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  hint: {
    fontSize: 12,
    color: '#888',
  },
  segmentRow: {
    flexDirection: 'row',
    flex: 1,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  segmentButtonActive: {
    backgroundColor: '#ff7f50',
    borderColor: '#ff7f50',
  },
  segmentText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#444',
  },
  segmentTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: '#ff7f50',
    paddingVertical: 12,
    borderRadius: 999,
  },
  primaryButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  resultSection: {
    marginTop: 16,
    paddingBottom: 24,
  },
  summary: {
    fontSize: 14,
    marginBottom: 4,
  },
  warning: {
    fontSize: 12,
    color: '#d9534f',
    marginBottom: 4,
  },
  resultRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultIndex: {
    width: 32,
    fontWeight: '600',
  },
  resultBody: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  resultMeta: {
    fontSize: 12,
    color: '#666',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ff7f50',
    paddingVertical: 10,
    marginRight: 8,
  },
  secondaryButtonText: {
    textAlign: 'center',
    color: '#ff7f50',
    fontWeight: '600',
  },
});

