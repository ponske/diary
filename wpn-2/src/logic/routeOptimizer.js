import waitingTimesData from '../../wpn-1/waiting_times.json';

const WALKING_SPEED_M_PER_MIN = 80;
const EARTH_RADIUS_M = 6371000;

function deg2rad(deg) {
  return (deg * Math.PI) / 180;
}

export function haversineDistanceMeters(a, b) {
  const lat1 = deg2rad(a.latitude);
  const lon1 = deg2rad(a.longitude);
  const lat2 = deg2rad(b.latitude);
  const lon2 = deg2rad(b.longitude);

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);

  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_M * c;
}

export function distanceToMinutes(distanceMeters) {
  return Math.ceil(distanceMeters / WALKING_SPEED_M_PER_MIN);
}

function minutesOfDayFromDate(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function parseIsoToMinutesOfDay(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return minutesOfDayFromDate(d);
}

export function getWaitingMinutes(officialId, arrivalMinutes) {
  const record = waitingTimesData.find((w) => w.attr_id === officialId);
  if (!record) return 0;
  const series = record.time_series || [];
  if (!series.length) return record.waiting_minutes || 0;
  let closest = series[0];
  let closestDiff =
    Math.abs(
      arrivalMinutes -
        (parseIsoToMinutesOfDay(series[0].timestamp) ?? arrivalMinutes),
    );
  for (let i = 1; i < series.length; i += 1) {
    const m = parseIsoToMinutesOfDay(series[i].timestamp);
    if (m == null) continue;
    const diff = Math.abs(arrivalMinutes - m);
    if (diff < closestDiff) {
      closest = series[i];
      closestDiff = diff;
    }
  }
  return closest.waiting_minutes ?? record.waiting_minutes ?? 0;
}

function sortByPriority(selected) {
  const order = { high: 0, medium: 1, low: 2 };
  return [...selected].sort((a, b) => {
    const pa = order[a.priority] ?? 99;
    const pb = order[b.priority] ?? 99;
    if (pa !== pb) return pa - pb;
    return a.order - b.order;
  });
}

export function buildDistanceOptimizedOrder(selected) {
  const base = sortByPriority(selected);
  if (base.length <= 2) return base;

  const result = [];
  const remaining = [...base];
  let current = remaining.shift();
  result.push(current);

  while (remaining.length) {
    let bestIndex = 0;
    let bestDistance = Infinity;
    for (let i = 0; i < remaining.length; i += 1) {
      const d = haversineDistanceMeters(
        {
          latitude: current.attraction.latitude,
          longitude: current.attraction.longitude,
        },
        {
          latitude: remaining[i].attraction.latitude,
          longitude: remaining[i].attraction.longitude,
        },
      );
      if (d < bestDistance) {
        bestDistance = d;
        bestIndex = i;
      }
    }
    current = remaining.splice(bestIndex, 1)[0];
    result.push(current);
  }
  return result;
}

export function buildTimeOptimizedOrder(selected, startMinutes) {
  const base = sortByPriority(selected);
  if (base.length <= 2) return base;

  const remaining = [...base];
  const result = [];
  let current = remaining.shift();
  result.push(current);
  let currentTime = startMinutes;

  while (remaining.length) {
    let bestIndex = 0;
    let bestTotal = Infinity;
    for (let i = 0; i < remaining.length; i += 1) {
      const cAttr = current.attraction;
      const nAttr = remaining[i].attraction;
      const d = haversineDistanceMeters(
        { latitude: cAttr.latitude, longitude: cAttr.longitude },
        { latitude: nAttr.latitude, longitude: nAttr.longitude },
      );
      const travelMinutes = distanceToMinutes(d);
      const arrival = currentTime + travelMinutes;
      const waiting = getWaitingMinutes(
        nAttr.official_id,
        arrival,
      );
      const duration = nAttr.duration_minutes || 0;
      const total = travelMinutes + waiting + duration;
      if (total < bestTotal) {
        bestTotal = total;
        bestIndex = i;
      }
    }
    const next = remaining.splice(bestIndex, 1)[0];
    const cAttr = current.attraction;
    const nAttr = next.attraction;
    const d = haversineDistanceMeters(
      { latitude: cAttr.latitude, longitude: cAttr.longitude },
      { latitude: nAttr.latitude, longitude: nAttr.longitude },
    );
    const travelMinutes = distanceToMinutes(d);
    const arrival = currentTime + travelMinutes;
    const waiting = getWaitingMinutes(
      nAttr.official_id,
      arrival,
    );
    const duration = nAttr.duration_minutes || 0;
    currentTime = arrival + waiting + duration;
    current = next;
    result.push(current);
  }

  return result;
}

export function buildSelectedOrder(selected) {
  return [...selected].sort((a, b) => a.order - b.order);
}

export function buildRouteItems({ ordered, startMinutes }) {
  const items = [];
  let currentTime = startMinutes;
  let prevAttr = null;
  let totalDistance = 0;

  ordered.forEach((s, index) => {
    const attr = s.attraction;
    let travelMinutes = 0;
    let distanceMeters = 0;
    if (prevAttr) {
      distanceMeters = haversineDistanceMeters(
        {
          latitude: prevAttr.latitude,
          longitude: prevAttr.longitude,
        },
        {
          latitude: attr.latitude,
          longitude: attr.longitude,
        },
      );
      totalDistance += distanceMeters;
      travelMinutes = distanceToMinutes(distanceMeters);
    }
    const arrival = currentTime + travelMinutes;
    const waiting = getWaitingMinutes(
      attr.official_id,
      arrival,
    );
    const duration = attr.duration_minutes || 0;
    const departure = arrival + waiting + duration;

    items.push({
      index: index + 1,
      type: 'attraction',
      attraction: attr,
      priority: s.priority,
      travelMinutes,
      arrivalTimeMinutes: arrival,
      departureTimeMinutes: departure,
      waitingMinutes: waiting,
      durationMinutes: duration,
      segmentDistanceMeters: distanceMeters,
    });

    currentTime = departure;
    prevAttr = attr;
  });

  return {
    items,
    totalDistanceMeters: totalDistance,
  };
}

export function minutesToTimeString(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hh = h.toString().padStart(2, '0');
  const mm = m.toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

