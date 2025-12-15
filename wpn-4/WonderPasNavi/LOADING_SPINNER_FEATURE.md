# キラキラスピナー機能の実装

## 概要

10地点以下を選択して全探索（総当たり）アルゴリズムを実行する際に、計算中であることを視覚的に分かりやすく伝えるため、キラキラするアニメーション付きのローディングスピナーを実装しました。

## 実装ファイル

### 1. LoadingSpinner.tsx
**パス**: `src/components/LoadingSpinner.tsx`

キラキラするアニメーション付きスピナーコンポーネント

#### 機能
- **モーダル表示**: 全画面を覆うオーバーレイ
- **回転アニメーション**: 3つの点が回転するアウターサークル
- **キラキラアニメーション**: ✨絵文字が順番に拡大・縮小
- **フェードイン・アウト**: 透明度が変化する光の効果
- **中央アイコン**: 🎢でディズニーランドを表現
- **メッセージ表示**: カスタマイズ可能なメッセージ

#### アニメーションの詳細

1. **回転アニメーション**
   - 3つのドット（青・黄・赤）が円形に配置
   - 2秒で360度回転
   - 連続ループ

2. **キラキラ効果**
   - 3つの✨が順番に拡大（1.5倍）→縮小（1.0倍）
   - 各スターは200msずつ遅延して開始
   - 800msかけて拡大・縮小

3. **フェード効果**
   - 透明度が0.3→1.0→0.3と変化
   - 800msで切り替わり

### 2. RouteSettingsScreen.tsx の更新
**パス**: `src/screens/RouteSettingsScreen.tsx`

#### 変更点

##### 追加されたステート
```typescript
const [isCalculating, setIsCalculating] = useState(false);
```

##### handleCalculateRoute の非同期化
```typescript
const handleCalculateRoute = async () => {
  // 全探索の場合はスピナーを表示
  if (selectedMethod === OptimizationMethod.BRUTE_FORCE && 
      selectedAttractions.length <= 10) {
    setIsCalculating(true);
    
    // UIスレッドをブロックしないために100ms遅延
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // ルート計算実行
    const result = calculateRouteResult(...);
    
    setIsCalculating(false);
    // 結果処理
  }
}
```

##### LoadingSpinnerの表示
```typescript
<LoadingSpinner
  visible={isCalculating}
  message={`最適なルートを計算中...${
    selectedMethod === OptimizationMethod.BRUTE_FORCE
      ? `\n${selectedAttractions.length}地点の全ての順列を探索`
      : ''
  }`}
/>
```

## 使用シーン

### トリガー条件
1. ルート最適化方法で「全探索」を選択
2. 選択したアトラクションが10件以下
3. 「ルートを計算」ボタンをタップ

### 表示内容
- **メインメッセージ**: "最適なルートを計算中..."
- **サブメッセージ**: "○地点の全ての順列を探索"
- **詳細情報**: "全ての順列を計算しています..."

## 技術的な工夫

### 1. UIスレッドのブロック回避
全探索は計算量が多い（最大10! = 3,628,800通り）ため、同期的に実行するとUIがフリーズします。

**解決策**: 
- `setTimeout(resolve, 100)` で100ms遅延を挟む
- この間にReact Nativeがスピナーをレンダリング
- ユーザーは計算中であることを視認できる

### 2. エラーハンドリング
```typescript
try {
  const result = calculateRouteResult(...);
  setIsCalculating(false);
  // 結果処理
} catch (error) {
  setIsCalculating(false);
  Alert.alert('エラー', 'ルート計算に失敗しました。');
}
```

### 3. 低優先度削除機能でもスピナー対応
閉園時刻超過時に低優先度を削除して再計算する場合も、全探索ならスピナーを表示。

## 計算時間の目安

| 地点数 | 順列数 | 予想時間 |
|--------|--------|----------|
| 3地点  | 6通り  | < 0.1秒  |
| 5地点  | 120通り | < 0.5秒  |
| 7地点  | 5,040通り | 1-2秒 |
| 10地点 | 3,628,800通り | 5-10秒 |

※ 端末の性能により変動します

## ユーザー体験の向上

### ビフォー（スピナーなし）
- ボタンをタップしても反応がない
- 画面がフリーズしたように見える
- ユーザーは何度もタップしてしまう可能性

### アフター（スピナーあり）
- ✅ すぐにスピナーが表示される
- ✅ 計算中であることが明確
- ✅ キラキラアニメーションで楽しい
- ✅ 待ち時間が苦にならない
- ✅ ディズニーの魔法のような演出

## カスタマイズ

### メッセージの変更
```typescript
<LoadingSpinner
  visible={isCalculating}
  message="カスタムメッセージ"
/>
```

### アニメーション速度の調整
`LoadingSpinner.tsx`内のduration値を変更：
- `duration: 2000` → 回転速度
- `duration: 400` → キラキラ速度
- `duration: 800` → フェード速度

### 色の変更
```typescript
const styles = StyleSheet.create({
  outerDot: {
    backgroundColor: '#4A90E2', // 青
  },
  outerDot2: {
    backgroundColor: '#FFD93D', // 黄
  },
  outerDot3: {
    backgroundColor: '#FF6B6B', // 赤
  },
});
```

## まとめ

全探索アルゴリズムの実行時に、ユーザーに分かりやすく楽しい待機体験を提供するため、キラキラするアニメーション付きスピナーを実装しました。これにより、計算中であることが明確になり、ユーザー体験が大幅に向上しました。
