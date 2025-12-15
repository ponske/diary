import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AttractionCard from '../components/AttractionCard';
import { DataLoader } from '../services/DataLoader';
import { StorageService } from '../utils/storage';

export default function AttractionSelectionScreen({ navigation }) {
  const [attractions, setAttractions] = useState([]);
  const [selectedAttractions, setSelectedAttractions] = useState([]);
  const [currentPriority, setCurrentPriority] = useState('medium');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    saveSelectedAttractions();
  }, [selectedAttractions]);

  const loadData = async () => {
    try {
      setLoading(true);
      const loadedAttractions = await DataLoader.loadAttractions();
      setAttractions(loadedAttractions);
      
      // 保存された選択を復元
      const saved = await StorageService.getSelectedAttractions();
      if (saved && saved.length > 0) {
        const restored = saved.map(item => ({
          attraction: loadedAttractions.find(a => a.id === item.attractionId),
          priority: item.priority,
          order: item.order,
        })).filter(item => item.attraction);
        setSelectedAttractions(restored);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSelectedAttractions = async () => {
    const toSave = selectedAttractions.map((item, index) => ({
      attractionId: item.attraction.id,
      priority: item.priority,
      order: index + 1,
    }));
    await StorageService.setSelectedAttractions(toSave);
  };

  const filteredAttractions = useMemo(() => {
    if (!searchQuery) return attractions;
    const query = searchQuery.toLowerCase();
    return attractions.filter(attr =>
      attr.name.toLowerCase().includes(query) ||
      attr.areaName.toLowerCase().includes(query)
    );
  }, [attractions, searchQuery]);

  const handleAttractionPress = (attraction) => {
    const index = selectedAttractions.findIndex(
      item => item.attraction.id === attraction.id
    );

    if (index >= 0) {
      // 選択解除
      const newSelected = selectedAttractions.filter((_, i) => i !== index);
      // 順番を再振り当て
      const reordered = newSelected.map((item, i) => ({
        ...item,
        order: i + 1,
      }));
      setSelectedAttractions(reordered);
    } else {
      // 選択追加
      const newItem = {
        attraction,
        priority: currentPriority,
        order: selectedAttractions.length + 1,
      };
      setSelectedAttractions([...selectedAttractions, newItem]);
    }
  };

  const handlePriorityChange = (priority) => {
    setCurrentPriority(priority);
  };

  const getAttractionSelectionStatus = (attraction) => {
    const selected = selectedAttractions.find(
      item => item.attraction.id === attraction.id
    );
    return selected
      ? { isSelected: true, priority: selected.priority, order: selected.order }
      : { isSelected: false, priority: null, order: 0 };
  };

  const handleRouteOptimize = () => {
    if (selectedAttractions.length < 2) {
      alert('2つ以上のアトラクションを選択してください');
      return;
    }
    navigation.navigate('RouteSettings', {
      selectedAttractions: selectedAttractions.map(item => ({
        attraction: item.attraction,
        priority: item.priority,
      })),
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6B46C1" />
        <Text style={styles.loadingText}>データを読み込み中...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#E8D5FF', '#FFFFFF']}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>✨ WonderPasNavi ✨</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={styles.settingsButton}
          >
            <Text style={styles.settingsButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>アトラクションを選択してください</Text>
      </View>

      <View style={styles.prioritySelector}>
        <Text style={styles.priorityLabel}>優先度:</Text>
        {['high', 'medium', 'low'].map(priority => (
          <TouchableOpacity
            key={priority}
            style={[
              styles.priorityButton,
              currentPriority === priority && styles.priorityButtonActive,
            ]}
            onPress={() => handlePriorityChange(priority)}
          >
            <Text
              style={[
                styles.priorityButtonText,
                currentPriority === priority && styles.priorityButtonTextActive,
              ]}
            >
              {priority === 'high' ? '高' : priority === 'medium' ? '中' : '低'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="アトラクションを検索..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor="#999"
      />

      <FlatList
        data={filteredAttractions}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => {
          const status = getAttractionSelectionStatus(item);
          return (
            <AttractionCard
              attraction={item}
              isSelected={status.isSelected}
              priority={status.priority}
              order={status.order}
              onPress={() => handleAttractionPress(item)}
            />
          );
        }}
        contentContainerStyle={styles.listContent}
      />

      {selectedAttractions.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.selectedCount}>
            {selectedAttractions.length}個のアトラクションを選択中
          </Text>
          <TouchableOpacity
            style={styles.optimizeButton}
            onPress={handleRouteOptimize}
          >
            <LinearGradient
              colors={['#6B46C1', '#8B5CF6']}
              style={styles.optimizeButtonGradient}
            >
              <Text style={styles.optimizeButtonText}>ルートを決める ✨</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8D5FF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B46C1',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6B46C1',
  },
  settingsButton: {
    padding: 8,
  },
  settingsButtonText: {
    fontSize: 24,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  prioritySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  priorityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 12,
  },
  priorityButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
  },
  priorityButtonActive: {
    backgroundColor: '#6B46C1',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  priorityButtonTextActive: {
    color: '#FFFFFF',
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  listContent: {
    paddingBottom: 100,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  selectedCount: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  optimizeButton: {
    borderRadius: 12,
    overflow: 'hidden',
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
