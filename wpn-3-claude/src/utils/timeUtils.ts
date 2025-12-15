/**
 * HH:MM形式の時刻文字列を分単位に変換
 * @param timeString "09:30"形式の文字列
 * @returns 一日の開始からの分数（例: 09:30 -> 570）
 */
export function timeStringToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * 分単位の時刻をHH:MM形式の文字列に変換
 * @param minutes 一日の開始からの分数
 * @returns "09:30"形式の文字列
 */
export function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * ISO形式のタイムスタンプから分単位の時刻を抽出
 * @param timestamp ISO形式のタイムスタンプ
 * @returns 一日の開始からの分数
 */
export function timestampToMinutes(timestamp: string): number {
  const date = new Date(timestamp);
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * 到着予定時刻に最も近い待ち時間を取得
 * @param arrivalMinutes 到着予定時刻（分単位）
 * @param timeSeries 待ち時間の時系列データ
 * @param fallbackWaiting フォールバック用の待ち時間
 * @returns 待ち時間（分）
 */
export function getWaitingTimeForArrival(
  arrivalMinutes: number,
  timeSeries: Array<{ timestamp: string; waitingMinutes: number }>,
  fallbackWaiting: number
): number {
  if (!timeSeries || timeSeries.length === 0) {
    return fallbackWaiting;
  }

  // 時系列データを分単位に変換
  const timeSeriesWithMinutes = timeSeries.map((entry) => ({
    minutes: timestampToMinutes(entry.timestamp),
    waiting: entry.waitingMinutes,
  }));

  // 到着時刻に最も近いデータを探す
  let closestEntry = timeSeriesWithMinutes[0];
  let minDiff = Math.abs(arrivalMinutes - closestEntry.minutes);

  for (const entry of timeSeriesWithMinutes) {
    const diff = Math.abs(arrivalMinutes - entry.minutes);
    if (diff < minDiff) {
      minDiff = diff;
      closestEntry = entry;
    }
  }

  return closestEntry.waiting;
}
