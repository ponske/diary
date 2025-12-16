import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import AppBackground from '../components/AppBackground';
import { Theme } from '../theme';

// route.params:
// - effect: 'balloons' | 'bubbles'
// - nextParams: RouteResultScreen の params
export default function TransitionScreen({ route, navigation }) {
  const effect = route?.params?.effect || 'balloons';
  const nextParams = route?.params?.nextParams;

  // レイアウト確定後にアニメーションの移動量を決める
  const [layout, setLayout] = useState({ w: 0, h: 0 });

  useEffect(() => {
    // ちょい長めに「大袈裟」演出
    if (!effect || effect === 'none') {
      navigation.replace('RouteResult', nextParams);
      return;
    }
    const duration = effect === 'balloons' ? 1500 : 1400;
    const t = setTimeout(() => {
      navigation.replace('RouteResult', nextParams);
    }, duration);

    return () => clearTimeout(t);
  }, [effect, navigation, nextParams]);

  return (
    <AppBackground>
      <View
        style={styles.root}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setLayout({ w: width, h: height });
        }}
      >
        {/* 画面全体にうっすら暗いベール（泡/風船が見えるように） */}
        <View style={styles.dim} pointerEvents="none" />

        {layout.w > 0 && layout.h > 0 ? (
          effect === 'bubbles' ? (
            <BubbleField width={layout.w} height={layout.h} />
          ) : (
            <BalloonField width={layout.w} height={layout.h} />
          )
        ) : null}

        <View style={styles.captionWrap} pointerEvents="none">
          <Text style={styles.caption}>{effect === 'bubbles' ? '🫧' : '🎈'} ルートを表示します…</Text>
        </View>
      </View>
    </AppBackground>
  );
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function BalloonField({ width, height }) {
  const balloons = useMemo(() => {
    const colors = [
      'rgba(56,189,248,0.55)',
      'rgba(37,99,235,0.55)',
      'rgba(167,243,208,0.55)',
      'rgba(251,191,36,0.50)',
      'rgba(244,114,182,0.42)',
    ];
    // 毎回ちょっと違う見え方にする（シードに時刻を混ぜる）
    const seed = Math.round(width * 13 + height * 7 + (Date.now() % 100000));
    const r = mulberry32(seed);
    const base = Math.max(22, Math.round(width / 16));
    const count = base * 10; // 要望: 10倍

    return Array.from({ length: count }).map((_, i) => {
      const size = Math.round(26 + r() * 34); // 26..60
      const x = Math.round(r() * (width - size));
      const delay = Math.round(r() * 280);
      const color = colors[Math.floor(r() * colors.length)];
      const sway = Math.round(10 + r() * 18);
      const speed = Math.round(900 + r() * 900);
      return { key: `b-${i}`, size, x, delay, color, sway, speed };
    });
  }, [width, height]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {balloons.map(({ key, size, x, delay, color, sway, speed }) => (
        <Balloon key={key} size={size} x={x} delay={delay} color={color} sway={sway} speed={speed} height={height} />
      ))}
    </View>
  );
}

function Balloon({ size, x, delay, color, sway, speed, height }) {
  // 10倍にすると要素数が多いので、Animated.Value は1つにして軽量化
  const p = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(p, { toValue: 1, duration: speed, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(p, { toValue: 0, duration: 1, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, p, speed]);

  const translateY = p.interpolate({
    inputRange: [0, 1],
    outputRange: [height + size * 1.6, -size * 2.4],
  });
  // 上昇に合わせて左右に揺れる（別のアニメは作らず、pで揺らす）
  const translateX = p.interpolate({ inputRange: [0, 0.5, 1], outputRange: [-sway, sway, -sway] });
  const scale = p.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0.92, 1, 1.02] });
  const opacity = p.interpolate({ inputRange: [0, 0.08, 0.9, 1], outputRange: [0, 1, 1, 0] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        transform: [{ translateX }, { translateY }, { scale }],
        opacity,
      }}
    >
      {/* 風船本体 */}
      <View style={[styles.balloon, { width: size, height: size * 1.2, borderRadius: size, backgroundColor: color }]}>
        <LinearGradient
          colors={['rgba(255,255,255,0.45)', 'rgba(255,255,255,0.05)']}
          start={{ x: 0.15, y: 0.1 }}
          end={{ x: 0.85, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </View>
      {/* 糸 */}
      <View style={[styles.string, { height: 40 + (size % 12), left: size / 2 - 0.5 }]} />
    </Animated.View>
  );
}

function BubbleField({ width, height }) {
  const bubbles = useMemo(() => {
    // 毎回ちょっと違う見え方にする（シードに時刻を混ぜる）
    const seed = Math.round(width * 19 + height * 11 + (Date.now() % 100000));
    const r = mulberry32(seed);
    const base = Math.max(48, Math.round(width / 6));
    const count = base * 10; // 要望: 10倍

    return Array.from({ length: count }).map((_, i) => {
      const size = Math.round(10 + r() * 36); // 10..46
      const x = Math.round(r() * (width - size));
      // 泡は“ゆっくり”出てくるように（durationを伸ばす）
      const delay = Math.round(r() * 520);
      const speed = Math.round(1600 + r() * 2400);
      const drift = Math.round(6 + r() * 32);
      const alpha = 0.16 + r() * 0.22; // 0.16..0.38
      return { key: `p-${i}`, size, x, delay, speed, drift, alpha };
    });
  }, [width, height]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {bubbles.map(({ key, size, x, delay, speed, drift, alpha }) => (
        <Bubble key={key} size={size} x={x} delay={delay} speed={speed} drift={drift} alpha={alpha} height={height} />
      ))}
    </View>
  );
}

function Bubble({ size, x, delay, speed, drift, alpha, height }) {
  const p = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(p, {
          toValue: 1,
          duration: speed,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(p, { toValue: 0, duration: 1, useNativeDriver: true }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [delay, p, speed]);

  const translateY = p.interpolate({
    inputRange: [0, 1],
    outputRange: [height + size * 2.2, -size * 2.6],
  });
  const translateX = p.interpolate({
    inputRange: [0, 1],
    outputRange: [0, drift],
  });
  const scale = p.interpolate({
    inputRange: [0, 0.06, 0.85, 1],
    outputRange: [0.2, 1, 1.08, 0.1], // 上で“ポコッ”と消える
  });
  const opacity = p.interpolate({
    inputRange: [0, 0.08, 0.85, 1],
    outputRange: [0, alpha, alpha, 0],
  });

  return (
    <Animated.View style={{ position: 'absolute', left: x, transform: [{ translateX }, { translateY }, { scale }], opacity }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: 'rgba(255,255,255,0.22)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.42)',
          shadowColor: '#38BDF8',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.18,
          shadowRadius: 10,
        }}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.02)']}
          start={{ x: 0.2, y: 0.2 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,18,32,0.22)',
  },
  captionWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 58,
    alignItems: 'center',
  },
  caption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.38)',
    color: 'rgba(255,255,255,0.92)',
    fontFamily: Theme.fonts.bold,
  },
  balloon: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
  },
  string: {
    position: 'absolute',
    top: '92%',
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
});
