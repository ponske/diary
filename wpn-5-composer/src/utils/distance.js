// Haversine公式を使用して2点間の距離（メートル）を計算
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // 地球の半径（メートル）
  
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// パークの入り口座標（東京ディズニーランド）
export const PARK_ENTRANCE = {
  lat: 35.632993,
  lng: 139.879729
};

// 歩行速度（分速80m）から移動時間（分）を計算
export function calculateTravelTime(distanceMeters, walkingSpeed = 80) {
  return Math.ceil(distanceMeters / walkingSpeed);
}
