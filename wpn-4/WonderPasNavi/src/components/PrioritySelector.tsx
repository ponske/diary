// 優先度選択コンポーネント

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Priority } from '../types';

interface PrioritySelectorProps {
  selectedPriority: Priority;
  onSelect: (priority: Priority) => void;
}

const PrioritySelector: React.FC<PrioritySelectorProps> = ({
  selectedPriority,
  onSelect,
}) => {
  const priorities = [
    { value: Priority.HIGH, label: '高', color: '#FF6B6B' },
    { value: Priority.MEDIUM, label: '中', color: '#FFD93D' },
    { value: Priority.LOW, label: '低', color: '#6BCB77' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>優先度を選択:</Text>
      <View style={styles.buttonContainer}>
        {priorities.map((priority) => (
          <TouchableOpacity
            key={priority.value}
            style={[
              styles.button,
              { borderColor: priority.color },
              selectedPriority === priority.value && {
                backgroundColor: priority.color,
              },
            ]}
            onPress={() => onSelect(priority.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.buttonText,
                selectedPriority === priority.value && styles.selectedText,
              ]}
            >
              {priority.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  selectedText: {
    color: '#FFF',
  },
});

export default PrioritySelector;
