import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import AttractionSelectionScreen from './src/screens/AttractionSelectionScreen';
import RouteResultScreen from './src/screens/RouteResultScreen';
import MapScreen from './src/screens/MapScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName="AttractionSelection"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#4CAF50',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="AttractionSelection"
          component={AttractionSelectionScreen}
          options={{
            title: 'WonderPasNavi',
            headerBackVisible: false,
          }}
        />
        <Stack.Screen
          name="RouteResult"
          component={RouteResultScreen}
          options={{
            title: 'ルート結果',
          }}
        />
        <Stack.Screen
          name="Map"
          component={MapScreen}
          options={{
            title: '地図',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
