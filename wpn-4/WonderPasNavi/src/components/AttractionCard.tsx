// アトラクションカードコンポーネント

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Attraction, Priority } from '../types';

interface AttractionCardProps {
  attraction: Attraction;
  isSelected: boolean;
  selectionOrder?: number;
  priority?: Priority;
  onPress: () => void;
}

const AttractionCard: React.FC<AttractionCardProps> = ({
  attraction,
  isSelected,
  selectionOrder,
  priority,
  onPress,
}) => {
  const getPriorityColor = () => {
    switch (priority) {
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
    switch (priority) {
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

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.selectedCard]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{attraction.icon}</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.name} numberOfLines={2}>
            {attraction.name}
          </Text>
          <View style={styles.detailsRow}>
            <Text style={styles.detail}>⏱ {attraction.durationMinutes}分</Text>
            {attraction.waitingMinutes > 0 && (
              <Text style={styles.detail}>待ち {attraction.waitingMinutes}分</Text>
            )}
          </View>
          {attraction.areaName && (
            <Text style={styles.area}>{attraction.areaName}</Text>
          )}
        </View>
        {isSelected && (
          <View style={styles.selectionBadge}>
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: getPriorityColor() },
              ]}
            >
              <Text style={styles.priorityText}>{getPriorityLabel()}</Text>
            </View>
            <View style={styles.orderBadge}>
              <Text style={styles.orderText}>{selectionOrder}</Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#4A90E2',
    backgroundColor: '#F0F8FF',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 28,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  detail: {
    fontSize: 13,
    color: '#666',
  },
  area: {
    fontSize: 12,
    color: '#999',
  },
  selectionBadge: {
    alignItems: 'center',
    gap: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  orderBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
});

export default AttractionCard;
