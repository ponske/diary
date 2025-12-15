/**
 * アトラクションのジャンル
 */
export enum Genre {
  Theater = 'theater',
  Ride = 'ride',
  Coaster = 'coaster',
  Walking = 'walking',
  Greeting = 'greeting',
  Restaurant = 'restaurant',
  Other = 'other'
}

/**
 * 優先度
 */
export enum Priority {
  High = 'high',
  Medium = 'medium',
  Low = 'low'
}

/**
 * 最適化方法
 */
export enum OptimizationMethod {
  Distance = 'distance',      // 距離最短
  Time = 'time',             // 時間最短
  Selection = 'selection'    // 選択順
}

/**
 * アトラクションデータ
 */
export interface Attraction {
  id: number;
  name: string;
  translatedName?: string;
  officialId?: string;
  entranceLat: number;
  entranceLng: number;
  exitLat?: number;
  exitLng?: number;
  areaName: string;
  genre: Genre;
  icon: string;
  durationMinutes: number;
  isSeated: boolean;
  isActive: boolean;
  isInvalid: boolean;
}

/**
 * 待ち時間の時系列データ
 */
export interface TimeSeriesData {
  timestamp: string;
  waitingMinutes: number;
}

/**
 * 待ち時間データ
 */
export interface WaitingTime {
  attrId: string;
  waitingMinutes: number;
  updatedAt: string;
  timeSeries: TimeSeriesData[];
}

/**
 * ルートアイテムのタイプ
 */
export enum RouteItemType {
  Attraction = 'attraction',
  Break = 'break'
}

/**
 * ルートアイテム
 */
export interface RouteItem {
  type: RouteItemType;
  attraction?: Attraction;
  priority?: Priority;
  breakDuration?: number;
  travelMinutes: number;
  arrivalTimeMinutes: number;
  departureTimeMinutes: number;
  waitingMinutes: number;
  durationMinutes: number;
  order: number;
}

/**
 * ルート結果
 */
export interface RouteResult {
  items: RouteItem[];
  totalDistance: number;
  totalAttractions: number;
  startTimeMinutes: number;
  endTimeMinutes: number;
}

/**
 * 選択済みアトラクション
 */
export interface SelectedAttraction {
  attraction: Attraction;
  priority: Priority;
  selectionOrder: number;
}

/**
 * ユーザー設定
 */
export interface UserSettings {
  language: 'ja' | 'en';
  defaultOptimizationMethod: OptimizationMethod;
  defaultStartTime: number;
  resultTitle: string;
}
