import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Attraction, Priority, SelectedAttraction } from '../types/Models';
import { loadAttractions } from '../services/DataLoader';

interface AttractionSelectionScreenProps {
  navigation: any;
}

export default function AttractionSelectionScreen({
  navigation,
}: AttractionSelectionScreenProps) {
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [selectedAttractions, setSelectedAttractions] = useState<
    Map<number, SelectedAttraction>
  >(new Map());
  const [currentPriority, setCurrentPriority] = useState<Priority>(
    Priority.High
  );
  const [selectionCounter, setSelectionCounter] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const attractionsData = await loadAttractions();
    const activeAttractions = attractionsData.filter(
      (a) => a.isActive && !a.isInvalid
    );
    setAttractions(activeAttractions);
  };

  const toggleAttraction = (attraction: Attraction) => {
    const newSelected = new Map(selectedAttractions);

    if (newSelected.has(attraction.id)) {
      // 既に選択されている場合は解除
      newSelected.delete(attraction.id);
    } else {
      // 選択
      newSelected.set(attraction.id, {
        attraction,
        priority: currentPriority,
        selectionOrder: selectionCounter,
      });
      setSelectionCounter(selectionCounter + 1);
    }

    setSelectedAttractions(newSelected);
  };

  const getPriorityColor = (priority: Priority): string => {
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

  const getPriorityLabel = (priority: Priority): string => {
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

  const handleNavigateToRoute = () => {
    if (selectedAttractions.size < 2) {
      Alert.alert(
        'アトラクションを選択してください',
        '2つ以上のアトラクションを選択してください。'
      );
      return;
    }

    navigation.navigate('RouteResult', {
      selectedAttractions: Array.from(selectedAttractions.values()),
    });
  };

  const renderAttractionCard = ({ item }: { item: Attraction }) => {
    const selected = selectedAttractions.get(item.id);
    const isSelected = !!selected;

    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => toggleAttraction(item)}
      >
        <View style={styles.cardContent}>
          <Text style={styles.icon}>{item.icon}</Text>
          <View style={styles.cardText}>
            <Text style={styles.attractionName}>{item.name}</Text>
            <Text style={styles.areaName}>{item.areaName}</Text>
            <Text style={styles.duration}>所要時間: {item.durationMinutes}分</Text>
          </View>
          {isSelected && selected && (
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: getPriorityColor(selected.priority) },
              ]}
            >
              <Text style={styles.priorityText}>
                {getPriorityLabel(selected.priority)}
              </Text>
              <Text style={styles.orderText}>#{selected.selectionOrder}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>アトラクションを選択</Text>
        <Text style={styles.subtitle}>
          選択済み: {selectedAttractions.size}件
        </Text>
      </View>

      <View style={styles.prioritySelector}>
        <Text style={styles.priorityLabel}>優先度:</Text>
        <TouchableOpacity
          style={[
            styles.priorityButton,
            { backgroundColor: getPriorityColor(Priority.High) },
            currentPriority === Priority.High && styles.priorityButtonActive,
          ]}
          onPress={() => setCurrentPriority(Priority.High)}
        >
          <Text style={styles.priorityButtonText}>高</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.priorityButton,
            { backgroundColor: getPriorityColor(Priority.Medium) },
            currentPriority === Priority.Medium && styles.priorityButtonActive,
          ]}
          onPress={() => setCurrentPriority(Priority.Medium)}
        >
          <Text style={styles.priorityButtonText}>中</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.priorityButton,
            { backgroundColor: getPriorityColor(Priority.Low) },
            currentPriority === Priority.Low && styles.priorityButtonActive,
          ]}
          onPress={() => setCurrentPriority(Priority.Low)}
        >
          <Text style={styles.priorityButtonText}>低</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={attractions}
        renderItem={renderAttractionCard}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
      />

      <TouchableOpacity
        style={styles.routeButton}
        onPress={handleNavigateToRoute}
      >
        <Text style={styles.routeButtonText}>ルートを決める</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 5,
  },
  prioritySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFFFFF',
    marginTop: 10,
    marginHorizontal: 10,
    borderRadius: 10,
  },
  priorityLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },
  priorityButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  priorityButtonActive: {
    borderWidth: 3,
    borderColor: '#333333',
  },
  priorityButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  list: {
    flex: 1,
    padding: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 40,
    marginRight: 15,
  },
  cardText: {
    flex: 1,
  },
  attractionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  areaName: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 3,
  },
  duration: {
    fontSize: 12,
    color: '#999999',
  },
  priorityBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  priorityText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  orderText: {
    color: '#FFFFFF',
    fontSize: 10,
    marginTop: 2,
  },
  routeButton: {
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
  routeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
