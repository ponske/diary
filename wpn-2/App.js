import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AttractionSelectionScreen from './src/screens/AttractionSelectionScreen';
import RoutePlannerScreen from './src/screens/RoutePlannerScreen';
import MapScreen from './src/screens/MapScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Attractions">
          <Stack.Screen
            name="Attractions"
            component={AttractionSelectionScreen}
            options={{ title: 'WonderPasNavi' }}
          />
          <Stack.Screen
            name="RoutePlanner"
            component={RoutePlannerScreen}
            options={{ title: 'ルートを決める' }}
          />
          <Stack.Screen
            name="Map"
            component={MapScreen}
            options={{ title: '地図' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
