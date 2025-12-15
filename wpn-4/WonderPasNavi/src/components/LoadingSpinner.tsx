// キラキラするローディングスピナーコンポーネント

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Modal,
} from 'react-native';

interface LoadingSpinnerProps {
  visible: boolean;
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  visible,
  message = '最適なルートを計算中...',
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const scaleValue1 = useRef(new Animated.Value(1)).current;
  const scaleValue2 = useRef(new Animated.Value(1)).current;
  const scaleValue3 = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (visible) {
      // 回転アニメーション
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // キラキラアニメーション（3つの星が順番に）
      const sparkleAnimation = () => {
        Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.sequence([
                Animated.timing(scaleValue1, {
                  toValue: 1.5,
                  duration: 400,
                  useNativeDriver: true,
                }),
                Animated.timing(scaleValue1, {
                  toValue: 1,
                  duration: 400,
                  useNativeDriver: true,
                }),
              ]),
              Animated.sequence([
                Animated.delay(200),
                Animated.timing(scaleValue2, {
                  toValue: 1.5,
                  duration: 400,
                  useNativeDriver: true,
                }),
                Animated.timing(scaleValue2, {
                  toValue: 1,
                  duration: 400,
                  useNativeDriver: true,
                }),
              ]),
              Animated.sequence([
                Animated.delay(400),
                Animated.timing(scaleValue3, {
                  toValue: 1.5,
                  duration: 400,
                  useNativeDriver: true,
                }),
                Animated.timing(scaleValue3, {
                  toValue: 1,
                  duration: 400,
                  useNativeDriver: true,
                }),
              ]),
            ]),
          ])
        ).start();
      };

      sparkleAnimation();

      // フェードイン・アウトアニメーション
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacityValue, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(opacityValue, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.sparkleContainer}>
            {/* 回転する外側の円 */}
            <Animated.View
              style={[
                styles.outerCircle,
                {
                  transform: [{ rotate: spin }],
                },
              ]}
            >
              <View style={styles.outerDot} />
              <View style={[styles.outerDot, styles.outerDot2]} />
              <View style={[styles.outerDot, styles.outerDot3]} />
            </Animated.View>

            {/* キラキラする星 */}
            <View style={styles.starsContainer}>
              <Animated.Text
                style={[
                  styles.star,
                  styles.star1,
                  {
                    transform: [{ scale: scaleValue1 }],
                    opacity: opacityValue,
                  },
                ]}
              >
                ✨
              </Animated.Text>
              <Animated.Text
                style={[
                  styles.star,
                  styles.star2,
                  {
                    transform: [{ scale: scaleValue2 }],
                    opacity: opacityValue,
                  },
                ]}
              >
                ✨
              </Animated.Text>
              <Animated.Text
                style={[
                  styles.star,
                  styles.star3,
                  {
                    transform: [{ scale: scaleValue3 }],
                    opacity: opacityValue,
                  },
                ]}
              >
                ✨
              </Animated.Text>
            </View>

            {/* 中央のアイコン */}
            <View style={styles.centerIcon}>
              <Text style={styles.iconText}>🎢</Text>
            </View>
          </View>

          <Text style={styles.message}>{message}</Text>
          <Text style={styles.subMessage}>
            全ての順列を計算しています...
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 280,
  },
  sparkleContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  outerCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4A90E2',
    top: 0,
    left: '50%',
    marginLeft: -6,
  },
  outerDot2: {
    backgroundColor: '#FFD93D',
    transform: [{ rotate: '120deg' }],
  },
  outerDot3: {
    backgroundColor: '#FF6B6B',
    transform: [{ rotate: '240deg' }],
  },
  starsContainer: {
    position: 'absolute',
    width: 120,
    height: 120,
  },
  star: {
    position: 'absolute',
    fontSize: 28,
  },
  star1: {
    top: 10,
    right: 20,
  },
  star2: {
    bottom: 10,
    left: 10,
  },
  star3: {
    top: 50,
    left: -10,
  },
  centerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#4A90E2',
  },
  iconText: {
    fontSize: 32,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default LoadingSpinner;
