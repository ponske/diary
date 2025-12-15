import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';

import AttractionCard from '../components/AttractionCard';
import GlassPanel from '../components/GlassPanel';
import AppBackground from '../components/AppBackground';
import { DataLoader } from '../services/DataLoader';
import { StorageService } from '../utils/storage';
import { Theme } from '../theme';

export default function AttractionSelectionScreen({ navigation }) {
  const [attractions, setAttractions] = useState([]);
  const [selected, setSelected] = useState([]); // [{ type:'attraction'|'reservation', ... }]
  const [currentPriority, setCurrentPriority] = useState('medium');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [waitingTimes, setWaitingTimes] = useState([]);
  const [sortMode, setSortMode] = useState('popular'); // popular | wait | user | genre | area
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [resName, setResName] = useState('');
  const [resArea, setResArea] = useState('');
  const [resTime, setResTime] = useState('12:00');
  const [resDuration, setResDuration] = useState('60');
  const [showResTimePicker, setShowResTimePicker] = useState(false);

  const formatHHMM = (d) => {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const hhmmToDate = (s) => {
    const d = new Date();
    const parts = String(s || '12:00').split(':');
    const hh = parseInt(parts[0], 10);
    const mm = parseInt(parts[1], 10);
    d.setHours(Number.isNaN(hh) ? 12 : hh, Number.isNaN(mm) ? 0 : mm, 0, 0);
    return d;
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const list = await DataLoader.loadAttractions();
      setAttractions(list);

      const wt = await DataLoader.loadWaitingTimes();
      setWaitingTimes(wt);

      const saved = await StorageService.getSelectedAttractions();
      if (Array.isArray(saved) && saved.length > 0) {
        const restored = saved
          .map((x) => {
            if (x.type === 'reservation') {
              return {
                type: 'reservation',
                reservationName: x.reservationName,
                reservationArea: x.reservationArea,
                reservationTime: x.reservationTime,
                durationMinutes: x.durationMinutes,
                priority: x.priority || 'high',
              };
            }
            const attraction = list.find((a) => a.id === x.attractionId);
            if (!attraction) return null;
            return { type: 'attraction', attraction, priority: x.priority };
          })
          .filter(Boolean);

        setSelected(restored.map((x, i) => ({ ...x, order: i + 1 })));
      }

      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const toSave = selected.map((x, i) => {
        if (x.type === 'reservation') {
          return {
            type: 'reservation',
            reservationName: x.reservationName,
            reservationArea: x.reservationArea,
            reservationTime: x.reservationTime,
            durationMinutes: x.durationMinutes,
            priority: x.priority || 'high',
            order: i + 1,
          };
        }
        return {
          type: 'attraction',
          attractionId: x.attraction.id,
          priority: x.priority,
          order: i + 1,
        };
      });
      await StorageService.setSelectedAttractions(toSave);
    })();
  }, [selected]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return attractions;
    return attractions.filter((a) => {
      const name = (a.name || '').toLowerCase();
      const area = (a.areaName || '').toLowerCase();
      return name.includes(q) || area.includes(q);
    });
  }, [attractions, searchQuery]);

  const waitingMap = useMemo(() => {
    const map = {};
    for (const wt of waitingTimes || []) {
      if (!wt) continue;
      if (wt.attr_id == null) continue;
      map[String(wt.attr_id)] = wt;
    }
    return map;
  }, [waitingTimes]);

  const getWaitingMinutes = (attraction) => {
    const key = attraction?.officialId ? String(attraction.officialId) : '';
    const wt = key ? waitingMap[key] : null;
    return typeof wt?.waiting_minutes === 'number' ? wt.waiting_minutes : null;
  };

  const sorted = useMemo(() => {
    const priorityScore = { high: 3, medium: 2, low: 1 };
    const selectedMap = new Map(selected.filter((x) => x.type === 'attraction').map((x) => [x.attraction.id, x]));

    const genreOf = (name) => {
      const n = name || '';
      if (n.includes('グリーティング')) return 'グリーティング';
      if (n.includes('シアター')) return 'シアター';
      if (n.includes('レストラン')) return 'レストラン';
      if (n.includes('ショー')) return 'ショー';
      return 'アトラクション';
    };

    const areaKey = (a) => (a.areaName && a.areaName.trim() ? a.areaName.trim() : '（未設定）');

    const list = [...filtered];
    list.sort((a, b) => {
      if (sortMode === 'popular') {
        const aw = getWaitingMinutes(a);
        const bw = getWaitingMinutes(b);
        const ad = aw == null ? -1 : aw;
        const bd = bw == null ? -1 : bw;
        if (bd !== ad) return bd - ad;
        return (a.name || '').localeCompare(b.name || '', 'ja');
      }
      if (sortMode === 'wait') {
        const aw = getWaitingMinutes(a);
        const bw = getWaitingMinutes(b);
        const ad = aw == null ? Infinity : aw;
        const bd = bw == null ? Infinity : bw;
        if (ad !== bd) return ad - bd;
        return (a.name || '').localeCompare(b.name || '', 'ja');
      }
      if (sortMode === 'user') {
        const as = selectedMap.get(a.id);
        const bs = selectedMap.get(b.id);
        if (!!as !== !!bs) return as ? -1 : 1;
        if (as && bs) {
          const ap = priorityScore[as.priority] || 0;
          const bp = priorityScore[bs.priority] || 0;
          if (bp !== ap) return bp - ap;
          return (as.order || 0) - (bs.order || 0);
        }
        return (a.name || '').localeCompare(b.name || '', 'ja');
      }
      if (sortMode === 'genre') {
        const ag = genreOf(a.name);
        const bg = genreOf(b.name);
        if (ag !== bg) return ag.localeCompare(bg, 'ja');
        return (a.name || '').localeCompare(b.name || '', 'ja');
      }
      if (sortMode === 'area') {
        const aa = areaKey(a);
        const ba = areaKey(b);
        if (aa !== ba) return aa.localeCompare(ba, 'ja');
        return (a.name || '').localeCompare(b.name || '', 'ja');
      }
      return 0;
    });

    return list;
  }, [filtered, sortMode, selected, waitingMap]);

  const selectionStatus = (attraction) => {
    const found = selected.find((x) => x.type === 'attraction' && x.attraction.id === attraction.id);
    if (!found) return { isSelected: false, priority: null, order: 0 };
    return { isSelected: true, priority: found.priority, order: found.order };
  };

  const toggleSelect = (attraction) => {
    const idx = selected.findIndex((x) => x.type === 'attraction' && x.attraction.id === attraction.id);
    if (idx >= 0) {
      const next = selected.filter((_, i) => i !== idx);
      setSelected(next.map((x, i) => ({ ...x, order: i + 1 })));
      return;
    }
    const next = [...selected, { type: 'attraction', attraction, priority: currentPriority, order: selected.length + 1 }];
    setSelected(next);
  };

  const addReservation = () => {
    const name = resName.trim();
    if (!name) {
      alert('レストラン名を入力してください');
      return;
    }
    const time = resTime.trim();
    if (!/^\d{1,2}:\d{2}$/.test(time)) {
      alert('予約時刻はHH:MM形式で入力してください（例: 12:30）');
      return;
    }
    const dur = parseInt(resDuration, 10);
    if (Number.isNaN(dur) || dur <= 0) {
      alert('滞在時間（分）を正しく入力してください');
      return;
    }
    const next = [
      ...selected,
      {
        type: 'reservation',
        reservationName: name,
        reservationArea: resArea.trim(),
        reservationTime: time,
        durationMinutes: dur,
        priority: 'high',
        order: selected.length + 1,
      },
    ];
    setSelected(next);
    setResName('');
    setResArea('');
    setResTime('12:00');
    setResDuration('60');
    setShowReservationForm(false);
  };

  const removeReservationAt = (index) => {
    const next = selected.filter((_, i) => i !== index);
    setSelected(next.map((x, i) => ({ ...x, order: i + 1 })));
  };

  const goNext = () => {
    if (selected.length < 2) {
      alert('2つ以上の訪問地点を選択してください');
      return;
    }
    navigation.navigate('RouteSettings', {
      selectedAttractions: selected.map((x) => {
        if (x.type === 'reservation') {
          return {
            type: 'reservation',
            reservationName: x.reservationName,
            reservationArea: x.reservationArea,
            reservationTime: x.reservationTime,
            durationMinutes: x.durationMinutes,
            priority: x.priority || 'high',
          };
        }
        return { type: 'attraction', attraction: x.attraction, priority: x.priority };
      }),
    });
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>データを読み込み中...</Text>
      </View>
    );
  }

  return (
    <AppBackground>
      <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {/* タイトルは非表示（一覧の表示領域を優先） */}
          <View />
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.settingsButton}>
            <Text style={styles.settingsButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>行きたい場所を選んでください</Text>
      </View>

      <GlassPanel style={styles.prioritySelector}>
        <Text style={styles.priorityLabel}>優先度:</Text>
        {[
          { key: 'high', label: '高' },
          { key: 'medium', label: '中' },
          { key: 'low', label: '低' },
        ].map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[styles.priorityButton, currentPriority === p.key && styles.priorityButtonActive]}
            onPress={() => setCurrentPriority(p.key)}
          >
            <Text
              style={[styles.priorityButtonText, currentPriority === p.key && styles.priorityButtonTextActive]}
            >
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </GlassPanel>

      <View style={styles.sortRow}>
        {[
          { key: 'popular', label: '人気順' },
          { key: 'wait', label: '待ち時間' },
          { key: 'user', label: '優先度' },
          { key: 'genre', label: 'ジャンル' },
          { key: 'area', label: 'エリア' },
        ].map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[styles.sortPill, sortMode === s.key && styles.sortPillActive]}
            onPress={() => setSortMode(s.key)}
          >
            <Text style={[styles.sortPillText, sortMode === s.key && styles.sortPillTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.reservationRow}>
        <TouchableOpacity
          style={[styles.reservationToggle, showReservationForm && styles.reservationToggleActive]}
          onPress={() => setShowReservationForm((v) => !v)}
        >
          <Text style={[styles.reservationToggleText, showReservationForm && styles.reservationToggleTextActive]}>
            ＋ 予約レストラン
          </Text>
        </TouchableOpacity>

        {selected.some((x) => x.type === 'reservation') && (
          <Text style={styles.reservationHint}>予約: {selected.filter((x) => x.type === 'reservation').length}件</Text>
        )}
      </View>

      {showReservationForm && (
        <View style={styles.reservationForm}>
          <TextInput
            style={styles.resInput}
            placeholder="レストラン名"
            value={resName}
            onChangeText={setResName}
            placeholderTextColor="#9CA3AF"
          />
          <View style={styles.resRow2}>
            <TextInput
              style={[styles.resInput, styles.resHalf]}
              placeholder="エリア（任意）"
              value={resArea}
              onChangeText={setResArea}
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity
              style={[styles.resInput, styles.resQuarter, styles.resTimeButton]}
              onPress={() => setShowResTimePicker(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.resTimeText}>{resTime}</Text>
            </TouchableOpacity>
            <TextInput
              style={[styles.resInput, styles.resQuarter]}
              placeholder="分"
              value={resDuration}
              onChangeText={setResDuration}
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          {showResTimePicker && (
            <View style={styles.resPickerWrap}>
              <DateTimePicker
                value={hhmmToDate(resTime)}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => {
                  if (Platform.OS !== 'ios') setShowResTimePicker(false);
                  if (date) setResTime(formatHHMM(date));
                }}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity style={styles.resPickerDone} onPress={() => setShowResTimePicker(false)}>
                  <Text style={styles.resPickerDoneText}>完了</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          <TouchableOpacity style={styles.resAddButton} onPress={addReservation}>
            <Text style={styles.resAddButtonText}>追加</Text>
          </TouchableOpacity>
        </View>
      )}

      {selected.some((x) => x.type === 'reservation') && (
        <View style={styles.reservationChips}>
          {selected.map((x, idx) => {
            if (x.type !== 'reservation') return null;
            const label = `${x.reservationTime} ${x.reservationName}`;
            return (
              <TouchableOpacity key={`res-${idx}`} style={styles.resChip} onPress={() => removeReservationAt(idx)}>
                <Text style={styles.resChipText} numberOfLines={1}>
                  {label} ✕
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <TextInput
        style={styles.searchInput}
        placeholder="検索（名称）..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor="rgba(17,24,39,0.45)"
        selectionColor={Theme.colors.primary}
      />

      <FlatList
        data={sorted}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.columnWrap}
        renderItem={({ item }) => {
          const st = selectionStatus(item);
          return (
            <AttractionCard
              attraction={item}
              isSelected={st.isSelected}
              priority={st.priority}
              order={st.order}
              onPress={() => toggleSelect(item)}
              style={styles.gridCard}
            />
          );
        }}
        contentContainerStyle={styles.listContent}
      />

      <GlassPanel style={styles.footer}>
        <Text style={styles.selectedCount}>{selected.length}件 選択中</Text>
        <TouchableOpacity style={[styles.nextButton, selected.length < 2 && styles.nextButtonDisabled]} onPress={goNext}>
          <LinearGradient colors={Theme.gradients.primary} style={styles.nextButtonGradient}>
            <Text style={styles.nextButtonText}>ルートを決める ✨</Text>
          </LinearGradient>
        </TouchableOpacity>
      </GlassPanel>
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8D5FF',
  },
  loadingText: { marginTop: 12, fontSize: 14, color: Theme.colors.primaryDark, fontFamily: Theme.fonts.regular },
  header: { paddingHorizontal: 16, paddingTop: 54, paddingBottom: 8 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subtitle: {
    fontSize: 14,
    fontFamily: Theme.fonts.bold,
    color: 'rgba(255,255,255,0.96)',
    textShadowColor: 'rgba(0,0,0,0.40)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  settingsButton: { padding: 8 },
  settingsButtonText: { fontSize: 22 },
  prioritySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
  },
  priorityLabel: { fontSize: 14, fontFamily: Theme.fonts.bold, color: Theme.colors.text, marginRight: 12 },
  priorityButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.55)',
    marginRight: 8,
  },
  priorityButtonActive: { backgroundColor: Theme.colors.primary },
  priorityButtonText: { fontSize: 14, fontFamily: Theme.fonts.regular, color: Theme.colors.textMuted },
  priorityButtonTextActive: { color: '#FFFFFF' },
  sortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sortPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Theme.colors.glassStrong,
    borderWidth: 1,
    borderColor: Theme.colors.strokeSoft,
  },
  sortPillActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  sortPillText: {
    fontSize: 12,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.textMuted,
  },
  sortPillTextActive: {
    color: '#FFFFFF',
  },
  reservationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  reservationToggle: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: Theme.colors.glassStrong,
    borderWidth: 1,
    borderColor: Theme.colors.strokeSoft,
  },
  reservationToggleActive: {
    backgroundColor: Theme.colors.dark,
    borderColor: Theme.colors.dark,
  },
  reservationToggleText: {
    fontFamily: Theme.fonts.bold,
    fontSize: 13,
    color: Theme.colors.text,
  },
  reservationToggleTextActive: {
    color: '#FFFFFF',
  },
  reservationHint: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    fontFamily: Theme.fonts.regular,
  },
  reservationForm: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: Theme.colors.glass,
    borderWidth: 1,
    borderColor: Theme.colors.strokeSoft,
  },
  resInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    fontSize: 14,
  },
  resRow2: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  resHalf: {
    flex: 1,
  },
  resQuarter: {
    width: 86,
  },
  resTimeButton: {
    justifyContent: 'center',
  },
  resTimeText: {
    fontSize: 14,
    fontFamily: Theme.fonts.bold,
    color: '#111827',
    textAlign: 'center',
  },
  resPickerWrap: {
    marginTop: 10,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resPickerDone: {
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  resPickerDoneText: {
    color: '#FFFFFF',
    fontFamily: Theme.fonts.bold,
  },
  resAddButton: {
    marginTop: 10,
    backgroundColor: Theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  resAddButtonText: {
    color: '#FFFFFF',
    fontFamily: Theme.fonts.bold,
  },
  reservationChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  resChip: {
    backgroundColor: 'rgba(11,18,32,0.78)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '100%',
  },
  resChipText: {
    color: '#FFFFFF',
    fontFamily: Theme.fonts.bold,
    fontSize: 12,
  },
  searchInput: {
    // 背景写真が暗めでも文字が沈まないよう、少しだけ不透明を上げる
    backgroundColor: 'rgba(255,255,255,0.66)',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.78)',
    color: '#111827',
    fontFamily: Theme.fonts.regular,
  },
  columnWrap: {
    paddingHorizontal: 10,
    gap: 10,
  },
  gridCard: {
    flex: 1,
    marginHorizontal: 0,
    marginBottom: 10,
  },
  listContent: {
    paddingBottom: 120,
    paddingTop: 2,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    borderRadius: 0,
    backgroundColor: 'rgba(255,255,255,0.0)',
  },
  selectedCount: { textAlign: 'center', color: Theme.colors.textMuted, marginBottom: 10, fontFamily: Theme.fonts.regular },
  nextButton: { borderRadius: 12, overflow: 'hidden' },
  nextButtonDisabled: { opacity: 0.5 },
  nextButtonGradient: { paddingVertical: 14, alignItems: 'center' },
  nextButtonText: { color: '#FFFFFF', fontSize: 17, fontFamily: Theme.fonts.bold },
});
