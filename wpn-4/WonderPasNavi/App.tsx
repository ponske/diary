// メインアプリケーションファイル

import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import AttractionSelectionScreen from './src/screens/AttractionSelectionScreen';
import RouteSettingsScreen from './src/screens/RouteSettingsScreen';
import RouteResultScreen from './src/screens/RouteResultScreen';
import MapScreen from './src/screens/MapScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import {
  SelectedAttraction,
  RouteResult,
  OptimizationMethod,
} from './src/types';

type Screen =
  | 'selection'
  | 'routeSettings'
  | 'result'
  | 'map'
  | 'settings';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('selection');
  const [selectedAttractions, setSelectedAttractions] = useState<
    SelectedAttraction[]
  >([]);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [optimizationMethod, setOptimizationMethod] =
    useState<OptimizationMethod>(OptimizationMethod.TIME);

  const handleAttractionSelected = (attractions: SelectedAttraction[]) => {
    setSelectedAttractions(attractions);
    setCurrentScreen('routeSettings');
  };

  const handleRouteCalculated = (
    result: RouteResult,
    method: OptimizationMethod
  ) => {
    setRouteResult(result);
    setOptimizationMethod(method);
    setCurrentScreen('result');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'selection':
        return (
          <AttractionSelectionScreen onNext={handleAttractionSelected} />
        );

      case 'routeSettings':
        return (
          <RouteSettingsScreen
            selectedAttractions={selectedAttractions}
            onRouteCalculated={handleRouteCalculated}
            onBack={() => setCurrentScreen('selection')}
          />
        );

      case 'result':
        return routeResult ? (
          <RouteResultScreen
            routeResult={routeResult}
            optimizationMethod={optimizationMethod}
            onBack={() => setCurrentScreen('routeSettings')}
            onShowMap={() => setCurrentScreen('map')}
          />
        ) : null;

      case 'map':
        return routeResult ? (
          <MapScreen
            routeResult={routeResult}
            onBack={() => setCurrentScreen('result')}
          />
        ) : null;

      case 'settings':
        return (
          <SettingsScreen onBack={() => setCurrentScreen('selection')} />
        );

      default:
        return (
          <AttractionSelectionScreen onNext={handleAttractionSelected} />
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderScreen()}
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
