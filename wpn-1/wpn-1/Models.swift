import Foundation
import CoreLocation

enum AttractionPriority: String, Codable, CaseIterable, Identifiable {
    case high
    case medium
    case low

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .high: return "高"
        case .medium: return "中"
        case .low: return "低"
        }
    }
}

enum RouteOptimizationMethod: String, CaseIterable, Identifiable {
    case distance
    case time
    case selectionOrder

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .distance: return "距離最短"
        case .time: return "時間最短"
        case .selectionOrder: return "選択順"
        }
    }
}

enum RouteItemType: String, Codable {
    case attraction
    case `break`
}

/// attractions.json の形式（entrance_lat / entrance_lng など）に合わせたモデル
struct Attraction: Identifiable, Codable, Hashable {
    let id: Int
    let name: String
    let officialId: String?

    // JSON: entrance_lat / entrance_lng / exit_lat / exit_lng
    let entranceLat: Double
    let entranceLng: Double
    let exitLat: Double?
    let exitLng: Double?

    let areaName: String
    let isActive: Bool?
    let isInvalid: Bool?

    // 仕様上は持っておきたい情報だが、JSONに無いのでデフォルト値で補う
    var genre: String { "other" }
    var icon: String { "🎢" }
    var durationMinutes: Int { 20 }
    var isSeated: Bool { true }
    var waitingMinutes: Int { 30 }

    /// 表示用名称（"(ID: xxx)" を取り除く）
    var displayName: String {
        if let range = name.range(of: " (ID:") {
            return String(name[..<range.lowerBound])
        }
        return name
    }

    // 既存ロジック互換：入口座標を緯度経度として扱う
    var latitude: Double { entranceLat }
    var longitude: Double { entranceLng }

    var location: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }
}

struct WaitingTimePoint: Codable, Hashable {
    let timestamp: Date
    let waitingMinutes: Int
}

struct WaitingTimeRecord: Codable, Hashable {
    let attrId: Int
    let waitingMinutes: Int
    let updatedAt: Date
    let timeSeries: [WaitingTimePoint]
}

/// グリーティング施設の定義ファイル（greetings.json）用
struct GreetingAttraction: Codable {
    let officialId: String
    let name: String
    let lat: Double
    let lng: Double
    let areaName: String
}

struct RouteItem: Identifiable, Hashable {
    enum ItemType {
        case attraction
        case `break`
    }

    let id = UUID()
    let type: ItemType
    let attraction: Attraction?
    var priority: AttractionPriority
    var breakDuration: Int?
    var travelMinutes: Int
    var arrivalTimeMinutes: Int
    var departureTimeMinutes: Int
    var waitingMinutes: Int
    var durationMinutes: Int
    /// この待ち時間がどのtimestampのデータか（time_series.timestamp など）
    var waitingSourceTime: Date?

    var isBreak: Bool { type == .break }
}

struct RouteSummary {
    let totalDistanceMeters: Int
    let items: [RouteItem]
}

struct TimeSettings {
    var startMinutes: Int // 分単位 9:00 -> 540
    var endMinutes: Int?  // nil の場合は閉園 (21:00)
}

extension Int {
    /// 分 -> "HH:mm" 形式
    var asTimeString: String {
        let hours = self / 60
        let minutes = self % 60
        return String(format: "%02d:%02d", hours, minutes)
    }
}

extension DateFormatter {
    static let waitingTimeISO8601: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(secondsFromGMT: 9 * 60 * 60)
        // 例: 2025-12-05T14:47:28.591512
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSSSS"
        return formatter
    }()

    /// 画面表示用（例: 12/5 14:47 時点）
    static let waitingSourceDisplay: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "ja_JP")
        formatter.timeZone = TimeZone(secondsFromGMT: 9 * 60 * 60)
        formatter.dateFormat = "M/d HH:mm"
        return formatter
    }()
}

extension Date {
    /// 待ち時間の元データがいつのものかを表示する文字列
    var formattedWaitingSource: String {
        let base = DateFormatter.waitingSourceDisplay.string(from: self)
        return "\(base) 時点"
    }
}
