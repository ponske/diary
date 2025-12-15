import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function AttractionCard({ 
  attraction, 
  isSelected, 
  priority, 
  order, 
  onPress 
}) {
  const getPriorityColor = () => {
    switch (priority) {
      case 'high':
        return ['#FF6B6B', '#FF8E8E'];
      case 'medium':
        return ['#4ECDC4', '#6EDDD6'];
      case 'low':
        return ['#95E1D3', '#B5F0E6'];
      default:
        return ['#E0E0E0', '#F0F0F0'];
    }
  };

  const getBorderColor = () => {
    if (!isSelected) return '#E0E0E0';
    switch (priority) {
      case 'high':
        return '#FF6B6B';
      case 'medium':
        return '#4ECDC4';
      case 'low':
        return '#95E1D3';
      default:
        return '#6B46C1';
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.card, { borderColor: getBorderColor(), borderWidth: isSelected ? 3 : 1 }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {isSelected && (
        <LinearGradient
          colors={getPriorityColor()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.selectedContent}>
            {order > 0 && (
              <View style={styles.orderBadge}>
                <Text style={styles.orderText}>{order}</Text>
              </View>
            )}
            <Text style={styles.selectedName}>{attraction.name}</Text>
            <Text style={styles.priorityText}>
              {priority === 'high' ? '高' : priority === 'medium' ? '中' : '低'}
            </Text>
          </View>
        </LinearGradient>
      )}
      {!isSelected && (
        <View style={styles.content}>
          <Text style={styles.icon}>{attraction.icon || '🎢'}</Text>
          <Text style={styles.name}>{attraction.name}</Text>
          {attraction.areaName && (
            <Text style={styles.area}>{attraction.areaName}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gradient: {
    padding: 16,
  },
  content: {
    padding: 16,
  },
  selectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  icon: {
    fontSize: 32,
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  selectedName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  area: {
    fontSize: 12,
    color: '#666',
  },
  orderBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B46C1',
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
