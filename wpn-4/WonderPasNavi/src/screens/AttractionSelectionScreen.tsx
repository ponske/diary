// アトラクション選択画面

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { Attraction, Priority, SelectedAttraction } from '../types';
import { loadAttractions } from '../services/DataLoader';
import AttractionCard from '../components/AttractionCard';
import PrioritySelector from '../components/PrioritySelector';

interface AttractionSelectionScreenProps {
  onNext: (selectedAttractions: SelectedAttraction[]) => void;
}

const AttractionSelectionScreen: React.FC<AttractionSelectionScreenProps> = ({
  onNext,
}) => {
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [selectedAttractions, setSelectedAttractions] = useState<
    Map<number, SelectedAttraction>
  >(new Map());
  const [currentPriority, setCurrentPriority] = useState<Priority>(Priority.MEDIUM);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectionCounter, setSelectionCounter] = useState(1);

  useEffect(() => {
    const loadedAttractions = loadAttractions();
    setAttractions(loadedAttractions);
  }, []);

  const filteredAttractions = attractions.filter((attr) =>
    attr.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAttractionPress = (attraction: Attraction) => {
    const newSelected = new Map(selectedAttractions);

    if (newSelected.has(attraction.id)) {
      // 選択解除
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

  const handleNext = () => {
    const selected = Array.from(selectedAttractions.values());
    if (selected.length > 0) {
      onNext(selected);
    }
  };

  const renderItem = ({ item }: { item: Attraction }) => {
    const selected = selectedAttractions.get(item.id);
    return (
      <AttractionCard
        attraction={item}
        isSelected={!!selected}
        selectionOrder={selected?.selectionOrder}
        priority={selected?.priority}
        onPress={() => handleAttractionPress(item)}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>WonderPasNavi</Text>
        <Text style={styles.subtitle}>行きたいアトラクションを選択</Text>
      </View>

      <PrioritySelector
        selectedPriority={currentPriority}
        onSelect={setCurrentPriority}
      />

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="アトラクションを検索..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          選択中: {selectedAttractions.size}件
        </Text>
      </View>

      <FlatList
        data={filteredAttractions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
      />

      {selectedAttractions.size > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              ルートを決める ({selectedAttractions.size}件)
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#4A90E2',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFF',
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 100,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  nextButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default AttractionSelectionScreen;
