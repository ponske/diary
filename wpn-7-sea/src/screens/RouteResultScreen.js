import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share, TextInput, Keyboard, Platform } from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import * as Clipboard from 'expo-clipboard';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import Slider from '@react-native-community/slider';
import * as MediaLibrary from 'expo-media-library';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { minutesToTime } from '../utils/time';
import { PARK_ENTRANCE, calculateDistance } from '../utils/distance';
import { StorageService } from '../utils/storage';
import { DataLoader } from '../services/DataLoader';
import { RouteOptimizer } from '../services/RouteOptimizer';
import AppBackground from '../components/AppBackground';
import { Theme } from '../theme';

// 「ルートを最適化 ✨」の雰囲気を保ちつつ、透け感を上げた半透明グラデ
const ACTION_GRADIENT_COLORS = ['rgba(37, 99, 235, 0.55)', 'rgba(56, 189, 248, 0.45)'];

// ルート結果画面は Shippori（本文=Antique、見出し/バッジ=Mincho）
const RESULT_FONT_BODY = 'ShipporiAntique_400Regular';
const RESULT_FONT_HEAD = 'ShipporiMincho_700Bold';

function GoldLabel({ children }) {
  return (
    <View style={styles.goldTextWrap}>
      {/* 深い影（彫金っぽい立体感） */}
      <Text style={styles.goldTextShadow}>{children}</Text>
      <Text style={styles.goldTextBase}>{children}</Text>
      <Text style={styles.goldTextHighlight}>{children}</Text>
    </View>
  );
}

function PriorityHearts({ priority }) {
  const count = priority === 'high' ? 3 : priority === 'medium' ? 2 : 1;
  const color =
    priority === 'high'
      ? 'rgba(220, 38, 38, 0.96)' // red-600 濃い赤
      : priority === 'medium'
        ? 'rgba(248, 113, 113, 0.96)' // red-400 薄い赤
        : 'rgba(56, 189, 248, 0.96)'; // sky-400 水色
  return (
    <Text
      style={[
        styles.priorityHearts,
        {
          color,
          textShadowColor: priority === 'low' ? 'rgba(56,189,248,0.55)' : 'rgba(248,113,113,0.55)',
        },
      ]}
    >
      {'♥'.repeat(count)}
    </Text>
  );
}

function getPriorityColor(priority) {
  // 優先度は青の濃淡（濃い=高、普通=中、薄い=低）
  if (priority === 'high') return Theme.colors.high;
  if (priority === 'medium') return Theme.colors.medium;
  if (priority === 'low') return Theme.colors.low;
  return Theme.colors.primary;
}

function formatTimestamp(ts) {
  if (!ts) return '';
  // "2025-12-04T10:09:27.767556" のような形式を想定
  if (typeof ts === 'string' && ts.includes('T')) {
    const [d, t] = ts.split('T');
    const hhmm = t.slice(0, 5);
    return `${d} ${hhmm}`;
  }
  return String(ts);
}

function MapPin({ label, color, glow = false, isStart = false }) {
  return (
    <View style={styles.pinWrap}>
      <View
        style={[
          styles.pinCircle,
          { borderColor: color, backgroundColor: isStart ? '#111827' : 'rgba(255,255,255,0.92)' },
          glow && styles.pinGlow,
          glow && { shadowColor: color },
        ]}
      >
        <Text style={[styles.pinText, { color: isStart ? '#FFFFFF' : color }]}>
          {label}
        </Text>
      </View>
      <View style={[styles.pinStem, { backgroundColor: color }]} />
    </View>
  );
}

export default function RouteResultScreen({ route, navigation }) {
  const {
    route: initialItems,
    startTime,
    endTime,
    endTimeMinutes,
    removedLowPriority,
  } = route.params;

  const uidSeq = useRef(1);
  const makeUid = () => `u${uidSeq.current++}`;

  const [mapSource, setMapSource] = useState('apple'); // apple | osm
  useEffect(() => {
    let mounted = true;
    (async () => {
      const v = await StorageService.getMapSource();
      if (mounted) setMapSource(v || 'apple');
    })();
    const unsub = navigation.addListener('focus', () => {
      StorageService.getMapSource().then((v) => setMapSource(v || 'apple'));
    });
    return () => {
      mounted = false;
      unsub && unsub();
    };
  }, [navigation]);

  const toPlanItems = (rawItems) =>
    (rawItems || []).map((it) => {
      if (it.type === 'break') {
        return {
          uid: makeUid(),
          type: 'break',
          breakLabel: it.breakLabel || '休憩',
          durationMinutes: it.durationMinutes || 30,
          breakMemo: it.breakMemo || '',
        };
      }
      if (it.type === 'reservation') {
        const kind = it.reservationKind || 'restaurant';
        return {
          uid: makeUid(),
          type: 'reservation',
          reservationKind: kind,
          reservationName: it.reservationName || (kind === 'show' ? 'ショー/パレード' : '予約レストラン'),
          reservationArea: it.reservationArea || '',
          reservationTimeMinutes: it.reservationTimeMinutes,
          reservationTime: it.reservationTime || null,
          durationMinutes: it.durationMinutes || 60,
          priority: it.priority || 'high',
        };
      }
      return { uid: makeUid(), type: 'attraction', attraction: it.attraction, priority: it.priority || 'medium' };
    });

  const [planItems, setPlanItems] = useState(() => toPlanItems(initialItems));
  const [items, setItems] = useState(() =>
    (initialItems || []).map((it, i) => ({ ...it, uid: planItems[i]?.uid || makeUid() }))
  );
  const [resultTitle, setResultTitle] = useState('まわるじゅんばん');
  const [selectedMapIndex, setSelectedMapIndex] = useState(null);
  const [polyProgress, setPolyProgress] = useState(0);
  const [activeActionUid, setActiveActionUid] = useState(null);
  const [trackMarkers, setTrackMarkers] = useState(true);

  const mapRef = useRef(null);
  const mapShotRef = useRef(null);

  useEffect(() => {
    (async () => {
      const title = await StorageService.getResultTitle();
      setResultTitle(title || 'まわるじゅんばん');
    })();
  }, []);

  const recalcFromPlan = async (nextPlan) => {
    const wt = await DataLoader.loadWaitingTimes();
    const speed = await StorageService.getWalkingSpeed();
    const optimizer = new RouteOptimizer(wt, speed || 80);
    const computed = optimizer.buildRouteItemsFromOrder(nextPlan, startTime);
    const withUid = computed.map((x, i) => ({ ...x, uid: nextPlan[i]?.uid || makeUid() }));
    setItems(withUid);
  };

  const toPlanFromComputed = (data) =>
    data.map((it) => {
      if (it.type === 'break') {
        return {
          uid: it.uid,
          type: 'break',
          breakLabel: it.breakLabel || '休憩',
          durationMinutes: it.durationMinutes || 30,
          breakMemo: it.breakMemo || '',
        };
      }
      if (it.type === 'reservation') {
        const kind = it.reservationKind || 'restaurant';
        return {
          uid: it.uid,
          type: 'reservation',
          reservationKind: kind,
          reservationName: it.reservationName || (kind === 'show' ? 'ショー/パレード' : '予約レストラン'),
          reservationArea: it.reservationArea || '',
          reservationTimeMinutes: it.reservationTimeMinutes,
          reservationTime: it.reservationTime || null,
          durationMinutes: it.durationMinutes || 60,
          priority: it.priority || 'high',
        };
      }
      return { uid: it.uid, type: 'attraction', attraction: it.attraction, priority: it.priority || 'medium' };
    });

  const insertBreakAfterUid = async (afterUid) => {
    const currentPlan = toPlanFromComputed(items);
    const nextPlan = [...currentPlan];
    const idx = nextPlan.findIndex((p) => p.uid === afterUid);
    const insertAt = idx >= 0 ? idx + 1 : nextPlan.length;
    nextPlan.splice(insertAt, 0, {
      uid: makeUid(),
      type: 'break',
      breakLabel: '休憩',
      durationMinutes: 30,
      breakMemo: '',
    });
    setPlanItems(nextPlan);
    await recalcFromPlan(nextPlan);
  };

  const updateBreakDuration = async (uid, minutes) => {
    const currentPlan = toPlanFromComputed(items);
    const nextPlan = currentPlan.map((p) =>
      p.uid === uid && p.type === 'break'
        ? { ...p, durationMinutes: minutes }
        : p
    );
    setPlanItems(nextPlan);
    await recalcFromPlan(nextPlan);
  };

  const updateBreakMemo = (uid, memo) => {
    // メモは時刻計算に影響しないので再計算しない（軽量）
    setItems((prev) =>
      prev.map((x) => (x.uid === uid && x.type === 'break' ? { ...x, breakMemo: memo } : x))
    );
    setPlanItems((prev) =>
      prev.map((p) => (p.uid === uid && p.type === 'break' ? { ...p, breakMemo: memo } : p))
    );
  };

  const removeItemByUid = async (uid) => {
    const currentPlan = toPlanFromComputed(items);
    const nextPlan = currentPlan.filter((p) => p.uid !== uid);
    if (nextPlan.length < 2) return;
    setPlanItems(nextPlan);
    await recalcFromPlan(nextPlan);
  };

  useEffect(() => {
    // 初回だけ線を伸ばす簡易アニメーション
    let i = 0;
    setPolyProgress(0);
    const id = setInterval(() => {
      i += 1;
      setPolyProgress(Math.min(1, i / 30));
      if (i >= 30) clearInterval(id);
    }, 40);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    // iOSでカスタムMarkerが黒背景でスナップショット化されることがあるため、
    // 初回はtracksViewChanges=trueで確実に描画し、少し待ってからfalseにして固定する
    setTrackMarkers(true);
    const t = setTimeout(() => setTrackMarkers(false), 900);
    return () => clearTimeout(t);
  }, [items.length]);

  const totalDistanceMeters = useMemo(() => {
    // travelMinutes から概算（分速80m）ではなく、表示だけの用途
    let total = 0;
    for (const it of items) {
      if (it?.travelMinutes) total += it.travelMinutes * 80;
    }
    return Math.round(total);
  }, [items]);

  const routeCoords = useMemo(() => {
    const coords = [{ latitude: PARK_ENTRANCE.lat, longitude: PARK_ENTRANCE.lng }];
    for (const it of items) {
      if (it.type === 'attraction' && it.attraction) {
        coords.push({ latitude: it.attraction.entranceLat, longitude: it.attraction.entranceLng });
      }
    }
    return coords;
  }, [items]);

  const routePathMeta = useMemo(() => {
    const coords = routeCoords;
    const cum = [0];
    let total = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      const a = coords[i];
      const b = coords[i + 1];
      const d = calculateDistance(a.latitude, a.longitude, b.latitude, b.longitude);
      total += d;
      cum.push(total);
    }
    return { cum, total };
  }, [routeCoords]);

  const animatedCoords = useMemo(() => {
    const coords = routeCoords;
    if (coords.length <= 1) return coords;
    const p = Math.max(0, Math.min(1, polyProgress));
    if (p <= 0) return [coords[0], coords[0]];
    if (p >= 1) return coords;

    const { cum, total } = routePathMeta;
    if (total <= 0) return coords;

    const target = total * p;
    const out = [coords[0]];

    // cum[i] = coords[i] までの累積距離
    let segIndex = 0;
    while (segIndex < cum.length - 1 && cum[segIndex + 1] < target) {
      out.push(coords[segIndex + 1]);
      segIndex += 1;
    }

    const segStart = coords[segIndex];
    const segEnd = coords[segIndex + 1] || coords[segIndex];
    const segLen = (cum[segIndex + 1] || cum[segIndex]) - cum[segIndex];
    const remain = Math.max(0, target - cum[segIndex]);
    const t = segLen > 0 ? remain / segLen : 0;
    out.push({
      latitude: segStart.latitude + (segEnd.latitude - segStart.latitude) * t,
      longitude: segStart.longitude + (segEnd.longitude - segStart.longitude) * t,
    });

    if (out.length === 1) out.push(coords[0]);
    return out;
  }, [routeCoords, routePathMeta, polyProgress]);

  const mapRegion = useMemo(() => {
    const coords = routeCoords;
    const lats = coords.map((c) => c.latitude);
    const lngs = coords.map((c) => c.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latDelta = Math.max((maxLat - minLat) * 1.7, 0.01);
    const lngDelta = Math.max((maxLng - minLng) * 1.7, 0.01);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  }, [routeCoords]);

  const buildClipboardText = (format) => {
    let text = '';
    if (format === 'detailed') {
      text += `✨ WonderPasNavi ${resultTitle} ✨\n\n`;
      text += `開始: ${startTime}\n`;
      text += `退園: ${endTime}\n\n`;
      for (const it of items) {
        if (it.type === 'break') {
          text += `休憩 ${it.durationMinutes}分（${minutesToTime(it.arrivalTimeMinutes)} → ${minutesToTime(it.departureTimeMinutes)}）\n\n`;
          if (it.breakMemo && String(it.breakMemo).trim()) {
            text += `   メモ: ${String(it.breakMemo).trim()}\n\n`;
          }
          continue;
        }
        if (it.type === 'reservation') {
          const area = it.reservationArea ? ` / ${it.reservationArea}` : '';
          const kind = it.reservationKind || 'restaurant';
          const icon = kind === 'show' ? '🎭' : '🍽️';
          const name = it.reservationName || (kind === 'show' ? 'ショー/パレード' : '予約レストラン');
          text += `${icon} ${name}${area}\n`;
          text += `   ${minutesToTime(it.arrivalTimeMinutes)} 開始 / ${minutesToTime(it.departureTimeMinutes)} 終了（${it.durationMinutes}分）\n\n`;
          continue;
        }
        text += `${it.order}. ${it.attraction.name}\n`;
        text += `   ${minutesToTime(it.arrivalTimeMinutes)} 到着 / ${minutesToTime(it.departureTimeMinutes)} 出発`;
        text += `（待ち ${it.waitingMinutes}分 + 体験 ${it.durationMinutes}分）\n`;
        if (it.waitingTimestamp) {
          text += `   参照: ${formatTimestamp(it.waitingTimestamp)}\n`;
        }
        text += `\n`;
      }
      return text;
    }

    if (format === 'sns') {
      text += `✨ ディズニーシーのルート ✨\n`;
      text += `開始: ${startTime}\n\n`;
      const onlyAttractions = items.filter((x) => x.type === 'attraction');
      for (const it of onlyAttractions.slice(0, 5)) {
        text += `${it.order}. ${it.attraction.name} ${minutesToTime(it.arrivalTimeMinutes)}\n`;
      }
      if (onlyAttractions.length > 5) text += `...他${onlyAttractions.length - 5}件\n`;
      text += `\n#ディズニーシー #WonderPasNavi`;
      return text;
    }

    // simple
    text += `✨ WonderPasNavi ${resultTitle} ✨\n\n`;
    for (const it of items) {
      if (it.type === 'attraction') text += `${it.order}. ${it.attraction.name}\n`;
    }
    return text;
  };

  const copyToClipboard = async () => {
    Alert.alert('コピー形式', '', [
      {
        text: '詳細版',
        onPress: async () => {
          await Clipboard.setStringAsync(buildClipboardText('detailed'));
          Alert.alert('コピー完了', '詳細版をクリップボードにコピーしました');
        },
      },
      {
        text: '簡易版',
        onPress: async () => {
          await Clipboard.setStringAsync(buildClipboardText('simple'));
          Alert.alert('コピー完了', '簡易版をクリップボードにコピーしました');
        },
      },
      {
        text: 'SNS版',
        onPress: async () => {
          await Clipboard.setStringAsync(buildClipboardText('sns'));
          Alert.alert('コピー完了', 'SNS版をクリップボードにコピーしました');
        },
      },
      { text: 'キャンセル', style: 'cancel' },
    ]);
  };

  const shareText = async () => {
    try {
      await Share.share({ message: buildClipboardText('sns') });
    } catch (e) {
      console.error(e);
    }
  };

  const saveMapImage = async () => {
    try {
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('権限が必要です', '写真ライブラリへの保存を許可してください');
        return;
      }

      // MapView.takeSnapshotはカスタムマーカーが黒合成されることがあるため、
      // 「画面に表示されている通り」をViewShotでキャプチャして保存する
      // （黒い四角が“保存した画像だけ”出る問題の対策）
      await new Promise((r) => setTimeout(r, 250));

      let uri = null;
      if (mapShotRef.current) {
        uri = await captureRef(mapShotRef, {
          format: 'jpg',
          quality: 0.95,
          result: 'tmpfile',
        });
      }

      // フォールバック（念のため）
      if (!uri && mapRef.current?.takeSnapshot) {
        uri = await mapRef.current.takeSnapshot({
          width: 1080,
          height: 720,
          format: 'jpg',
          quality: 0.95,
          result: 'file',
        });
      }
      if (!uri) {
        Alert.alert('失敗', '画像の作成に失敗しました');
        return;
      }
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('保存しました', '写真ライブラリに地図画像を保存しました');
    } catch (e) {
      console.error(e);
      Alert.alert('失敗', '地図画像の保存に失敗しました');
    }
  };

  const addBreak = async () => {
    // デフォルトは末尾に追加（任意位置は各カードの「＋休憩」で対応）
    const lastUid = items[items.length - 1]?.uid;
    await insertBreakAfterUid(lastUid);
  };

  const headerComponent = (
    <View>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← 戻る</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.settingsButton}>
            <Text style={styles.settingsButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>✨ {resultTitle} ✨</Text>
        <Text style={styles.subtitle}>
          {items.filter((x) => x.type === 'attraction').length}地点 / 総距離(概算): {totalDistanceMeters}m
        </Text>
        {removedLowPriority && <Text style={styles.notice}>※ 低優先度を除外して再作成しました</Text>}
      </View>

      {/* 地図を“絵画の額縁”っぽく（ゴールド縁＋内側ライン） */}
      <ViewShot ref={mapShotRef} style={styles.mapFrameWrap} options={{ format: 'jpg', quality: 0.95 }}>
        <View style={styles.mapFrame}>
          <LinearGradient
            colors={['rgba(255, 215, 0, 0.65)', 'rgba(255, 248, 220, 0.35)', 'rgba(184, 134, 11, 0.55)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.mapFrameInnerLine} pointerEvents="none" />
          <View style={styles.mapFrameHighlight} pointerEvents="none" />

          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={mapRegion}
              showsUserLocation={false}
              mapType={mapSource === 'osm' ? 'none' : 'standard'}
            >
              {mapSource === 'osm' && (
                <UrlTile
                  urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maximumZ={19}
                  flipY={false}
                />
              )}
              <Marker
                coordinate={{ latitude: PARK_ENTRANCE.lat, longitude: PARK_ENTRANCE.lng }}
                title="スタート"
                tracksViewChanges={trackMarkers}
                anchor={{ x: 0.5, y: 1 }}
              >
                <MapPin label="★" color={Theme.colors.primary} isStart />
              </Marker>
              {items.map((it, idx) => {
                if (it.type !== 'attraction' || !it.attraction) return null;
                return (
                  <Marker
                    key={`${it.uid}-${it.attraction.id}`}
                    coordinate={{ latitude: it.attraction.entranceLat, longitude: it.attraction.entranceLng }}
                    title={`${it.order}. ${it.attraction.name}`}
                    tracksViewChanges={trackMarkers}
                    anchor={{ x: 0.5, y: 1 }}
                    onPress={() => setSelectedMapIndex(selectedMapIndex === idx ? null : idx)}
                  >
                    <MapPin label={String(it.order)} color={getPriorityColor(it.priority)} glow={it.priority === 'high'} />
                  </Marker>
                );
              })}
              <Polyline coordinates={animatedCoords} strokeColor={Theme.colors.primary} strokeWidth={3} />
            </MapView>
          </View>
        </View>
      </ViewShot>

      <View style={styles.routeListHeader}>
        <Text style={styles.dragHint}>カードを長押ししてドラッグで並べ替えできます</Text>
      </View>
    </View>
  );

  const footerComponent = (
    <View style={styles.footerPad}>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={copyToClipboard} activeOpacity={0.85}>
          <LinearGradient colors={ACTION_GRADIENT_COLORS} style={styles.actionButtonGradient}>
            <Text style={styles.actionButtonText}>📋 コピー</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={shareText} activeOpacity={0.85}>
          <LinearGradient colors={ACTION_GRADIENT_COLORS} style={styles.actionButtonGradient}>
            <Text style={styles.actionButtonText}>📤 テキスト共有</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={saveMapImage} activeOpacity={0.85}>
          <LinearGradient colors={ACTION_GRADIENT_COLORS} style={styles.actionButtonGradient}>
            <Text style={styles.actionButtonText}>🗺️ 画像を保存</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={addBreak} activeOpacity={0.85}>
          <LinearGradient colors={ACTION_GRADIENT_COLORS} style={styles.actionButtonGradient}>
            <Text style={styles.actionButtonText}>☕ 休憩を追加</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <AppBackground>
    <View style={styles.container}>
      <DraggableFlatList
        data={items}
        keyExtractor={(it) => it.uid}
        activationDistance={10}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={headerComponent}
        ListFooterComponent={footerComponent}
        onDragEnd={async ({ data }) => {
          setSelectedMapIndex(null);
          const nextPlan = toPlanFromComputed(data);
          setPlanItems(nextPlan);
          await recalcFromPlan(nextPlan);
        }}
        renderItem={({ item: it, drag, isActive, index: idx }) => {
          const isSelected = selectedMapIndex === idx;
          const showActions = activeActionUid === it.uid;

              if (it.type === 'break') {
                return (
                  <ScaleDecorator>
                    <TouchableOpacity
                      onLongPress={drag}
                      onPress={() => setActiveActionUid((v) => (v === it.uid ? null : it.uid))}
                      activeOpacity={0.9}
                    >
                      <View style={[styles.routeItem, { opacity: isActive ? 0.85 : 1 }]}>
                        <View style={styles.routeItemHeader}>
                          <View style={styles.orderBadgeWrap}>
                            <BlurView intensity={60} tint="light" style={styles.orderBadgeGlass}>
                              <LinearGradient
                                colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.00)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={StyleSheet.absoluteFill}
                                pointerEvents="none"
                              />
                            <GoldLabel>{it.order}</GoldLabel>
                            </BlurView>
                          </View>
                        <Text style={styles.attractionName} numberOfLines={1} ellipsizeMode="tail">
                          ☕ 休憩（{it.durationMinutes}分）
                        </Text>
                          <TouchableOpacity onPress={() => removeItemByUid(it.uid)} style={styles.smallAction}>
                            <Text style={styles.smallActionText}>✕</Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.timeText}>
                          {minutesToTime(it.arrivalTimeMinutes)} → {minutesToTime(it.departureTimeMinutes)}
                        </Text>
                        {!!it.breakMemo && String(it.breakMemo).trim() && (
                          <Text style={styles.memoPreview} numberOfLines={2}>
                            メモ: {String(it.breakMemo).trim()}
                          </Text>
                        )}
                        <View style={styles.breakControls}>
                          <Slider
                            minimumValue={5}
                            maximumValue={120}
                            step={5}
                            value={it.durationMinutes || 30}
                            minimumTrackTintColor={Theme.colors.primary}
                            maximumTrackTintColor="#E5E7EB"
                            thumbTintColor="#111827"
                            onSlidingComplete={(v) => updateBreakDuration(it.uid, Math.round(v))}
                          />
                          <Text style={styles.breakHint}>5〜120分（5分刻み）</Text>
                        </View>
                        {showActions && (
                          <>
                            <View style={styles.memoBox}>
                              <Text style={styles.memoLabel}>メモ</Text>
                              <TextInput
                                style={styles.memoInput}
                                placeholder="例: ここで軽食 / トイレ / 写真タイム"
                                placeholderTextColor="#9CA3AF"
                                value={it.breakMemo || ''}
                                onChangeText={(t) => updateBreakMemo(it.uid, t)}
                                multiline
                              />
                            </View>
                          </>
                        )}
                      </View>
                    </TouchableOpacity>
                  </ScaleDecorator>
                );
              }

              if (it.type === 'reservation') {
                const area = it.reservationArea ? `（${it.reservationArea}）` : '';
                const kind = it.reservationKind || 'restaurant';
                const icon = kind === 'show' ? '🎭' : '🍽️';
                const name = it.reservationName || (kind === 'show' ? 'ショー/パレード' : '予約レストラン');
                return (
                  <ScaleDecorator>
                    <TouchableOpacity
                      onLongPress={drag}
                      onPress={() => setActiveActionUid((v) => (v === it.uid ? null : it.uid))}
                      activeOpacity={0.9}
                    >
                      <View style={[styles.routeItem, { opacity: isActive ? 0.85 : 1 }]}>
                        <View style={styles.routeItemHeader}>
                          <View style={styles.orderBadgeWrap}>
                            <BlurView intensity={60} tint="light" style={styles.orderBadgeGlass}>
                              <LinearGradient
                                colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.00)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={StyleSheet.absoluteFill}
                                pointerEvents="none"
                              />
                            <GoldLabel>{it.order}</GoldLabel>
                            </BlurView>
                          </View>
                        <Text style={styles.attractionName} numberOfLines={1} ellipsizeMode="tail">
                          {icon} {name} {area}
                        </Text>
                          <TouchableOpacity onPress={() => removeItemByUid(it.uid)} style={styles.smallAction}>
                            <Text style={styles.smallActionText}>✕</Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.timeText}>
                          {minutesToTime(it.arrivalTimeMinutes)} → {minutesToTime(it.departureTimeMinutes)}（{it.durationMinutes}分）
                        </Text>
                        {showActions && (
                          <TouchableOpacity style={styles.inlineAddBreak} onPress={() => insertBreakAfterUid(it.uid)}>
                            <Text style={styles.inlineAddBreakText}>＋この下に休憩を入れる</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </TouchableOpacity>
                  </ScaleDecorator>
                );
              }

              return (
                <ScaleDecorator>
                  <TouchableOpacity
                    onLongPress={drag}
                    onPress={() => setActiveActionUid((v) => (v === it.uid ? null : it.uid))}
                    activeOpacity={0.9}
                  >
                    <View
                      style={[
                        styles.routeItem,
                        isSelected && styles.routeItemSelected,
                                  { opacity: isActive ? 0.85 : 1 },
                      ]}
                    >
                      <View style={styles.routeItemHeader}>
                        <View style={styles.orderBadgeWrap}>
                          <BlurView intensity={60} tint="light" style={styles.orderBadgeGlass}>
                            <LinearGradient
                              colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.00)']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={StyleSheet.absoluteFill}
                              pointerEvents="none"
                            />
                            <GoldLabel>{it.order}</GoldLabel>
                          </BlurView>
                        </View>
                        <Text style={styles.attractionName} numberOfLines={1} ellipsizeMode="tail">
                          {it.attraction.name}
                        </Text>
                      </View>

                      <Text style={styles.timeText}>
                        {minutesToTime(it.arrivalTimeMinutes)} 到着 → {minutesToTime(it.departureTimeMinutes)} 出発
                      </Text>

                      <View style={styles.details}>
                        <Text style={styles.detailText}>
                          移動 {it.travelMinutes}分 / 待ち {it.waitingMinutes}分 / 体験 {it.durationMinutes}分
                        </Text>
                        <View style={styles.priorityBadgeWrap}>
                          {/* 右下に寄せるための枠は残しつつ、バッジ自体は透明にして“乗ってる感”を消す */}
                          <View style={styles.priorityBadgeGlass}>
                            <PriorityHearts priority={it.priority} />
                          </View>
                        </View>
                      </View>

                      {!!it.waitingTimestamp && <Text style={styles.waitingRef}>参照データ: {formatTimestamp(it.waitingTimestamp)}</Text>}
                      {showActions && (
                        <TouchableOpacity style={styles.inlineAddBreak} onPress={() => insertBreakAfterUid(it.uid)}>
                          <Text style={styles.inlineAddBreakText}>＋この下に休憩を入れる</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                </ScaleDecorator>
              );
            }}
      />
    </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingBottom: 24 },
  header: { padding: 20, paddingTop: 60 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  backButton: { padding: 8 },
  backButtonText: {
    fontSize: 16,
    fontFamily: RESULT_FONT_HEAD,
    color: 'rgba(255,255,255,0.96)',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  settingsButton: { padding: 8 },
  settingsButtonText: { fontSize: 24 },
  title: {
    fontSize: 26,
    fontFamily: RESULT_FONT_HEAD,
    color: 'rgba(255,255,255,0.98)',
    textAlign: 'center',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.86)',
    textAlign: 'center',
    fontFamily: RESULT_FONT_BODY,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  notice: { marginTop: 10, fontSize: 12, color: '#111827', textAlign: 'center', fontFamily: RESULT_FONT_BODY },
  mapFrameWrap: {
    height: 300,
    marginHorizontal: 16,
    marginTop: 6,
    borderRadius: 18,
    overflow: 'hidden',
  },
  mapFrame: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    padding: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.10)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 26,
    elevation: 10,
  },
  mapFrameInnerLine: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(11,18,32,0.28)', // 細い黒ライン
  },
  mapFrameHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: 'rgba(255,255,255,0.18)',
    transform: [{ skewY: '-8deg' }],
    opacity: 0.55,
  },
  mapContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  map: { flex: 1 },
  pinWrap: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  pinGlow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
  },
  pinText: {
    fontSize: 12,
    fontFamily: RESULT_FONT_HEAD,
  },
  pinStem: {
    width: 6,
    height: 8,
    borderRadius: 3,
    marginTop: 2,
    backgroundColor: Theme.colors.primary,
  },
  routeListHeader: { paddingHorizontal: 16, marginTop: 16, marginBottom: 2 },
  dragHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.78)',
    fontFamily: RESULT_FONT_BODY,
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.30)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  routeItem: {
    // スケルトン風の軽いカード
    backgroundColor: 'rgba(255,255,255,0.38)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  routeItemSelected: { backgroundColor: 'rgba(37, 99, 235, 0.12)' },
  routeItemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  // バッジ（番号/優先度）は「ガラス＋金色ラベル」
  orderBadgeWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 12,
    shadowColor: 'rgba(0,0,0,0.45)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 10,
  },
  orderBadgeGlass: {
    flex: 1,
    borderRadius: 17,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityBadgeWrap: {
    borderRadius: 999,
    // バッジは透明にするので影も控えめに（ほぼ無し）
    shadowColor: 'rgba(0,0,0,0.0)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  priorityBadgeGlass: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    // 透明（枠・塗り無し）
    borderWidth: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityHearts: {
    // ハート記号はフォントによっては欠けるので、システムフォールバックを優先
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 13,
    letterSpacing: 1.5,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  // 金文字：濃い金＋ハイライトの2レイヤーで“凝った”質感に
  goldTextWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldTextShadow: {
    position: 'absolute',
    color: 'rgba(120,53,15,0.85)', // amber-900
    fontFamily: RESULT_FONT_HEAD,
    letterSpacing: 0.3,
    transform: [{ translateX: 0.6 }, { translateY: 0.9 }],
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  goldTextBase: {
    color: '#FBBF24', // amber-400（少し濃い金）
    fontFamily: RESULT_FONT_HEAD,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.28)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  goldTextHighlight: {
    position: 'absolute',
    color: '#FFF7D6', // かなり明るい金（光沢）
    fontFamily: RESULT_FONT_HEAD,
    letterSpacing: 0.3,
    opacity: 0.62,
    transform: [{ translateX: -0.6 }, { translateY: -0.6 }],
    textShadowColor: 'rgba(255, 215, 0, 0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  attractionName: { flex: 1, fontSize: 15, lineHeight: 20, fontFamily: RESULT_FONT_HEAD, color: '#111827' },
  timeText: { fontSize: 14, color: '#4B5563', fontFamily: RESULT_FONT_BODY },
  details: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailText: { fontSize: 12, color: '#6B7280', fontFamily: RESULT_FONT_BODY },
  // 旧 priorityBadge/priorityGlow/priorityBadgeText は未使用（ガラス版へ置換）
  waitingRef: { marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.86)', fontFamily: RESULT_FONT_BODY },
  smallAction: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(17,24,39,0.12)',
    marginLeft: 8,
  },
  smallActionText: { fontFamily: RESULT_FONT_HEAD, color: '#111827' },
  breakControls: {
    marginTop: 10,
  },
  breakHint: { marginTop: 6, fontSize: 12, color: '#6B7280', fontFamily: RESULT_FONT_BODY },
  memoPreview: { marginTop: 10, fontSize: 12, color: '#111827', fontFamily: RESULT_FONT_BODY, opacity: 0.85 },
  memoBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  memoLabel: { fontSize: 12, fontFamily: RESULT_FONT_HEAD, color: '#111827', marginBottom: 8 },
  memoInput: { minHeight: 44, fontSize: 14, fontFamily: RESULT_FONT_BODY, color: '#111827' },
  inlineAddBreak: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
  },
  inlineAddBreakText: { color: Theme.colors.primary, fontFamily: RESULT_FONT_BODY, fontSize: 12 },
  actions: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 10, gap: 12 },
  footerPad: { paddingBottom: 24 },
  // 「ルートを最適化 ✨」と同系統のデザイン（ただし透明度は高め）
  actionButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  actionButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  actionButtonText: { color: '#FFFFFF', fontFamily: RESULT_FONT_BODY, fontSize: 15 },
});
