import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../theme';

export default function AttractionCard({
  attraction,
  isSelected,
  priority,
  order,
  onPress,
  style,
}) {
  const getPriorityHeart = () => {
    const count = priority === 'high' ? 3 : priority === 'medium' ? 2 : 1;
    const color =
      priority === 'high'
        ? 'rgba(220, 38, 38, 0.98)' // 濃い赤
        : priority === 'medium'
          ? 'rgba(248, 113, 113, 0.98)' // 薄い赤
          : 'rgba(56, 189, 248, 0.98)'; // 水色
    const shadowColor =
      priority === 'low' ? 'rgba(56,189,248,0.65)' : priority === 'medium' ? 'rgba(248,113,113,0.55)' : 'rgba(220,38,38,0.55)';
    return { text: '♥'.repeat(count), color, shadowColor };
  };

  const getPriorityColors = () => {
    if (!isSelected) {
      return { border: Theme.colors.strokeSoft, bg: Theme.colors.glass, badge: Theme.colors.primary };
    }
    // 優先度は青の濃淡（濃い=高、普通=中、薄い=低）
    if (priority === 'high') return { border: Theme.colors.high, bg: 'rgba(30, 64, 175, 0.14)', badge: Theme.colors.high };
    if (priority === 'medium') return { border: Theme.colors.medium, bg: 'rgba(37, 99, 235, 0.12)', badge: Theme.colors.medium };
    return { border: Theme.colors.low, bg: 'rgba(96, 165, 250, 0.12)', badge: Theme.colors.low };
  };

  const colors = getPriorityColors();
  const isHigh = isSelected && priority === 'high';
  const heart = getPriorityHeart();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.card, { borderColor: colors.border, backgroundColor: colors.bg }, style]}
    >
      {/* 「高」だけ、焼き付きっぽいハイライトを重ねて差を出す */}
      {isHigh && (
        <View style={styles.shineWrap} pointerEvents="none">
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0)']}
            locations={[0.0, 0.5, 1.0]}
            start={{ x: 0.0, y: 0.0 }}
            end={{ x: 1.0, y: 1.0 }}
            style={styles.shine}
          />
        </View>
      )}

      {/* 選択時のみ: 左下に番号+優先度（レイアウトは一切変えないオーバーレイ） */}
      {isSelected && (
        <View style={styles.overlay}>
          <View
            style={[
              styles.orderBadge,
              { backgroundColor: colors.badge },
              isHigh && styles.glow,
              isHigh && { shadowColor: colors.badge },
            ]}
          >
            <Text style={styles.orderBadgeText}>{order}</Text>
          </View>
          <View
            style={[
              styles.priorityTag,
              { borderColor: heart.color },
              isHigh && styles.glowSoft,
              isHigh && { shadowColor: colors.badge },
            ]}
          >
            <Text style={[styles.priorityHearts, { color: heart.color, textShadowColor: heart.shadowColor }]}>{heart.text}</Text>
          </View>
        </View>
      )}

      <View style={styles.row}>
        <View style={styles.textArea}>
          <View style={styles.nameWrap}>
            {/* 選択時のみ、薄いブルーで“発光”させて背景に沈まないようにする */}
            {isSelected && (
              <Text style={styles.nameGlow} numberOfLines={2}>
                {attraction.name}
              </Text>
            )}
            <Text style={[styles.name, isSelected && styles.nameSelected]} numberOfLines={2}>
              {attraction.name}
            </Text>
          </View>
          <Text style={styles.meta} numberOfLines={1}>
            {attraction.areaName ? attraction.areaName : '　'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderRadius: Theme.radius.card,
    padding: 10,
    marginBottom: 8,
    // 境界が溶けやすいので、うっすら影を足して浮かせる
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  shineWrap: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Theme.radius.card,
    overflow: 'hidden',
    zIndex: 0,
  },
  shine: {
    position: 'absolute',
    top: -40,
    left: -80,
    width: '180%',
    height: '180%',
    transform: [{ rotate: '18deg' }],
    opacity: 0.22,
  },
  overlay: {
    position: 'absolute',
    left: 5,
    bottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    zIndex: 2,
  },
  glow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 10,
  },
  glowSoft: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  orderBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: Theme.fonts.bold,
  },
  priorityTag: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: Theme.colors.glassStrong,
  },
  priorityHearts: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 10,
    letterSpacing: 1.1,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textArea: {
    flex: 1,
  },
  nameWrap: {
    position: 'relative',
  },
  nameGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    // “焼き付き/発光”の下地。上のTextと重ねる
    color: 'rgba(219,234,254,0.40)', // blue-100
    fontSize: 14,
    fontFamily: Theme.fonts.bold,
    textShadowColor: 'rgba(147,197,253,0.95)', // blue-300
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  name: {
    fontSize: 14,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
  },
  nameSelected: {
    // 文字自体も薄いブルーに寄せて、背景写真でも読めるように
    color: 'rgba(239,246,255,0.98)', // very light blue/white
    textShadowColor: 'rgba(59,130,246,0.40)', // blue glow
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  meta: {
    marginTop: 3,
    fontSize: 12,
    color: Theme.colors.textMuted,
  },
});
