//
//  ContentView.swift
//  wpn-1
//
//  WonderPasNavi – ルートを決める メイン画面
//

import SwiftUI
import MapKit

struct ContentView: View {
    @StateObject private var viewModel = RoutePlannerViewModel()

    private var startTimeRange: ClosedRange<Date> {
        let calendar = Calendar(identifier: .gregorian)
        let base = calendar.date(from: DateComponents(year: 2000, month: 1, day: 1))!
        let from = calendar.date(bySettingHour: 9, minute: 0, second: 0, of: base)!
        let to = calendar.date(bySettingHour: 21, minute: 0, second: 0, of: base)!
        return from...to
    }

    private var endTimeRange: ClosedRange<Date> {
        let calendar = Calendar(identifier: .gregorian)
        let base = calendar.date(from: DateComponents(year: 2000, month: 1, day: 1))!
        let from = calendar.date(bySettingHour: 10, minute: 0, second: 0, of: base)!
        let to = calendar.date(bySettingHour: 21, minute: 0, second: 0, of: base)!
        return from...to
    }

    var body: some View {
        NavigationStack {
            ZStack {
                pastelBackground
                    .ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        headerSection
                        prioritySelectorSection
                        attractionsSection
                        timeSettingsSection
                        optimizationSection
                        actionButtonsSection
                        resultSection
                    }
                    .padding()
                }
            }
            .navigationTitle("WonderPasNavi")
            .searchable(
                text: $viewModel.searchText,
                placement: .navigationBarDrawer(displayMode: .automatic),
                prompt: "アトラクション名を検索"
            )
            .toolbar {
                if let summary = viewModel.routeSummary, !summary.items.isEmpty {
                    NavigationLink(destination: RouteMapView(items: summary.items)) {
                        Image(systemName: "map")
                    }
                    .accessibilityLabel("地図を表示")
                }
            }
            .onAppear {
                viewModel.load()
            }
            .alert(isPresented: Binding(
                get: { viewModel.alertMessage != nil },
                set: { newValue in
                    if !newValue { viewModel.alertMessage = nil }
                }
            )) {
                Alert(
                    title: Text("お知らせ"),
                    message: Text(viewModel.alertMessage ?? ""),
                    dismissButton: .default(Text("OK"))
                )
            }
            .confirmationDialog(
                "退園時刻を超えるアトラクションがあります。どうしますか？",
                isPresented: $viewModel.showClosingDialog,
                titleVisibility: .visible
            ) {
                Button("そのまま表示") {
                    viewModel.applyClosingTimeOption(.showAsIs)
                }
                Button("低優先度のものを削除して作り直す") {
                    viewModel.applyClosingTimeOption(.removeLowPriorityAndRebuild)
                }
                Button("キャンセル", role: .cancel) {
                    viewModel.applyClosingTimeOption(.cancel)
                }
            } message: {
                Text("閉園時刻を超えてしまうアトラクションが含まれています。")
            }
        }
        .preferredColorScheme(.light)
        .environment(\.font, .system(.body, design: .rounded))
        .tint(accentPink)
        .toolbarBackground(.visible, for: .navigationBar)
        .toolbarBackground(navBarBackground, for: .navigationBar)
        .toolbarColorScheme(.light, for: .navigationBar)
    }

    // MARK: - Sections

    private var pastelBackground: some View {
        LinearGradient(
            gradient: Gradient(colors: [
                Color(red: 1.0, green: 0.93, blue: 0.96),
                Color(red: 0.98, green: 0.89, blue: 0.97),
                Color(red: 0.93, green: 0.95, blue: 1.0)
            ]),
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    private var accentPink: Color {
        Color(red: 1.0, green: 0.60, blue: 0.80)
    }

    private var navBarBackground: Color {
        Color(red: 1.0, green: 0.88, blue: 0.94)
    }

    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("行きたいアトラクションを選んで、最適な回る順番を作ります。")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
    }

    private var prioritySelectorSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("優先度を選ぶ")
                .font(.headline)
            HStack {
                ForEach(AttractionPriority.allCases) { priority in
                    Button(action: {
                        viewModel.currentPriority = priority
                    }) {
                        Text(priority.displayName)
                            .font(.subheadline.bold())
                            .padding(.vertical, 8)
                            .frame(maxWidth: .infinity)
                            .background(
                                viewModel.currentPriority == priority
                                ? Color.accentColor.opacity(0.2)
                                : Color.secondary.opacity(0.1)
                            )
                            .foregroundColor(.primary)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                }
            }
        }
    }

    private var attractionsSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("アトラクション一覧")
                    .font(.headline)
                Spacer()
                Text("選択中: \(viewModel.selectedAttractionsList.count)件")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            if viewModel.attractions.isEmpty {
                Text("アトラクションデータを読み込み中、もしくは見つかりませんでした。")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            } else {
                // 一覧は6件分程度の高さに抑え、内部だけスクロール可能にする
                ScrollView {
                    LazyVStack(spacing: 8) {
                        ForEach(viewModel.filteredAttractions) { attraction in
                            AttractionRow(
                                attraction: attraction,
                                isSelected: viewModel.isSelected(attraction),
                                priority: viewModel.priority(for: attraction),
                                onToggle: { viewModel.toggleSelection(for: attraction) }
                            )
                        }
                    }
                    .padding(.vertical, 8)
                    .padding(.horizontal, 12)
                }
                .frame(maxHeight: 6 * 72) // おおよそ6件ぶん
                .background(Color(red: 1.0, green: 0.98, blue: 0.9)) // 全体背景と少しトーンを変える
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                .shadow(color: Color.black.opacity(0.04), radius: 8, x: 0, y: 4)
                .padding(.horizontal, 12) // 画面との左右に少し広めの余白
            }
        }
    }

    private var timeSettingsSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("時間設定")
                .font(.headline)

            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("開始時刻")
                        .font(.subheadline)
                    Spacer()
                    DatePicker(
                        "",
                        selection: $viewModel.startDate,
                        in: startTimeRange,
                        displayedComponents: .hourAndMinute
                    )
                    .labelsHidden()
                }

                Picker("退園オプション", selection: $viewModel.useClosingTimeFixed) {
                    Text("閉園まで (21:00)").tag(true)
                    Text("時刻指定").tag(false)
                }
                .pickerStyle(.segmented)

                if !viewModel.useClosingTimeFixed {
                    HStack {
                        Text("退園時刻")
                            .font(.subheadline)
                        Spacer()
                        DatePicker(
                            "",
                            selection: $viewModel.endDate,
                            in: endTimeRange,
                            displayedComponents: .hourAndMinute
                        )
                        .labelsHidden()
                    }
                }
            }
            .padding(12)
            .background(Color.white.opacity(0.9))
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .shadow(color: Color.black.opacity(0.04), radius: 8, x: 0, y: 4)
        }
    }

    private var optimizationSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("ルート最適化方法")
                .font(.headline)

            Picker("ルート最適化方法", selection: $viewModel.optimizationMethod) {
                ForEach(RouteOptimizationMethod.allCases) { method in
                    Text(method.displayName).tag(method)
                }
            }
            .pickerStyle(.segmented)
        }
    }

    private var actionButtonsSection: some View {
        VStack(spacing: 8) {
            Button {
                viewModel.buildRoute()
            } label: {
                Text("ルートを決める")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
            }
            .buttonStyle(.borderedProminent)
            .disabled(viewModel.selectedAttractionsList.count < 2)

            if viewModel.routeSummary != nil {
                HStack {
                    Button {
                        viewModel.addBreakAtEnd()
                    } label: {
                        Label("最後に休憩を追加", systemImage: "cup.and.saucer")
                    }
                    Spacer()
                    Button {
                        viewModel.copyRouteToClipboard()
                    } label: {
                        Label("テキストとしてコピー", systemImage: "doc.on.doc")
                    }
                }
                .font(.caption)
            }
        }
    }

    private var resultSection: some View {
        Group {
            if let summary = viewModel.routeSummary {
                VStack(alignment: .leading, spacing: 8) {
                    Text("結果")
                        .font(.headline)
                    HStack {
                        Text("総移動距離: \(summary.totalDistanceMeters) m")
                        Spacer()
                        Text("スポット数: \(summary.items.count)件")
                    }
                    .font(.caption)
                    .foregroundStyle(.secondary)

                    Divider()

                    // 並び替え可能なリスト（内側スクロールあり）
                    List {
                        ForEach(Array(summary.items.indices), id: \.self) { idx in
                            RouteItemRow(
                                index: idx + 1,
                                item: summary.items[idx],
                                onChangeBreakDuration: { item, minutes in
                                    viewModel.updateBreakDuration(for: item.id, minutes: minutes)
                                },
                                onInsertBreakAfter: { item in
                                    viewModel.insertBreak(after: item.id)
                                }
                            )
                        }
                        .onMove { indices, newOffset in
                            viewModel.moveRouteItems(from: indices, to: newOffset)
                        }
                    }
                    .listStyle(.plain)
                    // デフォルトの表示範囲を広めに確保（おおよそ5〜6件分）
                    .frame(minHeight: 3200, maxHeight: 4000)
                    .environment(\.editMode, .constant(.active))
                }
                .padding(.top, 8)
            }
        }
    }
}

// MARK: - Rows

private struct AttractionRow: View {
    let attraction: Attraction
    let isSelected: Bool
    let priority: AttractionPriority?
    let onToggle: () -> Void

    var body: some View {
        Button(action: onToggle) {
            HStack(spacing: 0) {
                // エリアごとの色バー
                Rectangle()
                    .fill(areaBackgroundColor(for: attraction))
                    .frame(width: 4)
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

                HStack(alignment: .top, spacing: 12) {
                    Text(attraction.icon.isEmpty ? "🎢" : attraction.icon)
                        .font(.largeTitle)
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text(attraction.displayName)
                                .font(.subheadline.bold())
                                .foregroundStyle(.primary)
                            Spacer()
                            if isSelected, let priority = priority {
                                Text(priority.displayName)
                                    .font(.caption2.bold())
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 2)
                                    .background(priorityBadgeColor(priority).opacity(0.2))
                                    .foregroundColor(priorityBadgeColor(priority))
                                    .clipShape(Capsule())
                            }
                        }
                        Text(attraction.areaName.isEmpty ? "エリア未設定" : attraction.areaName)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Text("所要時間: \(attraction.durationMinutes)分 / 代表待ち時間: \(attraction.waitingMinutes)分")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    if isSelected {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(Color.accentColor)
                    }
                }
                .padding(10)
                .background(isSelected ? Color.pink.opacity(0.25) : Color.white.opacity(0.9))
                .clipShape(RoundedRectangle(cornerRadius: 10))
            }
        }
        .buttonStyle(.plain)
    }

    private func priorityBadgeColor(_ priority: AttractionPriority) -> Color {
        switch priority {
        case .high: return .red
        case .medium: return .orange
        case .low: return .blue
        }
    }

    private func areaBackgroundColor(for attraction: Attraction) -> Color {
        switch attraction.areaName {
        case "ワールドバザール":
            return .brown
        case "アドベンチャーランド":
            return .green
        case "ウエスタンランド":
            return .orange
        case "クリッターカントリー":
            return .mint
        case "ファンタジーランド":
            return .purple
        case "トゥーンタウン":
            return .pink
        case "トゥモローランド":
            return .blue
        default:
            return Color.gray.opacity(0.5)
        }
    }
}

private struct RouteItemRow: View {
    let index: Int
    let item: RouteItem

    let onChangeBreakDuration: (RouteItem, Int) -> Void
    let onInsertBreakAfter: (RouteItem) -> Void

    @State private var localBreakMinutes: Double = 0

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            if item.isBreak {
                Text("\(index). 休憩")
                    .font(.subheadline.bold())
                Text("\(item.arrivalTimeMinutes.asTimeString) 開始 / \(item.departureTimeMinutes.asTimeString) 終了")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                HStack {
                    Text("休憩 \(Int(localBreakMinutes))分")
                        .font(.caption2)
                    Slider(
                        value: $localBreakMinutes,
                        in: 5...120,
                        step: 5,
                        onEditingChanged: { editing in
                            if !editing {
                                onChangeBreakDuration(item, Int(localBreakMinutes))
                            }
                        }
                    )
                }
                .font(.caption2)
            } else {
                if let attraction = item.attraction {
                    HStack {
                        Text("\(index). \(attraction.displayName)")
                            .font(.subheadline.bold())
                        Spacer()
                        Text(item.priority.displayName)
                            .font(.caption2.bold())
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(priorityBadgeColor(item.priority).opacity(0.2))
                            .foregroundColor(priorityBadgeColor(item.priority))
                            .clipShape(Capsule())
                    }
                    Text("到着 \(item.arrivalTimeMinutes.asTimeString) / 出発 \(item.departureTimeMinutes.asTimeString)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text("待ち \(item.waitingMinutes)分")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    if let source = item.waitingSourceTime {
                        Text("待ち時間データ: \(source.formattedWaitingSource)")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    Button {
                        onInsertBreakAfter(item)
                    } label: {
                        Label("このあとに休憩を追加", systemImage: "cup.and.saucer")
                    }
                    .font(.caption2)
                }
            }
        }
        .onAppear {
            if item.isBreak {
                localBreakMinutes = Double(item.durationMinutes)
            }
        }
        .onChange(of: item.durationMinutes, initial: false) { _, newValue in
            if item.isBreak {
                localBreakMinutes = Double(newValue)
            }
        }
    }

    private func priorityBadgeColor(_ priority: AttractionPriority) -> Color {
        switch priority {
        case .high: return .red
        case .medium: return .orange
        case .low: return .blue
        }
    }
}

// MARK: - Map

struct RouteMapView: View {
    let items: [RouteItem]

    @State private var cameraPosition: MapCameraPosition
    @State private var selectedPointId: UUID?

    init(items: [RouteItem]) {
        self.items = items
        let center = items.compactMap { $0.attraction?.location }.first
            ?? CLLocationCoordinate2D(latitude: 35.6329, longitude: 139.8804)
        let span = MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
        let region = MKCoordinateRegion(center: center, span: span)
        _cameraPosition = State(initialValue: .region(region))
    }

    var body: some View {
        // ルートに対応するポイント（順番・時刻つき）
        let routePoints: [MapRoutePoint] = items.enumerated().compactMap { index, item in
            guard let attraction = item.attraction else { return nil }
            return MapRoutePoint(
                id: UUID(),
                order: index + 1,
                attraction: attraction,
                priority: item.priority,
                arrivalMinutes: item.arrivalTimeMinutes,
                departureMinutes: item.departureTimeMinutes
            )
        }

        let routeCoordinates = routePoints.map { $0.attraction.location }

        Map(position: $cameraPosition) {
            // ルート順に線を結ぶ
            if routeCoordinates.count > 1 {
                MapPolyline(coordinates: routeCoordinates)
                    .stroke(.pink, lineWidth: 4)
            }

            // ピン（タップしたときだけラベル表示）
            ForEach(routePoints) { point in
                Annotation("", coordinate: point.attraction.location) {
                    VStack(spacing: 2) {
                        // 順番番号（常に表示）
                        Text("\(point.order)")
                            .font(.caption2.bold())
                            .padding(4)
                            .background(Color.white.opacity(0.9))
                            .foregroundColor(.pink)
                            .clipShape(Circle())

                        Button {
                            if selectedPointId == point.id {
                                selectedPointId = nil
                            } else {
                                selectedPointId = point.id
                            }
                        } label: {
                            Text("🌟")
                                .font(.title2)
                        }
                        if selectedPointId == point.id {
                            VStack(spacing: 2) {
                                Text("\(point.order). \(point.attraction.displayName)")
                                Text("到着 \(point.arrivalMinutes.asTimeString) / 出発 \(point.departureMinutes.asTimeString)")
                            }
                            .font(.caption2)
                            .padding(4)
                            .background(priorityColor(point.priority).opacity(0.9))
                            .foregroundColor(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 4))
                        }
                    }
                }
            }
        }
        .navigationTitle("地図")
    }

    private func priorityColor(_ priority: AttractionPriority) -> Color {
        switch priority {
        case .high: return .red
        case .medium: return .orange
        case .low: return .blue
        }
    }
}

private struct MapRoutePoint: Identifiable {
    let id: UUID
    let order: Int
    let attraction: Attraction
    let priority: AttractionPriority
    let arrivalMinutes: Int
    let departureMinutes: Int
}

#Preview {
    ContentView()
}
