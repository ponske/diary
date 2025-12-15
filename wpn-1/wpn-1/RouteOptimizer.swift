import Foundation
import CoreLocation

struct SelectedAttraction {
    let attraction: Attraction
    let priority: AttractionPriority
    let selectionOrder: Int
}

enum ClosingTimeHandlingResult {
    case withinLimit(RouteSummary)
    case exceeded(RouteSummary, exceededItems: [RouteItem])
}

enum ClosingTimeOption {
    case showAsIs
    case removeLowPriorityAndRebuild
    case cancel
}

struct RouteOptimizer {
    static let walkingSpeedMetersPerMinute: Double = 80

    // MARK: - Public API

    static func buildRoute(
        from selected: [SelectedAttraction],
        method: RouteOptimizationMethod,
        timeSettings: TimeSettings,
        dataLoader: DataLoader
    ) -> RouteSummary {
        guard !selected.isEmpty else {
            return RouteSummary(totalDistanceMeters: 0, items: [])
        }

        let ordered = orderAttractions(selected: selected, method: method, dataLoader: dataLoader, startMinutes: timeSettings.startMinutes)
        return buildTimedRoute(path: ordered, startMinutes: timeSettings.startMinutes, dataLoader: dataLoader)
    }

    /// 閉園時刻超過チェック
    static func checkClosingTime(
        summary: RouteSummary,
        timeSettings: TimeSettings
    ) -> (isExceeded: Bool, exceededItems: [RouteItem]) {
        let closingMinutes = timeSettings.endMinutes ?? 21 * 60
        let exceeded = summary.items.filter { $0.arrivalTimeMinutes > closingMinutes }
        return (!exceeded.isEmpty, exceeded)
    }

    /// 低優先度のアトラクションを削除し、距離最短で再構築
    static func rebuildRemovingLowPriority(
        from selected: [SelectedAttraction],
        exceededItems: [RouteItem],
        timeSettings: TimeSettings,
        dataLoader: DataLoader
    ) -> RouteSummary {
        let exceededIds = Set(exceededItems.compactMap { $0.attraction?.id })
        let filtered = selected.filter { item in
            if exceededIds.contains(item.attraction.id) && item.priority == .low {
                return false
            }
            return true
        }
        return buildRoute(from: filtered, method: .distance, timeSettings: timeSettings, dataLoader: dataLoader)
    }

    // MARK: - Ordering

    private static func orderAttractions(
        selected: [SelectedAttraction],
        method: RouteOptimizationMethod,
        dataLoader: DataLoader,
        startMinutes: Int
    ) -> [SelectedAttraction] {
        switch method {
        case .selectionOrder:
            return selected.sorted { $0.selectionOrder < $1.selectionOrder }
        case .distance:
            return nearestNeighborOrder(selected: selected)
        case .time:
            return timeGreedyOrder(selected: selected, dataLoader: dataLoader, startMinutes: startMinutes)
        }
    }

    /// 優先度でソートした後、最近傍法で距離最短順に並べる
    private static func nearestNeighborOrder(selected: [SelectedAttraction]) -> [SelectedAttraction] {
        var remaining = selected.sorted { lhs, rhs in
            if lhs.priority == rhs.priority {
                return lhs.selectionOrder < rhs.selectionOrder
            }
            return lhs.prioritySortKey < rhs.prioritySortKey
        }
        guard let first = remaining.first else { return [] }
        var path: [SelectedAttraction] = [first]
        remaining.removeAll { $0.attraction.id == first.attraction.id }

        var current = first
        while !remaining.isEmpty {
            let next = remaining.min { a, b in
                let da = distanceMeters(from: current.attraction, to: a.attraction)
                let db = distanceMeters(from: current.attraction, to: b.attraction)
                return da < db
            }!
            path.append(next)
            remaining.removeAll { $0.attraction.id == next.attraction.id }
            current = next
        }
        return path
    }

    /// 優先度でソートした後、時間コストが最小になる次のアトラクションを貪欲に選択
    private static func timeGreedyOrder(
        selected: [SelectedAttraction],
        dataLoader: DataLoader,
        startMinutes: Int
    ) -> [SelectedAttraction] {
        var base = selected.sorted { lhs, rhs in
            if lhs.priority == rhs.priority {
                return lhs.selectionOrder < rhs.selectionOrder
            }
            return lhs.prioritySortKey < rhs.prioritySortKey
        }
        guard let first = base.first else { return [] }
        var path: [SelectedAttraction] = [first]
        base.removeAll { $0.attraction.id == first.attraction.id }

        var current = first
        var currentTime = startMinutes

        while !base.isEmpty {
            let next = base.min { a, b in
                let costA = timeCost(from: current.attraction, to: a.attraction, currentTime: currentTime, dataLoader: dataLoader)
                let costB = timeCost(from: current.attraction, to: b.attraction, currentTime: currentTime, dataLoader: dataLoader)
                return costA < costB
            }!

            let travel = travelMinutes(from: current.attraction, to: next.attraction)
            let arrival = currentTime + travel
            let waiting = dataLoader.waitingTime(for: next.attraction, arrivalMinutes: arrival)
            let duration = next.attraction.durationMinutes
            currentTime = arrival + waiting + duration

            path.append(next)
            base.removeAll { $0.attraction.id == next.attraction.id }
            current = next
        }
        return path
    }

    // MARK: - Time / Distance helpers

    private static func buildTimedRoute(
        path: [SelectedAttraction],
        startMinutes: Int,
        dataLoader: DataLoader
    ) -> RouteSummary {
        var items: [RouteItem] = []
        var currentTime = startMinutes
        var totalDistance: Double = 0

        for (index, selected) in path.enumerated() {
            let attraction = selected.attraction
            let travel: Int
            if index == 0 {
                travel = 0
            } else {
                travel = travelMinutes(from: path[index - 1].attraction, to: attraction)
                totalDistance += distanceMeters(from: path[index - 1].attraction, to: attraction)
            }
            let arrival = currentTime + travel
            let waitingDetail = dataLoader.waitingTimeDetail(for: attraction, arrivalMinutes: arrival)
            let waiting = waitingDetail.minutes
            let duration = attraction.durationMinutes
            let departure = arrival + waiting + duration

            let item = RouteItem(
                type: .attraction,
                attraction: attraction,
                priority: selected.priority,
                breakDuration: nil,
                travelMinutes: travel,
                arrivalTimeMinutes: arrival,
                departureTimeMinutes: departure,
                waitingMinutes: waiting,
                durationMinutes: duration,
                waitingSourceTime: waitingDetail.sourceTime
            )
            items.append(item)
            currentTime = departure
        }

        return RouteSummary(totalDistanceMeters: Int(totalDistance.rounded()), items: items)
    }

    /// 既存のルート（アトラクション＋休憩）の並びを維持したまま、開始時刻から各アイテムの時刻・距離を再計算する
    static func recalculateRouteWithBreaks(
        items: [RouteItem],
        startMinutes: Int,
        dataLoader: DataLoader
    ) -> RouteSummary {
        var newItems: [RouteItem] = []
        var currentTime = startMinutes
        var totalDistance: Double = 0
        var lastAttraction: Attraction?

        for var item in items {
            if item.isBreak {
                // 休憩: 距離・待ち時間なし。直前の出発時刻から開始。
                item.travelMinutes = 0
                item.arrivalTimeMinutes = currentTime
                item.waitingMinutes = 0
                item.waitingSourceTime = nil
                item.departureTimeMinutes = item.arrivalTimeMinutes + item.durationMinutes
                currentTime = item.departureTimeMinutes
            } else if let attraction = item.attraction {
                // アトラクション
                let travel: Int
                if let last = lastAttraction {
                    travel = travelMinutes(from: last, to: attraction)
                    totalDistance += distanceMeters(from: last, to: attraction)
                } else {
                    travel = 0
                }
                let arrival = currentTime + travel
                let waitingDetail = dataLoader.waitingTimeDetail(for: attraction, arrivalMinutes: arrival)
                let waiting = waitingDetail.minutes
                let duration = attraction.durationMinutes
                let departure = arrival + waiting + duration

                item.travelMinutes = travel
                item.arrivalTimeMinutes = arrival
                item.waitingMinutes = waiting
                item.waitingSourceTime = waitingDetail.sourceTime
                item.durationMinutes = duration
                item.departureTimeMinutes = departure

                currentTime = departure
                lastAttraction = attraction
            }
            newItems.append(item)
        }

        return RouteSummary(totalDistanceMeters: Int(totalDistance.rounded()), items: newItems)
    }

    private static func timeCost(
        from: Attraction,
        to: Attraction,
        currentTime: Int,
        dataLoader: DataLoader
    ) -> Int {
        let travel = travelMinutes(from: from, to: to)
        let arrival = currentTime + travel
        let waiting = dataLoader.waitingTime(for: to, arrivalMinutes: arrival)
        let duration = to.durationMinutes
        return travel + waiting + duration
    }

    private static func travelMinutes(from: Attraction, to: Attraction) -> Int {
        let dist = distanceMeters(from: from, to: to)
        return Int(ceil(dist / walkingSpeedMetersPerMinute))
    }

    private static func distanceMeters(from: Attraction, to: Attraction) -> Double {
        haversineDistance(lat1: from.latitude, lon1: from.longitude, lat2: to.latitude, lon2: to.longitude)
    }

    /// Haversine 公式
    private static func haversineDistance(lat1: Double, lon1: Double, lat2: Double, lon2: Double) -> Double {
        let R = 6_371_000.0
        let φ1 = lat1 * .pi / 180
        let φ2 = lat2 * .pi / 180
        let Δφ = (lat2 - lat1) * .pi / 180
        let Δλ = (lon2 - lon1) * .pi / 180

        let a = sin(Δφ / 2) * sin(Δφ / 2) + cos(φ1) * cos(φ2) * sin(Δλ / 2) * sin(Δλ / 2)
        let c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return R * c
    }
}

private extension SelectedAttraction {
    var prioritySortKey: Int {
        switch priority {
        case .high: return 0
        case .medium: return 1
        case .low: return 2
        }
    }
}
