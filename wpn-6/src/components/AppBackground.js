import React from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../theme';

export default function AppBackground({ children }) {
  return (
    <View style={styles.root}>
      <ImageBackground
        source={require('../../assets/bg.jpg')}
        style={StyleSheet.absoluteFill}
        imageStyle={styles.image}
        resizeMode="cover"
        blurRadius={4}
      >
        {/* 写真の上に「白を薄ーく薄ーく」被せて文字の視認性を確保 */}
        <LinearGradient
          colors={[
            'rgba(255,255,255,0.18)',
            'rgba(255,255,255,0.10)',
            'rgba(255,255,255,0.06)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* soft color blobs for glassmorphism depth */}
        <View style={styles.blob3} pointerEvents="none" />
      </ImageBackground>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Theme.colors.bg,
  },
  image: {
    opacity: 0.96,
  },
  blob3: {
    position: 'absolute',
    bottom: -140,
    right: -120,
    width: 320,
    height: 320,
    borderRadius: 320,
    backgroundColor: 'rgba(167, 243, 208, 0.22)',
  },
});
