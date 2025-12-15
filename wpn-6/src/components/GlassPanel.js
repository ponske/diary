import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Theme } from '../theme';

export default function GlassPanel({ children, style, intensity = 55 }) {
  const outerStyle = extractOuterStyle(style);
  return (
    <View style={[styles.shadow, outerStyle]}>
      <BlurView intensity={intensity} tint="light" style={[styles.panel, style]}>
        <View style={styles.highlight} pointerEvents="none" />
        {children}
      </BlurView>
    </View>
  );
}

function extractOuterStyle(style) {
  // 影を含む外側に効かせたいものだけ拾う（margin/size系）
  if (!style) return null;
  const s = StyleSheet.flatten(style) || {};
  const out = {};
  const keys = [
    'margin',
    'marginTop',
    'marginRight',
    'marginBottom',
    'marginLeft',
    'marginHorizontal',
    'marginVertical',
    'alignSelf',
    'width',
    'minWidth',
    'maxWidth',
    'height',
    'minHeight',
    'maxHeight',
    'flex',
    'flexGrow',
    'flexShrink',
  ];
  for (const k of keys) {
    if (s[k] !== undefined) out[k] = s[k];
  }
  return out;
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: Theme.radius.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 8,
  },
  panel: {
    borderRadius: Theme.radius.card,
    overflow: 'hidden',
    backgroundColor: Theme.colors.glass,
    borderWidth: 1,
    borderColor: Theme.colors.stroke,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 52,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
});
