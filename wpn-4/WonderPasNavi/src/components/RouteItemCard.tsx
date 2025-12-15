// ルートアイテムカードコンポーネント

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RouteItem, RouteItemType, Priority } from '../types';
import { minutesToTimeString } from '../utils/routeOptimizer';

interface RouteItemCardProps {
  item: RouteItem;
}

const RouteItemCard: React.FC<RouteItemCardProps> = ({ item }) => {
  const getPriorityColor = () => {
    switch (item.priority) {
      case Priority.HIGH:
        return '#FF6B6B';
      case Priority.MEDIUM:
        return '#FFD93D';
      case Priority.LOW:
        return '#6BCB77';
      default:
        return '#DDD';
    }
  };

  const getPriorityLabel = () => {
    switch (item.priority) {
      case Priority.HIGH:
        return '高';
      case Priority.MEDIUM:
        return '中';
      case Priority.LOW:
        return '低';
      default:
        return '';
    }
  };

  if (item.type === RouteItemType.BREAK) {
    return (
      <View style={styles.card}>
        <View style={styles.orderBadgeContainer}>
          <View style={[styles.orderBadge, { backgroundColor: '#95E1D3' }]}>
            <Text style={styles.orderText}>休憩</Text>
          </View>
        </View>
        <View style={styles.content}>
          <Text style={styles.name}>休憩時間</Text>
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>開始:</Text>
            <Text style={styles.timeValue}>
              {minutesToTimeString(item.arrivalTimeMinutes)}
            </Text>
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>終了:</Text>
            <Text style={styles.timeValue}>
              {minutesToTimeString(item.departureTimeMinutes)}
            </Text>
          </View>
          <Text style={styles.duration}>
            休憩時間: {item.breakDuration}分
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.orderBadgeContainer}>
        <View style={styles.orderBadge}>
          <Text style={styles.orderText}>{item.orderNumber}</Text>
        </View>
        {item.priority && (
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: getPriorityColor() },
            ]}
          >
            <Text style={styles.priorityText}>{getPriorityLabel()}</Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.icon}>{item.attraction?.icon}</Text>
          <Text style={styles.name}>{item.attraction?.name}</Text>
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>到着:</Text>
          <Text style={styles.timeValue}>
            {minutesToTimeString(item.arrivalTimeMinutes)}
          </Text>
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>出発:</Text>
          <Text style={styles.timeValue}>
            {minutesToTimeString(item.departureTimeMinutes)}
          </Text>
        </View>
        <View style={styles.detailsRow}>
          <Text style={styles.detail}>移動 {item.travelMinutes}分</Text>
          <Text style={styles.detail}>待ち {item.waitingMinutes}分</Text>
          <Text style={styles.detail}>体験 {item.durationMinutes}分</Text>
        </View>
        {item.attraction?.areaName && (
          <Text style={styles.area}>{item.attraction.areaName}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderBadgeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  orderBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    justifyContent: 'center',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  content: {
    gap: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 24,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    width: 50,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  detail: {
    fontSize: 13,
    color: '#666',
  },
  area: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  duration: {
    fontSize: 14,
    color: '#666',
  },
});

export default RouteItemCard;
