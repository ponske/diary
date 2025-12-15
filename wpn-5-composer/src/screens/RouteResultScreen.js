import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Clipboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { minutesToTime } from '../utils/time';

export default function RouteResultScreen({ route, navigation }) {
  const { route: routeItems, startTime, endTime, endTimeMinutes } = route.params;
  const [selectedMapIndex, setSelectedMapIndex] = useState(null);
  const mapRef = useRef(null);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#FF6B6B';
      case 'medium':
        return '#4ECDC4';
      case 'low':
        return '#95E1D3';
      default:
        return '#6B46C1';
    }
  };

  const calculateTotalDistance = () => {
    let total = 0;
    for (const item of routeItems) {
      if (item.travelMinutes) {
        total += item.travelMinutes * 80; // 分速80m
      }
    }
    return Math.round(total);
  };

  const getMapRegion = () => {
    if (routeItems.length === 0) {
      return {
        latitude: 35.632993,
        longitude: 139.879729,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    const lats = routeItems.map(item => item.attraction.getLatitude());
    const lngs = routeItems.map(item => item.attraction.getLongitude());

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latDelta = (maxLat - minLat) * 1.5;
    const lngDelta = (maxLng - minLng) * 1.5;

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.01),
      longitudeDelta: Math.max(lngDelta, 0.01),
    };
  };

  const getRouteCoordinates = () => {
    const coords = [];
    // スタート地点（パーク入り口）
    coords.push({ latitude: 35.632993, longitude: 139.879729 });
    for (const item of routeItems) {
      if (item.attraction) {
        coords.push({
          latitude: item.attraction.getLatitude(),
          longitude: item.attraction.getLongitude(),
        });
      }
    }
    return coords;
  };

  const copyRouteToClipboard = (format = 'detailed') => {
    let text = '';

    if (format === 'detailed') {
      text = `✨ WonderPasNavi ルート ✨\n\n`;
      text += `開始時刻: ${startTime}\n`;
      text += `退園時刻: ${endTime}\n\n`;
      for (const item of routeItems) {
        if (item.attraction) {
          text += `${item.order}. ${item.attraction.name}\n`;
          text += `   ${item.getArrivalTime()} 到着 / ${item.getDepartureTime()} 出発`;
          text += `（待ち ${item.waitingMinutes}分 + 体験 ${item.durationMinutes}分）\n\n`;
        }
      }
    } else if (format === 'simple') {
      text = `✨ WonderPasNavi ルート ✨\n\n`;
      for (const item of routeItems) {
        if (item.attraction) {
          text += `${item.order}. ${item.attraction.name}\n`;
        }
      }
    } else if (format === 'sns') {
      text = `✨ ディズニーランドのルート ✨\n\n`;
      text += `開始: ${startTime}\n`;
      for (const item of routeItems.slice(0, 5)) {
        if (item.attraction) {
          text += `${item.order}. ${item.attraction.name} ${item.getArrivalTime()}\n`;
        }
      }
      if (routeItems.length > 5) {
        text += `...他${routeItems.length - 5}件\n`;
      }
      text += `\n#ディズニーランド #WonderPasNavi`;
    }

    Clipboard.setString(text);
    Alert.alert('コピー完了', 'ルートをクリップボードにコピーしました');
  };

  const shareRoute = async () => {
    try {
      const text = `✨ WonderPasNavi ルート ✨\n\n開始: ${startTime}\n`;
      const routeText = routeItems
        .map(item => `${item.order}. ${item.attraction.name} ${item.getArrivalTime()}`)
        .join('\n');
      
      await Share.share({
        message: text + routeText,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <LinearGradient colors={['#E8D5FF', '#FFFFFF']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>← 戻る</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={styles.settingsButton}
            >
              <Text style={styles.settingsButtonText}>⚙️</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>✨ ルート結果 ✨</Text>
          <Text style={styles.subtitle}>
            {routeItems.length}個のアトラクション / 総距離: {calculateTotalDistance()}m
          </Text>
        </View>

        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={getMapRegion()}
            showsUserLocation={false}
          >
            {/* スタート地点 */}
            <Marker
              coordinate={{ latitude: 35.632993, longitude: 139.879729 }}
              title="スタート"
              pinColor="#6B46C1"
            />

            {/* アトラクション */}
            {routeItems.map((item, index) => {
              if (!item.attraction) return null;
              return (
                <Marker
                  key={index}
                  coordinate={{
                    latitude: item.attraction.getLatitude(),
                    longitude: item.attraction.getLongitude(),
                  }}
                  title={`${item.order}. ${item.attraction.name}`}
                  pinColor={getPriorityColor(item.priority)}
                  onPress={() => setSelectedMapIndex(selectedMapIndex === index ? null : index)}
                />
              );
            })}

            {/* ルート線 */}
            <Polyline
              coordinates={getRouteCoordinates()}
              strokeColor="#6B46C1"
              strokeWidth={3}
            />
          </MapView>
        </View>

        <View style={styles.routeList}>
          {routeItems.map((item, index) => {
            if (!item.attraction) return null;
            const isSelected = selectedMapIndex === index;
            return (
              <View
                key={index}
                style={[
                  styles.routeItem,
                  isSelected && styles.routeItemSelected,
                  { borderLeftColor: getPriorityColor(item.priority) },
                ]}
              >
                <View style={styles.routeItemHeader}>
                  <View style={styles.orderBadge}>
                    <Text style={styles.orderText}>{item.order}</Text>
                  </View>
                  <Text style={styles.attractionName}>{item.attraction.name}</Text>
                </View>
                <View style={styles.timeInfo}>
                  <Text style={styles.timeText}>
                    {item.getArrivalTime()} 到着 → {item.getDepartureTime()} 出発
                  </Text>
                </View>
                <View style={styles.details}>
                  <Text style={styles.detailText}>
                    移動: {item.travelMinutes}分 | 待ち: {item.waitingMinutes}分 | 体験: {item.durationMinutes}分
                  </Text>
                  <Text style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
                    {item.priority === 'high' ? '高' : item.priority === 'medium' ? '中' : '低'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              Alert.alert(
                'コピー形式を選択',
                '',
                [
                  { text: '詳細版', onPress: () => copyRouteToClipboard('detailed') },
                  { text: '簡易版', onPress: () => copyRouteToClipboard('simple') },
                  { text: 'SNS版', onPress: () => copyRouteToClipboard('sns') },
                  { text: 'キャンセル', style: 'cancel' },
                ]
              );
            }}
          >
            <Text style={styles.actionButtonText}>📋 コピー</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={shareRoute}>
            <Text style={styles.actionButtonText}>📤 共有</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6B46C1',
    fontWeight: '600',
  },
  settingsButton: {
    padding: 8,
  },
  settingsButtonText: {
    fontSize: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6B46C1',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  mapContainer: {
    height: 300,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E0E0E0',
  },
  map: {
    flex: 1,
  },
  routeList: {
    paddingHorizontal: 16,
  },
  routeItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeItemSelected: {
    backgroundColor: '#F3E8FF',
  },
  routeItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  attractionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  timeInfo: {
    marginBottom: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#999',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#6B46C1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
