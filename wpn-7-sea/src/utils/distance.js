export const PARK_ENTRANCE = {
  // Tokyo DisneySea（概算）
  lat: 35.6268,
  lng: 139.8851,
};

const R = 6371000; // meters

export function calculateDistance(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateTravelMinutes(distanceMeters, walkingSpeedMetersPerMin = 80) {
  if (!distanceMeters || distanceMeters <= 0) return 0;
  const speed = walkingSpeedMetersPerMin > 0 ? walkingSpeedMetersPerMin : 80;
  return Math.ceil(distanceMeters / speed);
}
