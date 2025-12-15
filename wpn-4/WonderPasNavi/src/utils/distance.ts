// 距離計算ユーティリティ

// 地球の半径（メートル）
const EARTH_RADIUS_M = 6371000;

/**
 * Haversine公式を使用して2点間の距離を計算
 * @param lat1 地点1の緯度
 * @param lon1 地点1の経度
 * @param lat2 地点2の緯度
 * @param lon2 地点2の経度
 * @returns 距離（メートル）
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_M * c;
}

/**
 * 距離から移動時間を計算（切り上げ）
 * @param distanceMeters 距離（メートル）
 * @param walkingSpeedMps 歩行速度（分速メートル）
 * @returns 移動時間（分）
 */
export function calculateTravelTime(
  distanceMeters: number,
  walkingSpeedMps: number = 80
): number {
  return Math.ceil(distanceMeters / walkingSpeedMps);
}

/**
 * パークの入り口座標（仮の座標）
 */
export const PARK_ENTRANCE = {
  latitude: 35.632993,
  longitude: 139.879729,
};
