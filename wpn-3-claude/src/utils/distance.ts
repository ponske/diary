/**
 * 地球の半径（メートル）
 */
const EARTH_RADIUS_M = 6371000;

/**
 * 度をラジアンに変換
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Haversine公式を使って2点間の距離を計算（メートル単位）
 * @param lat1 地点1の緯度
 * @param lng1 地点1の経度
 * @param lat2 地点2の緯度
 * @param lng2 地点2の経度
 * @returns 距離（メートル）
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lng2 - lng1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_M * c;
}

/**
 * 距離から移動時間を計算（分単位、切り上げ）
 * @param distanceMeters 距離（メートル）
 * @param speedMetersPerMinute 歩行速度（メートル/分）デフォルトは80m/分
 * @returns 移動時間（分）
 */
export function calculateTravelTime(
  distanceMeters: number,
  speedMetersPerMinute: number = 80
): number {
  return Math.ceil(distanceMeters / speedMetersPerMinute);
}
