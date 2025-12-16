import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Theme } from '../theme';

export default function LoadingSpinner({ message, progress }) {
  const sparkle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(sparkle, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [sparkle]);

  const scale = sparkle.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.1] });
  const opacity = sparkle.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.sparkle, { transform: [{ scale }], opacity }]}>✨</Animated.Text>
      <Text style={styles.message}>{message || '計算中...'}</Text>
      {typeof progress === 'number' && (
        <View style={styles.progressWrap}>
          <View style={styles.progressBg}>
            <View style={[styles.progressBar, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sparkle: {
    fontSize: 56,
    marginBottom: 18,
  },
  message: {
    fontSize: 16,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.primaryDark,
    textAlign: 'center',
    marginBottom: 14,
  },
  progressWrap: {
    width: '80%',
    marginTop: 8,
  },
  progressBg: {
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(37, 99, 235, 0.14)',
    overflow: 'hidden',
  },
  progressBar: {
    height: 10,
    backgroundColor: Theme.colors.primary,
  },
  progressText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});
