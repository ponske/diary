import Foundation
import SwiftUI
import UIKit

@MainActor
final class RoutePlannerViewModel: ObservableObject {
    // 公開状態
    @Published var attractions: [Attraction] = []
    @Published var searchText: String = ""

    @Published var currentPriority: AttractionPriority = .high
    @Published private(set) var selectedOrder: [Int] = [] // Attraction.id の順序
    @Published private(set) var selectedPriorities: [Int: AttractionPriority] = [:]

    @Published var optimizationMethod: RouteOptimizationMethod = .distance

    // 時間設定
    @Published var startDate: Date
    @Published var endDate: Date
    @Published var useClosingTimeFixed: Bool = true

    // 結果
    @Published var routeSummary: RouteSummary?
    @Published var closingExceededItems: [RouteItem] = []
    @Published var showClosingDialog: Bool = false
    @Published var alertMessage: String?

    private let dataLoader = DataLoader.shared

    init() {
        // 基準日 2000-01-01 で 09:00 / 21:00
        let calendar = Calendar(identifier: .gregorian)
        startDate = calendar.date(from: DateComponents(year: 2000, month: 1, day: 1, hour: 9, minute: 0)) ?? Date()
        endDate = calendar.date(from: DateComponents(year: 2000, month: 1, day: 1, hour: 21, minute: 0)) ?? Date()
    }

    // MARK: - ロード

    func load() {
        dataLoader.loadInitialData()
        attractions = dataLoader.attractions
    }

    // MARK: - 選択

    func toggleSelection(for attraction: Attraction) {
        if selectedOrder.contains(attraction.id) {
            // 解除
            selectedOrder.removeAll { $0 == attraction.id }
            selectedPriorities[attraction.id] = nil
        } else {
            selectedOrder.append(attraction.id)
            selectedPriorities[attraction.id] = currentPriority
        }
    }

    func isSelected(_ attraction: Attraction) -> Bool {
        selectedOrder.contains(attraction.id)
    }

    func priority(for attraction: Attraction) -> AttractionPriority? {
        selectedPriorities[attraction.id]
    }

    var selectedAttractionsList: [SelectedAttraction] {
        selectedOrder.compactMap { id in
            guard let attraction = attractions.first(where: { $0.id == id }) else { return nil }
            let priority = selectedPriorities[id] ?? .medium
            let index = selectedOrder.firstIndex(of: id) ?? 0
            return SelectedAttraction(attraction: attraction, priority: priority, selectionOrder: index)
        }
    }

    /// 検索テキストでフィルタされたアトラクション一覧
    /// - 検索中でも「選択済みのもの」は常に表示するが、並び順は元のまま（カードが飛び跳ねないように）
    var filteredAttractions: [Attraction] {
        let keyword = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
        let selectedIds = Set(selectedOrder)

        // ベース: 検索キーワードにマッチするもの、またはキーワードが空なら全件
        let base: [Attraction]
        if keyword.isEmpty {
            base = attractions
        } else {
            base = attractions.filter { attraction in
                attraction.displayName.localizedCaseInsensitiveContains(keyword)
            }
        }

        // 選択済みのものを必ず含める（重複を避ける）
        var resultDict: [Int: Attraction] = [:]
        for attraction in base {
            resultDict[attraction.id] = attraction
        }
        for attraction in attractions where selectedIds.contains(attraction.id) {
            resultDict[attraction.id] = attraction
        }

        // attractions の元の順序を維持しつつ、上記で選ばれたものだけ残す
        let validIds = Set(resultDict.keys)
        let result = attractions.filter { validIds.contains($0.id) }
        return result
    }

    // MARK: - 時間変換

    private func minutes(from date: Date) -> Int {
        let calendar = Calendar(identifier: .gregorian)
        let comps = calendar.dateComponents([.hour, .minute], from: date)
        return (comps.hour ?? 0) * 60 + (comps.minute ?? 0)
    }

    private func makeTimeSettings() -> TimeSettings? {
        let start = minutes(from: startDate)
        let end: Int?
        if useClosingTimeFixed {
            end = nil // 21:00 固定
        } else {
            end = minutes(from: endDate)
        }

        // バリデーション
        if start < 9 * 60 || start > 21 * 60 {
            alertMessage = "開始時刻は09:00〜21:00の範囲で指定してください。"
            return nil
        }
        if let end = end {
            if end < 10 * 60 || end > 21 * 60 {
                alertMessage = "退園時刻は10:00〜21:00の範囲で指定してください。"
                return nil
            }
            if end <= start {
                alertMessage = "退園時刻は開始時刻より後の時刻を指定してください。"
                return nil
            }
        }

        return TimeSettings(startMinutes: start, endMinutes: end)
    }

    // MARK: - ルート計算

    func buildRoute() {
        alertMessage = nil
        closingExceededItems = []
        showClosingDialog = false

        guard selectedOrder.count >= 2 else {
            alertMessage = "2つ以上のアトラクションを選択してください。"
            return
        }
        guard let timeSettings = makeTimeSettings() else { return }

        let selected = selectedAttractionsList
        let summary = RouteOptimizer.buildRoute(
            from: selected,
            method: optimizationMethod,
            timeSettings: timeSettings,
            dataLoader: dataLoader
        )

        let check = RouteOptimizer.checkClosingTime(summary: summary, timeSettings: timeSettings)
        if check.isExceeded {
            routeSummary = summary
            closingExceededItems = check.exceededItems
            showClosingDialog = true
        } else {
            routeSummary = summary
        }
    }

    func applyClosingTimeOption(_ option: ClosingTimeOption) {
        guard routeSummary != nil,
              let timeSettings = makeTimeSettings() else { return }

        switch option {
        case .showAsIs:
            // 何もしない
            showClosingDialog = false

        case .removeLowPriorityAndRebuild:
            let selected = selectedAttractionsList
            let rebuilt = RouteOptimizer.rebuildRemovingLowPriority(
                from: selected,
                exceededItems: closingExceededItems,
                timeSettings: timeSettings,
                dataLoader: dataLoader
            )
            routeSummary = rebuilt
            showClosingDialog = false

        case .cancel:
            routeSummary = nil
            showClosingDialog = false
        }
    }

    // MARK: - 休憩（末尾に追加）

    func addBreakAtEnd(defaultMinutes: Int = 30) {
        guard let summary = routeSummary else { return }
        guard let last = summary.items.last else { return }
        let arrival = last.departureTimeMinutes
        let departure = arrival + defaultMinutes

        let breakItem = RouteItem(
            type: .break,
            attraction: nil,
            priority: .medium,
            breakDuration: defaultMinutes,
            travelMinutes: 0,
            arrivalTimeMinutes: arrival,
            departureTimeMinutes: departure,
            waitingMinutes: 0,
            durationMinutes: defaultMinutes,
            waitingSourceTime: nil
        )
        let newItems = summary.items + [breakItem]
        routeSummary = RouteSummary(
            totalDistanceMeters: summary.totalDistanceMeters,
            items: newItems
        )
    }

    /// 指定したルートアイテムの直後に休憩を挿入し、全体の時刻を再計算
    func insertBreak(after routeItemId: UUID, defaultMinutes: Int = 30) {
        guard let summary = routeSummary else { return }
        guard let timeSettings = makeTimeSettings() else { return }
        var items = summary.items
        guard let index = items.firstIndex(where: { $0.id == routeItemId }) else { return }

        let breakItem = RouteItem(
            type: .break,
            attraction: nil,
            priority: .medium,
            breakDuration: defaultMinutes,
            travelMinutes: 0,
            arrivalTimeMinutes: 0,
            departureTimeMinutes: 0,
            waitingMinutes: 0,
            durationMinutes: defaultMinutes,
            waitingSourceTime: nil
        )
        items.insert(breakItem, at: index + 1)
        routeSummary = RouteOptimizer.recalculateRouteWithBreaks(
            items: items,
            startMinutes: timeSettings.startMinutes,
            dataLoader: dataLoader
        )
    }

    /// 休憩時間の長さを変更し、全体の時刻を再計算
    func updateBreakDuration(for routeItemId: UUID, minutes: Int) {
        guard let summary = routeSummary else { return }
        guard let timeSettings = makeTimeSettings() else { return }
        var items = summary.items
        guard let index = items.firstIndex(where: { $0.id == routeItemId }) else { return }

        items[index].breakDuration = minutes
        items[index].durationMinutes = minutes

        routeSummary = RouteOptimizer.recalculateRouteWithBreaks(
            items: items,
            startMinutes: timeSettings.startMinutes,
            dataLoader: dataLoader
        )
    }

    /// 並び順をドラッグで変更したときに呼ばれる
    func moveRouteItems(from source: IndexSet, to destination: Int) {
        guard let summary = routeSummary else { return }
        guard let timeSettings = makeTimeSettings() else { return }
        var items = summary.items
        items.move(fromOffsets: source, toOffset: destination)

        routeSummary = RouteOptimizer.recalculateRouteWithBreaks(
            items: items,
            startMinutes: timeSettings.startMinutes,
            dataLoader: dataLoader
        )
    }

    // MARK: - エクスポート

    func copyRouteToClipboard() {
        guard let summary = routeSummary else { return }
        var lines: [String] = []
        for (index, item) in summary.items.enumerated() {
            if item.isBreak {
                lines.append("\(index + 1). 休憩")
                lines.append("   \(item.arrivalTimeMinutes.asTimeString) 開始 / \(item.departureTimeMinutes.asTimeString) 終了（休憩 \(item.durationMinutes)分）")
                lines.append("")
                continue
            }
            guard let attraction = item.attraction else { continue }
            lines.append("\(index + 1). \(attraction.displayName)")
            lines.append("   \(item.arrivalTimeMinutes.asTimeString) 到着 / \(item.departureTimeMinutes.asTimeString) 出発（待ち \(item.waitingMinutes)分 + 体験 \(item.durationMinutes)分）")
            lines.append("   優先度: \(item.priority.displayName)")
            lines.append("")
        }
        UIPasteboard.general.string = lines.joined(separator: "\n")
        alertMessage = "ルートをクリップボードにコピーしました。"
    }
}
