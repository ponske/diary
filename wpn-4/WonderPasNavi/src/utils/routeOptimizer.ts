// ルート最適化アルゴリズム

import {
  Attraction,
  Priority,
  SelectedAttraction,
  RouteItem,
  RouteItemType,
  RouteResult,
  OptimizationMethod,
} from '../types';
import { calculateDistance, calculateTravelTime, PARK_ENTRANCE } from './distance';
import { getWaitingTime } from '../services/DataLoader';

/**
 * 優先度でソート（高 > 中 > 低）
 */
function sortByPriority(attractions: SelectedAttraction[]): SelectedAttraction[] {
  const priorityOrder = { [Priority.HIGH]: 0, [Priority.MEDIUM]: 1, [Priority.LOW]: 2 };
  return [...attractions].sort((a, b) => {
    const diff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (diff !== 0) return diff;
    return a.selectionOrder - b.selectionOrder;
  });
}

/**
 * 距離最短ルート（最近傍法）
 */
function optimizeByDistance(
  selectedAttractions: SelectedAttraction[],
  startTimeMinutes: number,
  walkingSpeedMps: number
): Attraction[] {
  const sorted = sortByPriority(selectedAttractions);
  const attractions = sorted.map((s) => s.attraction);

  if (attractions.length === 0) return [];
  if (attractions.length === 1) return attractions;

  const visited = new Set<number>();
  const route: Attraction[] = [];

  // パーク入り口に最も近いアトラクションを開始点とする
  let minDist = Number.MAX_SAFE_INTEGER;
  let startIdx = 0;

  attractions.forEach((attr, idx) => {
    const dist = calculateDistance(
      PARK_ENTRANCE.latitude,
      PARK_ENTRANCE.longitude,
      attr.latitude,
      attr.longitude
    );
    if (dist < minDist) {
      minDist = dist;
      startIdx = idx;
    }
  });

  let current = attractions[startIdx];
  route.push(current);
  visited.add(current.id);

  // 最近傍法
  while (visited.size < attractions.length) {
    let nearestDist = Number.MAX_SAFE_INTEGER;
    let nearestAttr: Attraction | null = null;

    attractions.forEach((attr) => {
      if (visited.has(attr.id)) return;

      const dist = calculateDistance(
        current.exitLatitude,
        current.exitLongitude,
        attr.latitude,
        attr.longitude
      );

      if (dist < nearestDist) {
        nearestDist = dist;
        nearestAttr = attr;
      }
    });

    if (nearestAttr !== null) {
      const selectedAttr: Attraction = nearestAttr;
      route.push(selectedAttr);
      visited.add(selectedAttr.id);
      current = selectedAttr;
    } else {
      break;
    }
  }

  return route;
}

/**
 * 時間最短ルート（貪欲法）
 */
function optimizeByTime(
  selectedAttractions: SelectedAttraction[],
  startTimeMinutes: number,
  walkingSpeedMps: number
): Attraction[] {
  const sorted = sortByPriority(selectedAttractions);
  const attractions = sorted.map((s) => s.attraction);

  if (attractions.length === 0) return [];
  if (attractions.length === 1) return attractions;

  const visited = new Set<number>();
  const route: Attraction[] = [];

  // パーク入り口に最も近いアトラクションを開始点とする
  let minDist = Number.MAX_SAFE_INTEGER;
  let startIdx = 0;

  attractions.forEach((attr, idx) => {
    const dist = calculateDistance(
      PARK_ENTRANCE.latitude,
      PARK_ENTRANCE.longitude,
      attr.latitude,
      attr.longitude
    );
    if (dist < minDist) {
      minDist = dist;
      startIdx = idx;
    }
  });

  let current = attractions[startIdx];
  let currentTime = startTimeMinutes;
  route.push(current);
  visited.add(current.id);

  // 時間最短の貪欲法
  while (visited.size < attractions.length) {
    let minTotalTime = Number.MAX_SAFE_INTEGER;
    let nextAttr: Attraction | null = null;

    attractions.forEach((attr) => {
      if (visited.has(attr.id)) return;

      const distance = calculateDistance(
        current.exitLatitude,
        current.exitLongitude,
        attr.latitude,
        attr.longitude
      );
      const travelTime = calculateTravelTime(distance, walkingSpeedMps);
      const arrivalTime = currentTime + travelTime;
      const waitingTime = getWaitingTime(attr.officialId, arrivalTime);
      const totalTime = travelTime + waitingTime + attr.durationMinutes;

      if (totalTime < minTotalTime) {
        minTotalTime = totalTime;
        nextAttr = attr;
      }
    });

    if (nextAttr !== null) {
      const selectedAttr: Attraction = nextAttr;
      const distance = calculateDistance(
        current.exitLatitude,
        current.exitLongitude,
        selectedAttr.latitude,
        selectedAttr.longitude
      );
      const travelTime = calculateTravelTime(distance, walkingSpeedMps);
      const arrivalTime = currentTime + travelTime;
      const waitingTime = getWaitingTime(selectedAttr.officialId, arrivalTime);

      currentTime = arrivalTime + waitingTime + selectedAttr.durationMinutes;
      route.push(selectedAttr);
      visited.add(selectedAttr.id);
      current = selectedAttr;
    } else {
      break;
    }
  }

  return route;
}

/**
 * ユーザー入力順ルート
 */
function optimizeByUserOrder(
  selectedAttractions: SelectedAttraction[]
): Attraction[] {
  return [...selectedAttractions]
    .sort((a, b) => a.selectionOrder - b.selectionOrder)
    .map((s) => s.attraction);
}

/**
 * 全探索（10地点以下の場合のみ）
 */
function optimizeByBruteForce(
  selectedAttractions: SelectedAttraction[],
  startTimeMinutes: number,
  walkingSpeedMps: number
): Attraction[] {
  const sorted = sortByPriority(selectedAttractions);
  const attractions = sorted.map((s) => s.attraction);

  if (attractions.length > 10) {
    // 10を超える場合は時間最短を返す
    return optimizeByTime(selectedAttractions, startTimeMinutes, walkingSpeedMps);
  }

  if (attractions.length === 0) return [];
  if (attractions.length === 1) return attractions;

  // 順列を生成
  function permute(arr: Attraction[]): Attraction[][] {
    if (arr.length <= 1) return [arr];
    const result: Attraction[][] = [];
    for (let i = 0; i < arr.length; i++) {
      const rest: Attraction[] = [...arr.slice(0, i), ...arr.slice(i + 1)];
      const perms: Attraction[][] = permute(rest);
      perms.forEach((perm: Attraction[]) => {
        result.push([arr[i], ...perm]);
      });
    }
    return result;
  }

  const allRoutes = permute(attractions);
  let minTime = Number.MAX_SAFE_INTEGER;
  let bestRoute: Attraction[] = attractions;

  // 各順列の総所要時間を計算
  allRoutes.forEach((route) => {
    let currentTime = startTimeMinutes;
    let prevLat = PARK_ENTRANCE.latitude;
    let prevLng = PARK_ENTRANCE.longitude;
    let totalTime = 0;

    route.forEach((attr) => {
      const distance = calculateDistance(prevLat, prevLng, attr.latitude, attr.longitude);
      const travelTime = calculateTravelTime(distance, walkingSpeedMps);
      const arrivalTime = currentTime + travelTime;
      const waitingTime = getWaitingTime(attr.officialId, arrivalTime);

      totalTime += travelTime + waitingTime + attr.durationMinutes;
      currentTime = arrivalTime + waitingTime + attr.durationMinutes;
      prevLat = attr.exitLatitude;
      prevLng = attr.exitLongitude;
    });

    if (totalTime < minTime) {
      minTime = totalTime;
      bestRoute = route;
    }
  });

  return bestRoute;
}

/**
 * ルートを最適化
 */
export function optimizeRoute(
  selectedAttractions: SelectedAttraction[],
  method: OptimizationMethod,
  startTimeMinutes: number,
  walkingSpeedMps: number = 80
): Attraction[] {
  switch (method) {
    case OptimizationMethod.DISTANCE:
      return optimizeByDistance(selectedAttractions, startTimeMinutes, walkingSpeedMps);
    case OptimizationMethod.TIME:
      return optimizeByTime(selectedAttractions, startTimeMinutes, walkingSpeedMps);
    case OptimizationMethod.USER_ORDER:
      return optimizeByUserOrder(selectedAttractions);
    case OptimizationMethod.BRUTE_FORCE:
      return optimizeByBruteForce(selectedAttractions, startTimeMinutes, walkingSpeedMps);
    default:
      return optimizeByTime(selectedAttractions, startTimeMinutes, walkingSpeedMps);
  }
}

/**
 * ルートアイテムを計算
 */
export function calculateRouteItems(
  route: Attraction[],
  selectedAttractions: SelectedAttraction[],
  startTimeMinutes: number,
  walkingSpeedMps: number = 80
): RouteItem[] {
  const items: RouteItem[] = [];
  let currentTime = startTimeMinutes;
  let prevLat = PARK_ENTRANCE.latitude;
  let prevLng = PARK_ENTRANCE.longitude;

  route.forEach((attraction, index) => {
    // 移動時間を計算
    const distance = calculateDistance(
      prevLat,
      prevLng,
      attraction.latitude,
      attraction.longitude
    );
    const travelMinutes = calculateTravelTime(distance, walkingSpeedMps);

    // 到着時刻
    const arrivalTimeMinutes = currentTime + travelMinutes;

    // 待ち時間を取得
    const waitingMinutes = getWaitingTime(attraction.officialId, arrivalTimeMinutes);

    // 出発時刻
    const departureTimeMinutes =
      arrivalTimeMinutes + waitingMinutes + attraction.durationMinutes;

    // 優先度を取得
    const selected = selectedAttractions.find((s) => s.attraction.id === attraction.id);
    const priority = selected?.priority || Priority.MEDIUM;

    items.push({
      type: RouteItemType.ATTRACTION,
      attraction,
      priority,
      travelMinutes,
      arrivalTimeMinutes,
      departureTimeMinutes,
      waitingMinutes,
      durationMinutes: attraction.durationMinutes,
      orderNumber: index + 1,
    });

    // 次のループのための更新
    currentTime = departureTimeMinutes;
    prevLat = attraction.exitLatitude;
    prevLng = attraction.exitLongitude;
  });

  return items;
}

/**
 * ルート結果を計算
 */
export function calculateRouteResult(
  selectedAttractions: SelectedAttraction[],
  method: OptimizationMethod,
  startTimeMinutes: number,
  endTimeMinutes: number,
  walkingSpeedMps: number = 80
): RouteResult {
  const route = optimizeRoute(selectedAttractions, method, startTimeMinutes, walkingSpeedMps);
  const items = calculateRouteItems(route, selectedAttractions, startTimeMinutes, walkingSpeedMps);

  // 総距離を計算
  let totalDistance = 0;
  let prevLat = PARK_ENTRANCE.latitude;
  let prevLng = PARK_ENTRANCE.longitude;

  route.forEach((attraction) => {
    const distance = calculateDistance(
      prevLat,
      prevLng,
      attraction.latitude,
      attraction.longitude
    );
    totalDistance += distance;
    prevLat = attraction.exitLatitude;
    prevLng = attraction.exitLongitude;
  });

  // 総時間
  const totalTimeMinutes =
    items.length > 0
      ? items[items.length - 1].departureTimeMinutes - startTimeMinutes
      : 0;

  // 閉園時刻超過チェック
  const exceedsClosingTime =
    items.length > 0 && items[items.length - 1].departureTimeMinutes > endTimeMinutes;

  return {
    items,
    totalDistance,
    totalTimeMinutes,
    startTimeMinutes,
    endTimeMinutes,
    exceedsClosingTime,
  };
}

/**
 * 時刻（分）を文字列に変換
 */
export function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * 文字列を時刻（分）に変換
 */
export function timeStringToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}
