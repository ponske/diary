// データ読み込みサービス

import { Attraction, AttractionData, WaitingTimeData, Genre } from '../types';
import attractionsData from '../data/attractions.json';
import waitingTimesData from '../data/waiting_times.json';

// アトラクションの体験時間（分）のマッピング（仕様に基づいて設定）
const DURATION_MAP: { [key: number]: number } = {
  151: 10,  // オムニバス
  152: 15,  // カリブの海賊
  154: 15,  // ウエスタンリバー鉄道
  155: 10,  // スイスファミリー・ツリーハウス
  156: 10,  // 魅惑のチキルーム
  157: 5,   // ウエスタンランド・シューティングギャラリー
  158: 15,  // カントリーベア・シアター
  159: 12,  // 蒸気船マークトウェイン号
  160: 4,   // ビッグサンダーマウンテン
  161: 5,   // トムソーヤ島いかだ
  162: 10,  // スプラッシュマウンテン
  163: 10,  // ビーバーブラザーズのカヌー探険
  164: 3,   // ピーターパン空の旅
  165: 3,   // 白雪姫と七人のこびと
  166: 5,   // シンデレラのフェアリーテイル・ホール
  167: 15,  // ミッキーのフィルハーマジック
  168: 3,   // ピノキオの冒険旅行
  169: 2,   // 空飛ぶダンボ
  170: 2,   // キャッスルカルーセル
  171: 15,  // ホーンテッドマンション
  172: 10,  // イッツ・ア・スモールワールド
  174: 5,   // プーさんのハニーハント
  175: 5,   // ロジャーラビットのカートゥーンスピン
  176: 5,   // ミニーの家
  178: 3,   // チップとデールのツリーハウス
  179: 1,   // ガジェットのゴーコースター
  180: 3,   // ドナルドのボート
  181: 10,  // グーフィーのペイント＆プレイハウス
  189: 5,   // モンスターズ・インク
  191: 5,   // ペニーアーケード
  194: 5,   // トゥーンパーク
  195: 12,  // スティッチ・エンカウンター
  196: 2,   // ベイマックスのハッピーライド
  197: 8,   // 美女と野獣"魔法のものがたり"
  890: 5,   // ミニーのスタイルスタジオ
  908: 5,   // メインストリート・ハウス前
  909: 10,  // ミッキーの家とミート・ミッキー
  916: 5,   // ウッドチャック・グリーティングトレイル（ドナルド）
  917: 5,   // ウッドチャック・グリーティングトレイル（デイジー）
};

// ジャンル判定（名前から推測）
function inferGenre(name: string): Genre {
  if (name.includes('グリーティング') || name.includes('ミート') || name.includes('スタイルスタジオ')) {
    return Genre.GREETING;
  }
  if (name.includes('シアター') || name.includes('ショー') || name.includes('フィルハーマジック')) {
    return Genre.THEATER;
  }
  if (name.includes('マウンテン') || name.includes('コースター')) {
    return Genre.COASTER;
  }
  if (name.includes('ツリーハウス') || name.includes('アーケード') || name.includes('家')) {
    return Genre.WALKING;
  }
  return Genre.RIDE;
}

// アイコン設定（ジャンルに基づく）
function getIcon(genre: Genre): string {
  switch (genre) {
    case Genre.GREETING:
      return '🤝';
    case Genre.THEATER:
      return '🎭';
    case Genre.COASTER:
      return '🎢';
    case Genre.WALKING:
      return '🚶';
    case Genre.RIDE:
      return '🎠';
    default:
      return '⭐';
  }
}

// 座れるかどうかの判定
function isSeated(genre: Genre): boolean {
  return genre === Genre.THEATER || genre === Genre.RIDE || genre === Genre.COASTER;
}

// アトラクションデータを読み込み
export function loadAttractions(): Attraction[] {
  const attractions: Attraction[] = [];
  const waitingMap = new Map<number, number>();

  // 待ち時間データをマップに格納
  (waitingTimesData as WaitingTimeData[]).forEach((wt) => {
    waitingMap.set(wt.attr_id, wt.waiting_minutes);
  });

  // アトラクションデータを変換
  (attractionsData as AttractionData[]).forEach((data) => {
    if (!data.is_active || data.is_invalid) {
      return; // 無効なアトラクションはスキップ
    }

    const officialIdNum = parseInt(data.official_id || '0', 10);
    const genre = inferGenre(data.name);
    const duration = DURATION_MAP[officialIdNum] || 5; // デフォルト5分
    const waiting = waitingMap.get(officialIdNum) || 0;

    attractions.push({
      id: data.id,
      name: data.name,
      officialId: data.official_id,
      latitude: data.entrance_lat,
      longitude: data.entrance_lng,
      exitLatitude: data.exit_lat,
      exitLongitude: data.exit_lng,
      areaName: data.area_name,
      genre,
      icon: getIcon(genre),
      durationMinutes: duration,
      isSeated: isSeated(genre),
      waitingMinutes: waiting,
      isActive: data.is_active,
      isInvalid: data.is_invalid,
    });
  });

  return attractions;
}

// 待ち時間データを取得
export function getWaitingTime(
  officialId: string,
  arrivalTimeMinutes: number
): number {
  const officialIdNum = parseInt(officialId, 10);
  const waitingData = (waitingTimesData as WaitingTimeData[]).find(
    (wt) => wt.attr_id === officialIdNum
  );

  if (!waitingData || !waitingData.time_series || waitingData.time_series.length === 0) {
    return waitingData?.waiting_minutes || 0;
  }

  // 到着時刻を時刻文字列に変換（例: 570分 → "09:30"）
  const hours = Math.floor(arrivalTimeMinutes / 60);
  const minutes = arrivalTimeMinutes % 60;
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  // time_seriesから最も近い時刻を探す
  let closestTime = waitingData.time_series[0];
  let minDiff = Number.MAX_SAFE_INTEGER;

  waitingData.time_series.forEach((point) => {
    const timestamp = new Date(point.timestamp);
    const pointHours = timestamp.getHours();
    const pointMinutes = timestamp.getMinutes();
    const pointTimeMinutes = pointHours * 60 + pointMinutes;

    const diff = Math.abs(pointTimeMinutes - arrivalTimeMinutes);
    if (diff < minDiff) {
      minDiff = diff;
      closestTime = point;
    }
  });

  return closestTime.waiting_minutes;
}

// 全待ち時間データを取得
export function loadWaitingTimes(): WaitingTimeData[] {
  return waitingTimesData as WaitingTimeData[];
}
