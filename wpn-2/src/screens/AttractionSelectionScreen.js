import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import attractionsData from '../../wpn-1/attractions.json';

const PRIORITIES = ['high', 'medium', 'low'];

function PrioritySelector({ value, onChange }) {
  return (
    <View style={styles.priorityRow}>
      {PRIORITIES.map((p) => (
        <TouchableOpacity
          key={p}
          style={[
            styles.priorityChip,
            value === p && styles.priorityChipActive,
          ]}
          onPress={() => onChange(p)}
        >
          <Text
            style={[
              styles.priorityChipText,
              value === p && styles.priorityChipTextActive,
            ]}
          >
            {p === 'high' ? '高' : p === 'medium' ? '中' : '低'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function AttractionSelectionScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [currentPriority, setCurrentPriority] = useState('high');
  const [selected, setSelected] = useState({});

  const filteredAttractions = useMemo(() => {
    const keyword = search.trim();
    if (!keyword) return attractionsData;
    return attractionsData.filter((a) =>
      a.name.includes(keyword) ||
      (a.translated_name && a.translated_name.toLowerCase().includes(keyword.toLowerCase()))
    );
  }, [search]);

  const toggleSelect = (attr) => {
    setSelected((prev) => {
      const exists = prev[attr.id];
      if (exists) {
        const copy = { ...prev };
        delete copy[attr.id];
        return copy;
      }
      // append with current priority and order
      const order =
        Object.values(prev).reduce((max, v) => Math.max(max, v.order), 0) + 1;
      return {
        ...prev,
        [attr.id]: {
          attraction: attr,
          priority: currentPriority,
          order,
        },
      };
    });
  };

  const selectedList = useMemo(
    () =>
      Object.values(selected).sort((a, b) => a.order - b.order),
    [selected],
  );

  const onNext = () => {
    if (selectedList.length === 0) return;
    navigation.navigate('RoutePlanner', {
      selected: selectedList,
    });
  };

  const renderItem = ({ item }) => {
    const sel = selected[item.id];
    return (
      <TouchableOpacity
        style={[styles.card, sel && styles.cardSelected]}
        onPress={() => toggleSelect(item)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          {item.icon && <Text style={styles.cardIcon}>{item.icon}</Text>}
        </View>
        <Text style={styles.cardSub}>
          {item.area_name} / {item.genre}
        </Text>
        <View style={styles.cardFooter}>
          {sel ? (
            <>
              <Text style={styles.selectedBadge}>選択済み #{sel.order}</Text>
              <Text style={styles.priorityLabel}>
                優先度:{' '}
                {sel.priority === 'high'
                  ? '高'
                  : sel.priority === 'medium'
                  ? '中'
                  : '低'}
              </Text>
            </>
          ) : (
            <Text style={styles.tapHint}>タップで追加</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>行きたいアトラクションを選択</Text>
      <PrioritySelector value={currentPriority} onChange={setCurrentPriority} />
      <TextInput
        style={styles.search}
        placeholder="名前で検索 (例: 美女と野獣)"
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filteredAttractions}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          選択中: {selectedList.length} 件
        </Text>
        <TouchableOpacity
          style={[
            styles.nextButton,
            selectedList.length === 0 && styles.nextButtonDisabled,
          ]}
          onPress={onNext}
          disabled={selectedList.length === 0}
        >
          <Text style={styles.nextButtonText}>ルートを決めるへ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#f7f7fb',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  priorityRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  priorityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 8,
    backgroundColor: '#fff',
  },
  priorityChipActive: {
    backgroundColor: '#ff7f50',
    borderColor: '#ff7f50',
  },
  priorityChipText: {
    fontSize: 14,
    color: '#444',
  },
  priorityChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  search: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 96,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardSelected: {
    borderColor: '#ff7f50',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  cardIcon: {
    fontSize: 20,
  },
  cardSub: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedBadge: {
    fontSize: 12,
    color: '#ff7f50',
    fontWeight: '600',
  },
  priorityLabel: {
    fontSize: 12,
    color: '#444',
  },
  tapHint: {
    fontSize: 12,
    color: '#888',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 14,
  },
  nextButton: {
    backgroundColor: '#ff7f50',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  nextButtonDisabled: {
    backgroundColor: '#ccc',
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

