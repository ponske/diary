import { calculateDistance, calculateTravelMinutes, PARK_ENTRANCE } from '../utils/distance';
import { timeStringToMinutes, getWaitingInfoForArrival } from '../utils/time';
import { RouteItem } from '../models/RouteItem';

const PRIORITY_SCORE = { high: 3, medium: 2, low: 1 };

export class RouteOptimizer {
  constructor(waitingTimes, walkingSpeed = 80) {
    this.waitingTimes = waitingTimes || [];
    this.walkingSpeed = walkingSpeed || 80;
    this.waitingTimeMap = this.buildWaitingTimeMap();
  }

  buildWaitingTimeMap() {
    const map = {};
    for (const wt of this.waitingTimes) {
      if (!wt) continue;
      const key = wt.attr_id;
      if (key == null) continue;
      map[String(key)] = wt;
      // 数値キーも
      if (typeof key === 'number') map[key] = wt;
    }
    return map;
  }

  getWaitingInfo(attraction, arrivalMinutes) {
    const officialId = attraction?.officialId ? String(attraction.officialId) : '';
    if (!officialId) {
      return { waitingMinutes: 20, timestamp: null };
    }
    const waitingData = this.waitingTimeMap[officialId] || this.waitingTimeMap[parseInt(officialId, 10)];
    return getWaitingInfoForArrival(waitingData, arrivalMinutes);
  }

  // 優先度: 残りの中で最も高いものだけを候補にする
  pickCandidatesByHighestPriority(remaining) {
    let bestScore = -Infinity;
    for (const it of remaining) {
      bestScore = Math.max(bestScore, PRIORITY_SCORE[it.priority] || 0);
    }
    return remaining.filter((it) => (PRIORITY_SCORE[it.priority] || 0) === bestScore);
  }

  splitSelections(selectedItems) {
    const attractions = (selectedItems || []).filter((x) => !x.type || x.type === 'attraction');
    const reservations = (selectedItems || []).filter((x) => x.type === 'reservation');
    return { attractions, reservations };
  }

  normalizeReservation(r) {
    const t = r?.reservationTimeMinutes;
    if (typeof t === 'number') return { ...r, reservationTimeMinutes: t };
    const ts = r?.reservationTime;
    if (typeof ts !== 'string') return { ...r, reservationTimeMinutes: null };
    return { ...r, reservationTimeMinutes: timeStringToMinutes(ts) };
  }

  // 予約（固定時刻）を、アトラクション順序の中に“時間衝突しないように”差し込む（座標無しなので簡易）
  buildOrderWithReservations(attractionOrder, startTime, reservations) {
    const resList = (reservations || [])
      .map((r) => this.normalizeReservation(r))
      .filter((r) => typeof r.reservationTimeMinutes === 'number')
      .sort((a, b) => a.reservationTimeMinutes - b.reservationTimeMinutes);

    if (resList.length === 0) return [...attractionOrder];

    const merged = [];
    let currentLat = PARK_ENTRANCE.lat;
    let currentLng = PARK_ENTRANCE.lng;
    let currentTime = timeStringToMinutes(startTime);

    const consumeReservation = (r) => {
      const arrival = Math.max(currentTime, r.reservationTimeMinutes);
      const duration = r.durationMinutes || 60;
      currentTime = arrival + duration;
      merged.push({ type: 'reservation', ...r });
      // 座標不明のため位置は変えない
    };

    let ri = 0;

    for (const item of attractionOrder) {
      // 次の予約があって、今このアトラクションをやると予約開始を跨ぐ場合は先に予約を入れる
      while (ri < resList.length) {
        const r = resList[ri];
        if (currentTime >= r.reservationTimeMinutes) {
          consumeReservation(r);
          ri += 1;
          continue;
        }

        const a = item.attraction;
        const dist = calculateDistance(currentLat, currentLng, a.getLatitude(), a.getLongitude());
        const travel = calculateTravelMinutes(dist, this.walkingSpeed);
        const arrival = currentTime + travel;
        const w = this.getWaitingInfo(a, arrival);
        const duration = a.durationMinutes || 15;
        const predictedDepart = arrival + w.waitingMinutes + duration;

        if (currentTime < r.reservationTimeMinutes && predictedDepart > r.reservationTimeMinutes) {
          consumeReservation(r);
          ri += 1;
          continue;
        }
        break;
      }

      merged.push(item);
      // ここでも簡易シミュレーションを進める
      const a = item.attraction;
      const dist = calculateDistance(currentLat, currentLng, a.getLatitude(), a.getLongitude());
      const travel = calculateTravelMinutes(dist, this.walkingSpeed);
      const arrival = currentTime + travel;
      const w = this.getWaitingInfo(a, arrival);
      const duration = a.durationMinutes || 15;
      const depart = arrival + w.waitingMinutes + duration;
      currentLat = a.getExitLatitude();
      currentLng = a.getExitLongitude();
      currentTime = depart;
    }

    while (ri < resList.length) {
      consumeReservation(resList[ri]);
      ri += 1;
    }

    return merged;
  }

  optimizeByDistance(selectedAttractions, startTime) {
    const { attractions, reservations } = this.splitSelections(selectedAttractions);
    const remaining = [...attractions];
    const ordered = [];

    let currentLat = PARK_ENTRANCE.lat;
    let currentLng = PARK_ENTRANCE.lng;

    while (remaining.length > 0) {
      const candidates = this.pickCandidatesByHighestPriority(remaining);
      let bestIndexInRemaining = -1;
      let bestDistance = Infinity;

      for (const c of candidates) {
        const attraction = c.attraction;
        const d = calculateDistance(currentLat, currentLng, attraction.getLatitude(), attraction.getLongitude());
        if (d < bestDistance) {
          bestDistance = d;
          bestIndexInRemaining = remaining.indexOf(c);
        }
      }

      const picked = remaining.splice(bestIndexInRemaining, 1)[0];
      ordered.push(picked);

      currentLat = picked.attraction.getExitLatitude();
      currentLng = picked.attraction.getExitLongitude();
    }

    const merged = this.buildOrderWithReservations(ordered, startTime, reservations);
    return this.buildRouteItemsFromOrder(merged, startTime);
  }

  optimizeByTime(selectedAttractions, startTime) {
    const { attractions, reservations } = this.splitSelections(selectedAttractions);
    const remaining = [...attractions];
    const ordered = [];

    let currentLat = PARK_ENTRANCE.lat;
    let currentLng = PARK_ENTRANCE.lng;
    let currentTime = timeStringToMinutes(startTime);

    while (remaining.length > 0) {
      const candidates = this.pickCandidatesByHighestPriority(remaining);
      let bestIdx = -1;
      let bestTotal = Infinity;

      for (const c of candidates) {
        const a = c.attraction;
        const dist = calculateDistance(currentLat, currentLng, a.getLatitude(), a.getLongitude());
        const travel = calculateTravelMinutes(dist, this.walkingSpeed);
        const arrival = currentTime + travel;
        const w = this.getWaitingInfo(a, arrival);
        const duration = a.durationMinutes || 15;
        const total = travel + w.waitingMinutes + duration;
        if (total < bestTotal) {
          bestTotal = total;
          bestIdx = remaining.indexOf(c);
        }
      }

      const picked = remaining.splice(bestIdx, 1)[0];
      ordered.push(picked);

      // 次評価のため、時刻も更新
      const a = picked.attraction;
      const dist = calculateDistance(currentLat, currentLng, a.getLatitude(), a.getLongitude());
      const travel = calculateTravelMinutes(dist, this.walkingSpeed);
      const arrival = currentTime + travel;
      const w = this.getWaitingInfo(a, arrival);
      const duration = a.durationMinutes || 15;
      const depart = arrival + w.waitingMinutes + duration;

      currentLat = a.getExitLatitude();
      currentLng = a.getExitLongitude();
      currentTime = depart;
    }

    const merged = this.buildOrderWithReservations(ordered, startTime, reservations);
    return this.buildRouteItemsFromOrder(merged, startTime);
  }

  async optimizeByExhaustive(selectedAttractions, startTime, onProgress, shouldCancel) {
    const { attractions, reservations } = this.splitSelections(selectedAttractions);
    // 10以下のみ
    if (attractions.length > 10) {
      return this.optimizeByTime(selectedAttractions, startTime);
    }

    // 優先度グループごとに順列（高→中→低）
    const groups = {
      high: attractions.filter((x) => x.priority === 'high'),
      medium: attractions.filter((x) => x.priority === 'medium'),
      low: attractions.filter((x) => x.priority === 'low'),
    };

    const groupKeys = ['high', 'medium', 'low'].filter((k) => groups[k].length > 0);

    const factorial = (n) => {
      let r = 1;
      for (let i = 2; i <= n; i++) r *= i;
      return r;
    };

    const totalCount = groupKeys.reduce((acc, k) => acc * factorial(groups[k].length), 1);
    let visitedCount = 0;

    let bestRoute = null;
    let bestEndTime = Infinity;

    const yieldEvery = 200; // 体感を落としすぎない程度

    const permute = async (arr, cb, prefix = []) => {
      if (shouldCancel?.()) return;
      if (arr.length === 0) {
        await cb(prefix);
        return;
      }
      for (let i = 0; i < arr.length; i++) {
        if (shouldCancel?.()) return;
        const next = arr[i];
        const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
        await permute(rest, cb, [...prefix, next]);
      }
    };

    const recurseGroups = async (gi, prefixOrder) => {
      if (shouldCancel?.()) return;
      if (gi >= groupKeys.length) {
        const merged = this.buildOrderWithReservations(prefixOrder, startTime, reservations);
        const route = this.buildRouteItemsFromOrder(merged, startTime);
        const end = route[route.length - 1]?.departureTimeMinutes ?? Infinity;
        if (end < bestEndTime) {
          bestEndTime = end;
          bestRoute = route;
        }

        visitedCount += 1;
        if (onProgress && (visitedCount % yieldEvery === 0 || visitedCount === totalCount)) {
          onProgress(Math.min(1, visitedCount / totalCount));
          await new Promise((r) => setTimeout(r, 0));
        }
        return;
      }

      const key = groupKeys[gi];
      const arr = groups[key];

      await permute(arr, async (perm) => {
        await recurseGroups(gi + 1, [...prefixOrder, ...perm]);
      });
    };

    await recurseGroups(0, []);

    if (shouldCancel?.()) return [];
    if (onProgress) onProgress(1);

    return bestRoute || [];
  }

  optimizeByUserOrder(selectedAttractions, startTime) {
    const { attractions, reservations } = this.splitSelections(selectedAttractions);
    const merged = this.buildOrderWithReservations(attractions, startTime, reservations);
    return this.buildRouteItemsFromOrder(merged, startTime);
  }

  // order: [{attraction, priority}, ...] の順番をそのまま時刻計算
  buildRouteItemsFromOrder(order, startTime, existingBreaks = null) {
    const route = [];

    let currentLat = PARK_ENTRANCE.lat;
    let currentLng = PARK_ENTRANCE.lng;
    let currentTime = timeStringToMinutes(startTime);

    for (let i = 0; i < order.length; i++) {
      const item = order[i];

      if (item.type === 'break') {
        const duration = item.durationMinutes || 30;
        const arrival = currentTime;
        const depart = arrival + duration;
        route.push(
          new RouteItem('break', {
            order: route.length + 1,
            breakLabel: item.breakLabel || '休憩',
            breakMemo: item.breakMemo || '',
            travelMinutes: 0,
            arrivalTimeMinutes: arrival,
            departureTimeMinutes: depart,
            waitingMinutes: 0,
            durationMinutes: duration,
          })
        );
        currentTime = depart;
        continue;
      }

      if (item.type === 'reservation') {
        const normalized = this.normalizeReservation(item);
        const kind = normalized.reservationKind || 'restaurant';
        const duration = normalized.durationMinutes || 60;
        const target = typeof normalized.reservationTimeMinutes === 'number' ? normalized.reservationTimeMinutes : currentTime;
        const arrival = Math.max(currentTime, target);
        const depart = arrival + duration;
        route.push(
          new RouteItem('reservation', {
            order: route.length + 1,
            reservationKind: kind,
            reservationName: normalized.reservationName || (kind === 'show' ? 'ショー/パレード' : '予約レストラン'),
            reservationArea: normalized.reservationArea || '',
            reservationTimeMinutes: target,
            travelMinutes: 0,
            arrivalTimeMinutes: arrival,
            departureTimeMinutes: depart,
            waitingMinutes: 0,
            durationMinutes: duration,
          })
        );
        currentTime = depart;
        continue;
      }

      const a = item.attraction;
      const dist = calculateDistance(currentLat, currentLng, a.getLatitude(), a.getLongitude());
      const travel = calculateTravelMinutes(dist, this.walkingSpeed);
      const arrival = currentTime + travel;
      const w = this.getWaitingInfo(a, arrival);
      const duration = a.durationMinutes || 15;
      const depart = arrival + w.waitingMinutes + duration;

      route.push(
        new RouteItem('attraction', {
          attraction: a,
          priority: item.priority,
          order: route.length + 1,
          travelMinutes: travel,
          arrivalTimeMinutes: arrival,
          departureTimeMinutes: depart,
          waitingMinutes: w.waitingMinutes,
          waitingTimestamp: w.timestamp,
          durationMinutes: duration,
        })
      );

      currentLat = a.getExitLatitude();
      currentLng = a.getExitLongitude();
      currentTime = depart;
    }

    // もし既存の休憩を渡されたら、ここでの計算は使わない（将来拡張用）
    return route;
  }
}
