import { Attraction, WaitingTime, Genre } from '../types/Models';

/**
 * JSONデータをロードしてAttractionオブジェクトに変換
 */
export async function loadAttractions(): Promise<Attraction[]> {
  try {
    const attractionsData = require('../../assets/data/attractions.json');

    return attractionsData.map((data: any) => ({
      id: data.id,
      name: data.name,
      translatedName: data.translated_name,
      officialId: data.official_id,
      entranceLat: data.entrance_lat,
      entranceLng: data.entrance_lng,
      exitLat: data.exit_lat,
      exitLng: data.exit_lng,
      areaName: data.area_name,
      genre: data.genre as Genre,
      icon: data.icon,
      durationMinutes: data.duration_minutes,
      isSeated: data.is_seated,
      isActive: data.is_active,
      isInvalid: data.is_invalid,
    }));
  } catch (error) {
    console.error('Failed to load attractions:', error);
    return [];
  }
}

/**
 * JSONデータをロードしてWaitingTimeオブジェクトに変換
 */
export async function loadWaitingTimes(): Promise<WaitingTime[]> {
  try {
    const waitingTimesData = require('../../assets/data/waiting_times.json');

    return waitingTimesData.map((data: any) => ({
      attrId: data.attr_id,
      waitingMinutes: data.waiting_minutes,
      updatedAt: data.updated_at,
      timeSeries: data.time_series.map((ts: any) => ({
        timestamp: ts.timestamp,
        waitingMinutes: ts.waiting_minutes,
      })),
    }));
  } catch (error) {
    console.error('Failed to load waiting times:', error);
    return [];
  }
}

/**
 * 待ち時間データをMapに変換
 */
export function createWaitingTimesMap(
  waitingTimes: WaitingTime[]
): Map<string, WaitingTime> {
  const map = new Map<string, WaitingTime>();
  waitingTimes.forEach((wt) => {
    map.set(wt.attrId, wt);
  });
  return map;
}
