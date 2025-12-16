export function timeStringToMinutes(timeString) {
  if (!timeString || typeof timeString !== 'string') return 0;
  const parts = timeString.split(':');
  if (parts.length < 2) return 0;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

export function minutesToTime(totalMinutes) {
  const m = Math.max(0, Math.floor(totalMinutes));
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function parseTimeStringToMinutesOfDay(ts) {
  // "2025-12-04T10:09:27.767556" / "2025-12-03T10:00:00+09:00" など
  if (!ts || typeof ts !== 'string') return null;
  const t = ts.includes('T') ? ts.split('T')[1] : ts;
  const hhmmss = t.split(/[Z+.-]/)[0]; // 10:09:27
  const parts = hhmmss.split(':');
  if (parts.length < 2) return null;
  const hh = parseInt(parts[0], 10);
  const mm = parseInt(parts[1], 10);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
}

export function getWaitingInfoForArrival(waitingData, arrivalMinutes) {
  if (!waitingData) {
    return { waitingMinutes: 20, timestamp: null };
  }

  const series = Array.isArray(waitingData.time_series) ? waitingData.time_series : [];
  if (series.length === 0) {
    return {
      waitingMinutes: typeof waitingData.waiting_minutes === 'number' ? waitingData.waiting_minutes : 20,
      timestamp: waitingData.updated_at || null,
    };
  }

  let best = null;
  let bestDiff = Infinity;

  for (const p of series) {
    const tMin = parseTimeStringToMinutesOfDay(p.timestamp);
    if (tMin == null) continue;
    const diff = Math.abs(tMin - arrivalMinutes);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = p;
    }
  }

  if (!best) {
    return {
      waitingMinutes: typeof waitingData.waiting_minutes === 'number' ? waitingData.waiting_minutes : 20,
      timestamp: waitingData.updated_at || null,
    };
  }

  return {
    waitingMinutes: typeof best.waiting_minutes === 'number' ? best.waiting_minutes : 20,
    timestamp: best.timestamp || waitingData.updated_at || null,
  };
}
