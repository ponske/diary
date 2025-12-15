// 時刻を分単位に変換（例: 9:30 -> 570）
export function timeToMinutes(hours, minutes) {
  return hours * 60 + minutes;
}

// 分単位を時刻文字列に変換（例: 570 -> "09:30"）
export function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// 時刻文字列を分単位に変換（例: "09:30" -> 570）
export function timeStringToMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return timeToMinutes(hours, minutes);
}

// 分単位を時刻文字列に変換（例: 570 -> "09:30"）
export function formatTime(minutes) {
  return minutesToTime(minutes);
}

// 日時文字列から分単位（日内）を取得
export function getMinutesFromTimestamp(timestamp) {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      // タイムスタンプが無効な場合、デフォルト値を返す
      return 0;
    }
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return timeToMinutes(hours, minutes);
  } catch (error) {
    console.error('Error parsing timestamp:', timestamp, error);
    return 0;
  }
}

// 待ち時間データから最も近い時刻の待ち時間を取得
export function getWaitingTimeForTime(waitingTimeData, targetMinutes) {
  if (!waitingTimeData || !waitingTimeData.time_series || waitingTimeData.time_series.length === 0) {
    return waitingTimeData?.waiting_minutes || 0;
  }

  let closest = waitingTimeData.time_series[0];
  let minDiff = Math.abs(getMinutesFromTimestamp(closest.timestamp) - targetMinutes);

  for (const item of waitingTimeData.time_series) {
    const itemMinutes = getMinutesFromTimestamp(item.timestamp);
    const diff = Math.abs(itemMinutes - targetMinutes);
    if (diff < minDiff) {
      minDiff = diff;
      closest = item;
    }
  }

  return closest.waiting_minutes || 0;
}
