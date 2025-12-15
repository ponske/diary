import { calculateDistance, calculateTravelTime, PARK_ENTRANCE } from '../utils/distance';
import { timeStringToMinutes, getWaitingTimeForTime } from '../utils/time';
import { RouteItem } from '../models/RouteItem';

export class RouteOptimizer {
  constructor(attractions, waitingTimes, walkingSpeed = 80) {
    this.attractions = attractions;
    this.waitingTimes = waitingTimes;
    this.walkingSpeed = walkingSpeed;
    this.waitingTimeMap = this.buildWaitingTimeMap();
  }

  buildWaitingTimeMap() {
    const map = {};
    for (const wt of this.waitingTimes) {
      const attrId = typeof wt.attr_id === 'string' ? parseInt(wt.attr_id, 10) : wt.attr_id;
      map[attrId] = wt;
      // official_idが文字列の場合も対応
      if (wt.attr_id && typeof wt.attr_id === 'string') {
        map[wt.attr_id] = wt;
      }
    }
    return map;
  }

  getWaitingTime(attraction, arrivalMinutes) {
    if (!attraction.officialId) {
      return 20; // デフォルト20分
    }
    const officialId = parseInt(attraction.officialId, 10);
    const waitingData = this.waitingTimeMap[officialId] || this.waitingTimeMap[attraction.officialId];
    if (!waitingData) {
      return 20; // デフォルト20分
    }
    return getWaitingTimeForTime(waitingData, arrivalMinutes);
  }

  // 距離最短ルート（最近傍法）
  optimizeByDistance(selectedAttractions, startTime, priorityOrder) {
    const sorted = this.sortByPriority(selectedAttractions, priorityOrder);
    const route = [];
    let currentLat = PARK_ENTRANCE.lat;
    let currentLng = PARK_ENTRANCE.lng;
    let currentTime = timeStringToMinutes(startTime);
    const visited = new Set();

    for (const item of sorted) {
      const attraction = item.attraction;
      const distance = calculateDistance(
        currentLat,
        currentLng,
        attraction.getLatitude(),
        attraction.getLongitude()
      );
      const travelMinutes = calculateTravelTime(distance, this.walkingSpeed);
      const arrivalMinutes = currentTime + travelMinutes;
      const waitingMinutes = this.getWaitingTime(attraction, arrivalMinutes);
      const durationMinutes = attraction.durationMinutes || 20;
      const departureMinutes = arrivalMinutes + waitingMinutes + durationMinutes;

      const routeItem = new RouteItem('attraction', {
        attraction,
        priority: item.priority,
        travelMinutes,
        arrivalTimeMinutes: arrivalMinutes,
        departureTimeMinutes: departureMinutes,
        waitingMinutes,
        durationMinutes,
        order: route.length + 1,
      });

      route.push(routeItem);
      currentLat = attraction.exitLat || attraction.getLatitude();
      currentLng = attraction.exitLng || attraction.getLongitude();
      currentTime = departureMinutes;
      visited.add(attraction.id);
    }

    return route;
  }

  // 時間最短ルート
  optimizeByTime(selectedAttractions, startTime, priorityOrder) {
    const sorted = this.sortByPriority(selectedAttractions, priorityOrder);
    const route = [];
    let currentLat = PARK_ENTRANCE.lat;
    let currentLng = PARK_ENTRANCE.lng;
    let currentTime = timeStringToMinutes(startTime);
    const unvisited = [...sorted];

    while (unvisited.length > 0) {
      let bestItem = null;
      let bestTotalTime = Infinity;
      let bestIndex = -1;

      for (let i = 0; i < unvisited.length; i++) {
        const item = unvisited[i];
        const attraction = item.attraction;
        const distance = calculateDistance(
          currentLat,
          currentLng,
          attraction.getLatitude(),
          attraction.getLongitude()
        );
        const travelMinutes = calculateTravelTime(distance, this.walkingSpeed);
        const arrivalMinutes = currentTime + travelMinutes;
        const waitingMinutes = this.getWaitingTime(attraction, arrivalMinutes);
        const durationMinutes = attraction.durationMinutes || 20;
        const totalTime = travelMinutes + waitingMinutes + durationMinutes;

        if (totalTime < bestTotalTime) {
          bestTotalTime = totalTime;
          bestItem = item;
          bestIndex = i;
        }
      }

      if (bestItem) {
        const attraction = bestItem.attraction;
        const distance = calculateDistance(
          currentLat,
          currentLng,
          attraction.getLatitude(),
          attraction.getLongitude()
        );
        const travelMinutes = calculateTravelTime(distance, this.walkingSpeed);
        const arrivalMinutes = currentTime + travelMinutes;
        const waitingMinutes = this.getWaitingTime(attraction, arrivalMinutes);
        const durationMinutes = attraction.durationMinutes || 20;
        const departureMinutes = arrivalMinutes + waitingMinutes + durationMinutes;

        const routeItem = new RouteItem('attraction', {
          attraction: attraction,
          priority: bestItem.priority,
          travelMinutes,
          arrivalTimeMinutes: arrivalMinutes,
          departureTimeMinutes: departureMinutes,
          waitingMinutes,
          durationMinutes,
          order: route.length + 1,
        });

        route.push(routeItem);
        currentLat = attraction.exitLat || attraction.getLatitude();
        currentLng = attraction.exitLng || attraction.getLongitude();
        currentTime = departureMinutes;
        unvisited.splice(bestIndex, 1);
      }
    }

    return route;
  }

  // 全探索（10地点以下）
  optimizeByExhaustive(selectedAttractions, startTime, priorityOrder, onProgress) {
    const sorted = this.sortByPriority(selectedAttractions, priorityOrder);
    
    if (sorted.length > 10) {
      // 10地点を超える場合は時間最短にフォールバック
      return this.optimizeByTime(selectedAttractions, startTime, priorityOrder);
    }

    // 順列を生成
    const permutations = this.generatePermutations(sorted);
    let bestRoute = null;
    let bestTotalTime = Infinity;
    const totalPermutations = permutations.length;

    // プログレス更新の頻度を調整（100回に1回または全探索が少ない場合は毎回）
    const updateInterval = Math.max(1, Math.floor(totalPermutations / 100));

    for (let i = 0; i < permutations.length; i++) {
      const perm = permutations[i];
      const route = this.calculateRouteForPermutation(perm, startTime);
      const totalTime = route[route.length - 1]?.departureTimeMinutes || Infinity;

      if (totalTime < bestTotalTime) {
        bestTotalTime = totalTime;
        bestRoute = route;
      }

      // プログレスを更新（一定間隔で更新してパフォーマンスを向上）
      if (onProgress && (i % updateInterval === 0 || i === permutations.length - 1)) {
        onProgress((i + 1) / totalPermutations);
      }
    }

    return bestRoute || [];
  }

  generatePermutations(arr) {
    if (arr.length <= 1) return [arr];
    const result = [];
    for (let i = 0; i < arr.length; i++) {
      const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
      const perms = this.generatePermutations(rest);
      for (const perm of perms) {
        result.push([arr[i], ...perm]);
      }
    }
    return result;
  }

  calculateRouteForPermutation(permutation, startTime) {
    const route = [];
    let currentLat = PARK_ENTRANCE.lat;
    let currentLng = PARK_ENTRANCE.lng;
    let currentTime = timeStringToMinutes(startTime);

    for (let i = 0; i < permutation.length; i++) {
      const item = permutation[i];
      const attraction = item.attraction;
      const distance = calculateDistance(
        currentLat,
        currentLng,
        attraction.getLatitude(),
        attraction.getLongitude()
      );
      const travelMinutes = calculateTravelTime(distance, this.walkingSpeed);
      const arrivalMinutes = currentTime + travelMinutes;
      const waitingMinutes = this.getWaitingTime(attraction, arrivalMinutes);
      const durationMinutes = attraction.durationMinutes || 20;
      const departureMinutes = arrivalMinutes + waitingMinutes + durationMinutes;

      const routeItem = new RouteItem('attraction', {
        attraction: attraction,
        priority: item.priority,
        travelMinutes,
        arrivalTimeMinutes: arrivalMinutes,
        departureTimeMinutes: departureMinutes,
        waitingMinutes,
        durationMinutes,
        order: i + 1,
      });

      route.push(routeItem);
      currentLat = attraction.exitLat || attraction.getLatitude();
      currentLng = attraction.exitLng || attraction.getLongitude();
      currentTime = departureMinutes;
    }

    return route;
  }

  // ユーザー入力順ルート
  optimizeByUserOrder(selectedAttractions, startTime) {
    const route = [];
    let currentLat = PARK_ENTRANCE.lat;
    let currentLng = PARK_ENTRANCE.lng;
    let currentTime = timeStringToMinutes(startTime);

    for (let i = 0; i < selectedAttractions.length; i++) {
      const item = selectedAttractions[i];
      const attraction = item.attraction;
      const distance = calculateDistance(
        currentLat,
        currentLng,
        attraction.getLatitude(),
        attraction.getLongitude()
      );
      const travelMinutes = calculateTravelTime(distance, this.walkingSpeed);
      const arrivalMinutes = currentTime + travelMinutes;
      const waitingMinutes = this.getWaitingTime(attraction, arrivalMinutes);
      const durationMinutes = attraction.durationMinutes || 20;
      const departureMinutes = arrivalMinutes + waitingMinutes + durationMinutes;

      const routeItem = new RouteItem('attraction', {
        attraction: attraction,
        priority: item.priority,
        travelMinutes,
        arrivalTimeMinutes: arrivalMinutes,
        departureTimeMinutes: departureMinutes,
        waitingMinutes,
        durationMinutes,
        order: i + 1,
      });

      route.push(routeItem);
      currentLat = attraction.exitLat || attraction.getLatitude();
      currentLng = attraction.exitLng || attraction.getLongitude();
      currentTime = departureMinutes;
    }

    return route;
  }

  sortByPriority(items, priorityOrder) {
    const priorityMap = { high: 3, medium: 2, low: 1 };
    return [...items].sort((a, b) => {
      const aPriority = priorityMap[a.priority] || 0;
      const bPriority = priorityMap[b.priority] || 0;
      return bPriority - aPriority;
    });
  }
}
