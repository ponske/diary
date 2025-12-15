import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Text, TextInput, Easing } from 'react-native';

import {
  useFonts,
  ZenKakuGothicNew_400Regular,
  ZenKakuGothicNew_700Bold,
  ZenKakuGothicNew_900Black,
} from '@expo-google-fonts/zen-kaku-gothic-new';
import { ShipporiAntique_400Regular } from '@expo-google-fonts/shippori-antique';
import { ShipporiMincho_400Regular, ShipporiMincho_700Bold } from '@expo-google-fonts/shippori-mincho';
import * as SplashScreen from 'expo-splash-screen';

import AttractionSelectionScreen from './src/screens/AttractionSelectionScreen';
import RouteSettingsScreen from './src/screens/RouteSettingsScreen';
import RouteResultScreen from './src/screens/RouteResultScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import TransitionScreen from './src/screens/TransitionScreen';

const Stack = createStackNavigator();

const ROUTE_RESULT_TRANSITION = {
  gestureEnabled: true,
  transitionSpec: {
    open: { animation: 'timing', config: { duration: 420, easing: Easing.out(Easing.cubic) } },
    close: { animation: 'timing', config: { duration: 320, easing: Easing.out(Easing.cubic) } },
  },
  // “結果表示ページに入る前に”ふわっと演出（フェード＋軽いズーム＋少しスライド）
  cardStyleInterpolator: ({ current, layouts }) => ({
    cardStyle: {
      opacity: current.progress,
      transform: [
        {
          translateY: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [layouts.screen.height * 0.04, 0],
          }),
        },
        {
          scale: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.985, 1],
          }),
        },
      ],
    },
    overlayStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.18],
      }),
    },
  }),
};

export default function App() {
  const [fontsLoaded] = useFonts({
    ZenKakuGothicNew_400Regular,
    ZenKakuGothicNew_700Bold,
    ZenKakuGothicNew_900Black,
    // ルート結果画面用（Shippori Antique / Mincho）
    ShipporiAntique_400Regular,
    ShipporiMincho_400Regular,
    ShipporiMincho_700Bold,
  });

  useEffect(() => {
    // フォントがロードされるまでスプラッシュを閉じない（フォントのチラつき防止）
    SplashScreen.preventAutoHideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    if (!fontsLoaded) return;

    // アプリ全体のデフォルトフォントを差し替え
    Text.defaultProps = Text.defaultProps || {};
    Text.defaultProps.style = [{ fontFamily: 'ZenKakuGothicNew_400Regular' }, Text.defaultProps.style];

    TextInput.defaultProps = TextInput.defaultProps || {};
    TextInput.defaultProps.style = [{ fontFamily: 'ZenKakuGothicNew_400Regular' }, TextInput.defaultProps.style];

    SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator
          initialRouteName="AttractionSelection"
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: '#FFFFFF' },
          }}
        >
          <Stack.Screen name="AttractionSelection" component={AttractionSelectionScreen} />
          <Stack.Screen name="RouteSettings" component={RouteSettingsScreen} />
          <Stack.Screen name="Transition" component={TransitionScreen} options={{ gestureEnabled: false }} />
          <Stack.Screen name="RouteResult" component={RouteResultScreen} options={ROUTE_RESULT_TRANSITION} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
