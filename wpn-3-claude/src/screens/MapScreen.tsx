import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, SafeAreaView } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { RouteItem, RouteItemType, Priority } from '../types/Models';

interface MapScreenProps {
  route: any;
}

export default function MapScreen({ route }: MapScreenProps) {
  const { routeItems } = route.params as { routeItems: RouteItem[] };
  const [region, setRegion] = useState({
    latitude: 35.633,
    longitude: 139.880,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  useEffect(() => {
    // ルート全体が見えるように地図の範囲を調整
    if (routeItems.length > 0) {
      const coordinates = routeItems
        .filter((item) => item.type === RouteItemType.Attraction && item.attraction)
        .map((item) => ({
          latitude: item.attraction!.entranceLat,
          longitude: item.attraction!.entranceLng,
        }));

      if (coordinates.length > 0) {
        const minLat = Math.min(...coordinates.map((c) => c.latitude));
        const maxLat = Math.max(...coordinates.map((c) => c.latitude));
        const minLng = Math.min(...coordinates.map((c) => c.longitude));
        const maxLng = Math.max(...coordinates.map((c) => c.longitude));

        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;
        const deltaLat = (maxLat - minLat) * 1.5;
        const deltaLng = (maxLng - minLng) * 1.5;

        setRegion({
          latitude: centerLat,
          longitude: centerLng,
          latitudeDelta: Math.max(deltaLat, 0.005),
          longitudeDelta: Math.max(deltaLng, 0.005),
        });
      }
    }
  }, [routeItems]);

  const getMarkerColor = (priority?: Priority): string => {
    switch (priority) {
      case Priority.High:
        return '#FF6B6B';
      case Priority.Medium:
        return '#4ECDC4';
      case Priority.Low:
        return '#95E1D3';
      default:
        return '#CCCCCC';
    }
  };

  // ルート線用の座標配列を作成
  const routeCoordinates = routeItems
    .filter((item) => item.type === RouteItemType.Attraction && item.attraction)
    .map((item) => ({
      latitude: item.attraction!.entranceLat,
      longitude: item.attraction!.entranceLng,
    }));

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
      >
        {/* マーカーを表示 */}
        {routeItems.map((item, index) => {
          if (item.type === RouteItemType.Attraction && item.attraction) {
            return (
              <Marker
                key={index}
                coordinate={{
                  latitude: item.attraction.entranceLat,
                  longitude: item.attraction.entranceLng,
                }}
                title={`${item.order}. ${item.attraction.name}`}
                description={`優先度: ${
                  item.priority === Priority.High
                    ? '高'
                    : item.priority === Priority.Medium
                    ? '中'
                    : '低'
                }`}
                pinColor={getMarkerColor(item.priority)}
              >
                <View style={styles.markerContainer}>
                  <View
                    style={[
                      styles.marker,
                      { backgroundColor: getMarkerColor(item.priority) },
                    ]}
                  >
                    <Text style={styles.markerText}>{item.order}</Text>
                  </View>
                </View>
              </Marker>
            );
          }
          return null;
        })}

        {/* ルートの線を表示 */}
        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#4CAF50"
            strokeWidth={3}
          />
        )}
      </MapView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  markerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
