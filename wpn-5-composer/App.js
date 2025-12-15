import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AttractionSelectionScreen from './src/screens/AttractionSelectionScreen';
import RouteSettingsScreen from './src/screens/RouteSettingsScreen';
import RouteResultScreen from './src/screens/RouteResultScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createStackNavigator();

export default function App() {
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
          <Stack.Screen
            name="AttractionSelection"
            component={AttractionSelectionScreen}
          />
          <Stack.Screen
            name="RouteSettings"
            component={RouteSettingsScreen}
          />
          <Stack.Screen
            name="RouteResult"
            component={RouteResultScreen}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
