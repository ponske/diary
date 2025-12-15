import {
  Attraction,
  SelectedAttraction,
  Priority,
  OptimizationMethod,
  RouteItem,
  RouteItemType,
  WaitingTime,
} from '../types/Models';
import { calculateDistance, calculateTravelTime } from './distance';
import { getWaitingTimeForArrival } from './timeUtils';

/**
 * 優先度の順序
 */
const PRIORITY_ORDER: { [key in Priority]: number } = {
  [Priority.High]: 0,
  [Priority.Medium]: 1,
  [Priority.Low]: 2,
};

/**
 * 選択されたアトラクションを優先度順にソート
 */
function sortByPriority(
  selectedAttractions: SelectedAttraction[]
): SelectedAttraction[] {
  return [...selectedAttractions].sort((a, b) => {
    const priorityDiff =
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    // 優先度が同じ場合は選択順
    return a.selectionOrder - b.selectionOrder;
  });
}

/**
 * 距離最短ルート（最近傍法）
 */
export function optimizeByDistance(
  selectedAttractions: SelectedAttraction[]
): SelectedAttraction[] {
  if (selectedAttractions.length === 0) return [];

  // 優先度順にソート
  const sortedByPriority = sortByPriority(selectedAttractions);

  // 各優先度グループごとに最近傍法を適用
  const result: SelectedAttraction[] = [];
  let currentPriority = sortedByPriority[0].priority;
  let currentGroup: SelectedAttraction[] = [];

  for (const selected of sortedByPriority) {
    if (selected.priority !== currentPriority) {
      // グループが変わったら、現在のグループを最近傍法で並べ替え
      result.push(...nearestNeighbor(currentGroup, result[result.length - 1]));
      currentGroup = [selected];
      currentPriority = selected.priority;
    } else {
      currentGroup.push(selected);
    }
  }

  // 最後のグループを処理
  if (currentGroup.length > 0) {
    result.push(...nearestNeighbor(currentGroup, result[result.length - 1]));
  }

  return result;
}

/**
 * 最近傍法でアトラクションを並べ替え
 */
function nearestNeighbor(
  attractions: SelectedAttraction[],
  lastAttraction?: SelectedAttraction
): SelectedAttraction[] {
  if (attractions.length === 0) return [];
  if (attractions.length === 1) return attractions;

  const result: SelectedAttraction[] = [];
  const remaining = [...attractions];

  // 開始地点を決定
  let current: SelectedAttraction;
  if (lastAttraction) {
    // 前のグループの最後の地点から最も近いものを選択
    const nearestIndex = findNearestIndex(
      lastAttraction.attraction,
      remaining
    );
    current = remaining.splice(nearestIndex, 1)[0];
  } else {
    // 最初のアトラクションを開始地点とする
    current = remaining.shift()!;
  }
  result.push(current);

  // 残りのアトラクションを最近傍法で選択
  while (remaining.length > 0) {
    const nearestIndex = findNearestIndex(current.attraction, remaining);
    current = remaining.splice(nearestIndex, 1)[0];
    result.push(current);
  }

  return result;
}

/**
 * 最も近いアトラクションのインデックスを見つける
 */
function findNearestIndex(
  current: Attraction,
  candidates: SelectedAttraction[]
): number {
  let minDistance = Infinity;
  let minIndex = 0;

  candidates.forEach((candidate, index) => {
    const distance = calculateDistance(
      current.entranceLat,
      current.entranceLng,
      candidate.attraction.entranceLat,
      candidate.attraction.entranceLng
    );
    if (distance < minDistance) {
      minDistance = distance;
      minIndex = index;
    }
  });

  return minIndex;
}

/**
 * 時間最短ルート
 */
export function optimizeByTime(
  selectedAttractions: SelectedAttraction[],
  startTimeMinutes: number,
  waitingTimesMap: Map<string, WaitingTime>
): SelectedAttraction[] {
  if (selectedAttractions.length === 0) return [];

  // 優先度順にソート
  const sortedByPriority = sortByPriority(selectedAttractions);

  const result: SelectedAttraction[] = [];
  const remaining = [...sortedByPriority];
  let currentTime = startTimeMinutes;
  let currentLat = sortedByPriority[0].attraction.entranceLat;
  let currentLng = sortedByPriority[0].attraction.entranceLng;

  while (remaining.length > 0) {
    let minTotalTime = Infinity;
    let minIndex = 0;

    // 各候補について総時間を計算
    remaining.forEach((candidate, index) => {
      const attr = candidate.attraction;

      // 移動時間
      const distance = calculateDistance(
        currentLat,
        currentLng,
        attr.entranceLat,
        attr.entranceLng
      );
      const travelTime = calculateTravelTime(distance);

      // 到着時刻
      const arrivalTime = currentTime + travelTime;

      // 待ち時間
      const waitingTimeData = waitingTimesMap.get(attr.officialId || '');
      const waitingTime = waitingTimeData
        ? getWaitingTimeForArrival(
            arrivalTime,
            waitingTimeData.timeSeries,
            waitingTimeData.waitingMinutes
          )
        : 0;

      // 総時間
      const totalTime = travelTime + waitingTime + attr.durationMinutes;

      if (totalTime < minTotalTime) {
        minTotalTime = totalTime;
        minIndex = index;
      }
    });

    // 最小時間のアトラクションを選択
    const selected = remaining.splice(minIndex, 1)[0];
    result.push(selected);

    // 現在地と時刻を更新
    const attr = selected.attraction;
    const distance = calculateDistance(
      currentLat,
      currentLng,
      attr.entranceLat,
      attr.entranceLng
    );
    const travelTime = calculateTravelTime(distance);
    const arrivalTime = currentTime + travelTime;
    const waitingTimeData = waitingTimesMap.get(attr.officialId || '');
    const waitingTime = waitingTimeData
      ? getWaitingTimeForArrival(
          arrivalTime,
          waitingTimeData.timeSeries,
          waitingTimeData.waitingMinutes
        )
      : 0;

    currentTime = arrivalTime + waitingTime + attr.durationMinutes;
    currentLat = attr.exitLat || attr.entranceLat;
    currentLng = attr.exitLng || attr.entranceLng;
  }

  return result;
}

/**
 * 選択順ルート
 */
export function optimizeBySelection(
  selectedAttractions: SelectedAttraction[]
): SelectedAttraction[] {
  // 選択順にソート
  return [...selectedAttractions].sort(
    (a, b) => a.selectionOrder - b.selectionOrder
  );
}

/**
 * ルートアイテムを生成
 */
export function generateRouteItems(
  orderedAttractions: SelectedAttraction[],
  startTimeMinutes: number,
  waitingTimesMap: Map<string, WaitingTime>
): RouteItem[] {
  const items: RouteItem[] = [];
  let currentTime = startTimeMinutes;
  let currentLat = orderedAttractions[0].attraction.entranceLat;
  let currentLng = orderedAttractions[0].attraction.entranceLng;
  let order = 1;

  for (const selected of orderedAttractions) {
    const attr = selected.attraction;

    // 移動時間を計算
    const distance = calculateDistance(
      currentLat,
      currentLng,
      attr.entranceLat,
      attr.entranceLng
    );
    const travelTime = calculateTravelTime(distance);

    // 到着時刻
    const arrivalTime = currentTime + travelTime;

    // 待ち時間を取得
    const waitingTimeData = waitingTimesMap.get(attr.officialId || '');
    const waitingTime = waitingTimeData
      ? getWaitingTimeForArrival(
          arrivalTime,
          waitingTimeData.timeSeries,
          waitingTimeData.waitingMinutes
        )
      : 0;

    // 出発時刻
    const departureTime = arrivalTime + waitingTime + attr.durationMinutes;

    items.push({
      type: RouteItemType.Attraction,
      attraction: attr,
      priority: selected.priority,
      travelMinutes: travelTime,
      arrivalTimeMinutes: arrivalTime,
      departureTimeMinutes: departureTime,
      waitingMinutes: waitingTime,
      durationMinutes: attr.durationMinutes,
      order: order++,
    });

    // 次のイテレーション用に現在地と時刻を更新
    currentTime = departureTime;
    currentLat = attr.exitLat || attr.entranceLat;
    currentLng = attr.exitLng || attr.entranceLng;
  }

  return items;
}

/**
 * 総移動距離を計算
 */
export function calculateTotalDistance(items: RouteItem[]): number {
  let total = 0;
  let prevLat: number | null = null;
  let prevLng: number | null = null;

  for (const item of items) {
    if (item.type === RouteItemType.Attraction && item.attraction) {
      if (prevLat !== null && prevLng !== null) {
        const distance = calculateDistance(
          prevLat,
          prevLng,
          item.attraction.entranceLat,
          item.attraction.entranceLng
        );
        total += distance;
      }
      prevLat = item.attraction.exitLat || item.attraction.entranceLat;
      prevLng = item.attraction.exitLng || item.attraction.entranceLng;
    }
  }

  return Math.round(total);
}

/**
 * ルートを最適化
 */
export function optimizeRoute(
  selectedAttractions: SelectedAttraction[],
  method: OptimizationMethod,
  startTimeMinutes: number,
  waitingTimesMap: Map<string, WaitingTime>
): { orderedAttractions: SelectedAttraction[]; items: RouteItem[] } {
  let orderedAttractions: SelectedAttraction[];

  switch (method) {
    case OptimizationMethod.Distance:
      orderedAttractions = optimizeByDistance(selectedAttractions);
      break;
    case OptimizationMethod.Time:
      orderedAttractions = optimizeByTime(
        selectedAttractions,
        startTimeMinutes,
        waitingTimesMap
      );
      break;
    case OptimizationMethod.Selection:
      orderedAttractions = optimizeBySelection(selectedAttractions);
      break;
    default:
      orderedAttractions = optimizeBySelection(selectedAttractions);
  }

  const items = generateRouteItems(
    orderedAttractions,
    startTimeMinutes,
    waitingTimesMap
  );

  return { orderedAttractions, items };
}
