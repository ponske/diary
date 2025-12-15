// ルート結果表示画面

import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Share,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { RouteResult, OptimizationMethod } from '../types';
import RouteItemCard from '../components/RouteItemCard';
import { minutesToTimeString } from '../utils/routeOptimizer';

interface RouteResultScreenProps {
  routeResult: RouteResult;
  optimizationMethod: OptimizationMethod;
  onBack: () => void;
  onShowMap: () => void;
}

const RouteResultScreen: React.FC<RouteResultScreenProps> = ({
  routeResult,
  optimizationMethod,
  onBack,
  onShowMap,
}) => {
  const getMethodLabel = () => {
    switch (optimizationMethod) {
      case OptimizationMethod.DISTANCE:
        return '距離最短';
      case OptimizationMethod.TIME:
        return '時間最短';
      case OptimizationMethod.USER_ORDER:
        return '選択順';
      case OptimizationMethod.BRUTE_FORCE:
        return '全探索';
      default:
        return '';
    }
  };

  const formatRouteText = (): string => {
    let text = `🎢 WonderPasNavi ルート\n\n`;
    text += `最適化方法: ${getMethodLabel()}\n`;
    text += `開始時刻: ${minutesToTimeString(routeResult.startTimeMinutes)}\n`;
    text += `総移動距離: ${(routeResult.totalDistance / 1000).toFixed(2)}km\n`;
    text += `総所要時間: ${Math.floor(routeResult.totalTimeMinutes / 60)}時間${routeResult.totalTimeMinutes % 60}分\n`;
    text += `\n━━━━━━━━━━━━━━━━\n\n`;

    routeResult.items.forEach((item) => {
      if (item.attraction) {
        text += `${item.orderNumber}. ${item.attraction.name}\n`;
        text += `   ${minutesToTimeString(item.arrivalTimeMinutes)} 到着 / ${minutesToTimeString(item.departureTimeMinutes)} 出発\n`;
        text += `   待ち ${item.waitingMinutes}分 + 体験 ${item.durationMinutes}分\n\n`;
      } else {
        text += `休憩\n`;
        text += `   ${minutesToTimeString(item.arrivalTimeMinutes)} - ${minutesToTimeString(item.departureTimeMinutes)}\n`;
        text += `   休憩時間 ${item.breakDuration}分\n\n`;
      }
    });

    return text;
  };

  const handleCopyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(formatRouteText());
      Alert.alert('コピー完了', 'ルートをクリップボードにコピーしました');
    } catch (error) {
      Alert.alert('エラー', 'コピーに失敗しました');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: formatRouteText(),
      });
    } catch (error) {
      Alert.alert('エラー', '共有に失敗しました');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.title}>ルート結果</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.methodLabel}>{getMethodLabel()}</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>スポット数</Text>
            <Text style={styles.statValue}>{routeResult.items.length}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>総移動距離</Text>
            <Text style={styles.statValue}>
              {(routeResult.totalDistance / 1000).toFixed(2)}km
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>総時間</Text>
            <Text style={styles.statValue}>
              {Math.floor(routeResult.totalTimeMinutes / 60)}h{' '}
              {routeResult.totalTimeMinutes % 60}m
            </Text>
          </View>
        </View>
        {routeResult.exceedsClosingTime && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              ⚠️ ルートが閉園時刻を超えています
            </Text>
          </View>
        )}
      </View>

      <FlatList
        data={routeResult.items}
        renderItem={({ item }) => <RouteItemCard item={item} />}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContainer}
      />

      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.copyButton]}
            onPress={handleCopyToClipboard}
          >
            <Text style={styles.actionButtonText}>📋 コピー</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.shareButton]}
            onPress={handleShare}
          >
            <Text style={styles.actionButtonText}>📤 共有</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.mapButton} onPress={onShowMap}>
          <Text style={styles.mapButtonText}>🗺 地図で見る</Text>
        </TouchableOpacity>
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
  placeholder: {
    width: 60,
  },
  summaryContainer: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  methodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
    textAlign: 'center',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  warningBanner: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 180,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  copyButton: {
    backgroundColor: '#6BCB77',
  },
  shareButton: {
    backgroundColor: '#FFD93D',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  mapButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  mapButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default RouteResultScreen;
