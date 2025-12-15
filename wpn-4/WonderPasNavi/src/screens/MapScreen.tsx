// 地図表示画面

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { RouteResult } from '../types';
import { PARK_ENTRANCE } from '../utils/distance';

interface MapScreenProps {
  routeResult: RouteResult;
  onBack: () => void;
}

const MapScreen: React.FC<MapScreenProps> = ({ routeResult, onBack }) => {
  const mapRef = useRef<MapView>(null);
  const [animatedRoute, setAnimatedRoute] = useState<number>(0);
  const [showLabels, setShowLabels] = useState(true);

  useEffect(() => {
    // 地図の範囲を調整
    if (mapRef.current && routeResult.items.length > 0) {
      const coordinates = routeResult.items
        .filter((item) => item.attraction)
        .map((item) => ({
          latitude: item.attraction!.latitude,
          longitude: item.attraction!.longitude,
        }));

      if (coordinates.length > 0) {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
          animated: true,
        });
      }
    }
  }, [routeResult]);

  useEffect(() => {
    // ルートのアニメーション
    if (animatedRoute < routeResult.items.length) {
      const timer = setTimeout(() => {
        setAnimatedRoute(animatedRoute + 1);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [animatedRoute, routeResult.items.length]);

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return '#FF6B6B';
      case 'medium':
        return '#FFD93D';
      case 'low':
        return '#6BCB77';
      default:
        return '#4A90E2';
    }
  };

  const getRouteCoordinates = () => {
    const coordinates = [
      { latitude: PARK_ENTRANCE.latitude, longitude: PARK_ENTRANCE.longitude },
    ];

    routeResult.items.slice(0, animatedRoute).forEach((item) => {
      if (item.attraction) {
        coordinates.push({
          latitude: item.attraction.latitude,
          longitude: item.attraction.longitude,
        });
      }
    });

    return coordinates;
  };

  const handleResetAnimation = () => {
    setAnimatedRoute(0);
    setTimeout(() => {
      setAnimatedRoute(routeResult.items.length);
    }, 100);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.title}>ルート地図</Text>
        <TouchableOpacity
          onPress={() => setShowLabels(!showLabels)}
          style={styles.toggleButton}
        >
          <Text style={styles.toggleButtonText}>
            {showLabels ? '🏷' : '🏷️'}
          </Text>
        </TouchableOpacity>
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: 35.6329,
          longitude: 139.8804,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {/* スタート地点 */}
        <Marker
          coordinate={{
            latitude: PARK_ENTRANCE.latitude,
            longitude: PARK_ENTRANCE.longitude,
          }}
          title="スタート"
          description="パーク入口"
          pinColor="green"
        />

        {/* ルート上のアトラクション */}
        {routeResult.items.map((item, index) => {
          if (!item.attraction) return null;

          return (
            <Marker
              key={index}
              coordinate={{
                latitude: item.attraction.latitude,
                longitude: item.attraction.longitude,
              }}
              title={`${item.orderNumber}. ${item.attraction.name}`}
              description={`到着: ${Math.floor(item.arrivalTimeMinutes / 60)}:${(
                item.arrivalTimeMinutes % 60
              )
                .toString()
                .padStart(2, '0')}`}
              pinColor={getPriorityColor(item.priority)}
            >
              <View
                style={[
                  styles.customMarker,
                  { backgroundColor: getPriorityColor(item.priority) },
                ]}
              >
                <Text style={styles.markerText}>{item.orderNumber}</Text>
              </View>
            </Marker>
          );
        })}

        {/* ルートライン */}
        <Polyline
          coordinates={getRouteCoordinates()}
          strokeColor="#4A90E2"
          strokeWidth={4}
          lineDashPattern={[1]}
        />
      </MapView>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleResetAnimation}
        >
          <Text style={styles.controlButtonText}>🔄 再生</Text>
        </TouchableOpacity>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF6B6B' }]} />
            <Text style={styles.legendText}>高</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FFD93D' }]} />
            <Text style={styles.legendText}>中</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#6BCB77' }]} />
            <Text style={styles.legendText}>低</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4A90E2',
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  toggleButton: {
    padding: 8,
  },
  toggleButtonText: {
    fontSize: 20,
  },
  map: {
    flex: 1,
  },
  customMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  markerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  controlButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: '#333',
  },
});

export default MapScreen;
