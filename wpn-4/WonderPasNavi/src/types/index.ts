// 型定義ファイル

// アトラクションのジャンル
export enum Genre {
  THEATER = 'theater',
  RIDE = 'ride',
  COASTER = 'coaster',
  WALKING = 'walking',
  GREETING = 'greeting',
  OTHER = 'other'
}

// 優先度
export enum Priority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

// 最適化方法
export enum OptimizationMethod {
  DISTANCE = 'distance',      // 距離最短
  TIME = 'time',              // 時間最短
  USER_ORDER = 'user_order',  // ユーザー入力順
  BRUTE_FORCE = 'brute_force' // 全探索
}

// アトラクション基本情報（JSONから読み込む）
export interface AttractionData {
  id: number;
  name: string;
  official_id: string;
  entrance_lat: number;
  entrance_lng: number;
  exit_lat: number;
  exit_lng: number;
  area_name: string;
  is_active: boolean;
  is_invalid: boolean;
}

// 待ち時間の時系列データ
export interface WaitingTimePoint {
  timestamp: string;
  waiting_minutes: number;
}

// 待ち時間データ（JSONから読み込む）
export interface WaitingTimeData {
  attr_id: number;
  waiting_minutes: number;
  updated_at: string;
  time_series: WaitingTimePoint[];
}

// アプリ内で使用するアトラクション情報
export interface Attraction {
  id: number;
  name: string;
  translatedName?: string;
  officialId: string;
  latitude: number;
  longitude: number;
  exitLatitude: number;
  exitLongitude: number;
  areaName: string;
  genre: Genre;
  icon: string;
  durationMinutes: number;
  isSeated: boolean;
  waitingMinutes: number;
  isActive: boolean;
  isInvalid: boolean;
}

// 選択されたアトラクション（優先度付き）
export interface SelectedAttraction {
  attraction: Attraction;
  priority: Priority;
  selectionOrder: number;
}

// ルートアイテムのタイプ
export enum RouteItemType {
  ATTRACTION = 'attraction',
  BREAK = 'break'
}

// ルートアイテム
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
  orderNumber: number;
}

// ルート計算結果
export interface RouteResult {
  items: RouteItem[];
  totalDistance: number;
  totalTimeMinutes: number;
  startTimeMinutes: number;
  endTimeMinutes: number;
  exceedsClosingTime: boolean;
}

// アプリ設定
export interface AppSettings {
  language: 'ja' | 'en';
  defaultOptimizationMethod: OptimizationMethod;
  walkingSpeedMps: number; // 分速メートル
  defaultStartTime: string; // "09:00"
  resultTitle: string;
}

// 時刻設定
export interface TimeSettings {
  startTimeMinutes: number; // 一日の開始時刻（分単位）
  endTimeMinutes: number;   // 終了時刻（分単位）
  useClosingTime: boolean;  // 閉園時刻を使用するか
}
