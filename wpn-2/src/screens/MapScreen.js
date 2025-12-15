import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { minutesToTimeString } from '../logic/routeOptimizer';

export default function MapScreen({ route }) {
  const { items } = route.params;

  // 実際の実機実装では react-native-maps や MapView を利用し、
  // アトラクション位置にピンを立ててルート線を描画する。
  // ここでは仕様確認用としてシンプルなテキストマップを表示する。

  return (
    <View style={styles.container}>
      <Text style={styles.title}>簡易マップビュー（テキスト）</Text>
      <Text style={styles.caption}>
        実機では地図コンポーネントに置き換え、ピンとルート線を描画します。
      </Text>
      <FlatList
        data={items}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        renderItem={({ item }) => {
          if (item.type === 'break') {
            return (
              <View style={styles.row}>
                <Text style={styles.index}>休憩</Text>
                <View style={styles.body}>
                  <Text style={styles.name}>休憩</Text>
                  <Text style={styles.meta}>
                    {minutesToTimeString(item.arrivalTimeMinutes)} -
                    {minutesToTimeString(item.departureTimeMinutes)} /{' '}
                    {item.durationMinutes}分
                  </Text>
                </View>
              </View>
            );
          }
          return (
            <View style={styles.row}>
              <Text style={styles.index}>{item.index}</Text>
              <View style={styles.body}>
                <Text style={styles.name}>{item.attraction.name}</Text>
                <Text style={styles.meta}>
                  {item.attraction.area_name} / {item.attraction.genre}
                </Text>
                <Text style={styles.meta}>
                  緯度 {item.attraction.latitude}, 経度 {item.attraction.longitude}
                </Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f7f7fb',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  caption: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  index: {
    width: 32,
    fontWeight: '600',
  },
  body: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
  },
  meta: {
    fontSize: 12,
    color: '#666',
  },
});

