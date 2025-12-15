import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoadingSpinner({ progress = null, message = 'ルートを計算中...' }) {
  console.log('LoadingSpinner rendered with progress:', progress, 'message:', message);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 回転アニメーション
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // キラキラアニメーション
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const opacity = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6B46C1', '#8B5CF6', '#A78BFA']}
        style={styles.gradient}
      >
        <Animated.View
          style={[
            styles.spinnerContainer,
            { transform: [{ rotate }] },
          ]}
        >
          <Text style={styles.spinnerEmoji}>✨</Text>
        </Animated.View>
        
        <Animated.View style={[styles.sparkles, { opacity }]}>
          <Text style={styles.sparkleEmoji}>⭐</Text>
          <Text style={styles.sparkleEmoji}>💫</Text>
          <Text style={styles.sparkleEmoji}>✨</Text>
        </Animated.View>

        <Text style={styles.message}>{message}</Text>
        
        {progress !== null && progress !== undefined && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, progress * 100))}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {Math.round(progress * 100)}% 完了
            </Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 9999,
  },
  gradient: {
    width: 200,
    height: 200,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  spinnerContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerEmoji: {
    fontSize: 48,
  },
  sparkles: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  sparkleEmoji: {
    fontSize: 24,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  progressContainer: {
    marginTop: 16,
    width: '100%',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  progressText: {
    marginTop: 8,
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
