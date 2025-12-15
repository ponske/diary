import Foundation

final class DataLoader {
    static let shared = DataLoader()

    private(set) var attractions: [Attraction] = []
    private(set) var waitingTimeRecords: [WaitingTimeRecord] = []

    private init() {}

    func loadInitialData() {
        loadAttractions()
        mergeGreetings()
        loadWaitingTimes()
    }

    private func loadAttractions() {
        guard let url = Bundle.main.url(forResource: "attractions", withExtension: "json") else {
            print("[DataLoader] attractions.json not found in bundle")
            return
        }
        do {
            let data = try Data(contentsOf: url)
            let decoder = JSONDecoder()
            decoder.keyDecodingStrategy = .convertFromSnakeCase
            attractions = try decoder.decode([Attraction].self, from: data)
        } catch {
            print("[DataLoader] Failed to decode attractions.json: \(error)")
        }
    }

    /// greetings.json からグリーティング施設を読み込み、アトラクション一覧にマージ
    private func mergeGreetings() {
        guard let url = Bundle.main.url(forResource: "greetings", withExtension: "json") else {
            print("[DataLoader] greetings.json not found in bundle")
            return
        }
        do {
            let data = try Data(contentsOf: url)
            let decoder = JSONDecoder()
            decoder.keyDecodingStrategy = .convertFromSnakeCase
            let greetings = try decoder.decode([GreetingAttraction].self, from: data)

            var maxId = attractions.map { $0.id }.max() ?? 0
            let existingOfficialIds = Set(attractions.compactMap { $0.officialId })

            for g in greetings {
                // すでに同じ officialId のアトラクションがあればスキップ
                if existingOfficialIds.contains(g.officialId) { continue }

                maxId += 1
                let attraction = Attraction(
                    id: maxId,
                    name: g.name,
                    officialId: g.officialId,
                    entranceLat: g.lat,
                    entranceLng: g.lng,
                    exitLat: g.lat,
                    exitLng: g.lng,
                    areaName: g.areaName,
                    isActive: true,
                    isInvalid: false
                )
                attractions.append(attraction)
            }

            print("[DataLoader] Merged \(greetings.count) greeting attractions")
        } catch {
            print("[DataLoader] Failed to decode greetings.json: \(error)")
        }
    }

    private func loadWaitingTimes() {
        guard let url = Bundle.main.url(forResource: "waiting_times", withExtension: "json") else {
            print("[DataLoader] waiting_times.json not found in bundle")
            return
        }
        do {
            let data = try Data(contentsOf: url)
            let decoder = JSONDecoder()
            decoder.keyDecodingStrategy = .convertFromSnakeCase
            decoder.dateDecodingStrategy = .formatted(DateFormatter.waitingTimeISO8601)
            waitingTimeRecords = try decoder.decode([WaitingTimeRecord].self, from: data)
        } catch {
            print("[DataLoader] Failed to decode waiting_times.json: \(error)")
        }
    }

    /// 到着予定時刻に対して最も近い待ち時間データを返す（分と元データの時刻）
    func waitingTimeDetail(for attraction: Attraction, arrivalMinutes: Int) -> (minutes: Int, sourceTime: Date?) {
        guard
            let officialId = attraction.officialId,
            let officialInt = Int(officialId),
            let record = waitingTimeRecords.first(where: { $0.attrId == officialInt })
        else {
            return (attraction.waitingMinutes, nil)
        }

        // 日内分数で最も近い timeSeries を探す
        if !record.timeSeries.isEmpty {
            let calendar = Calendar(identifier: .gregorian)
            let targetDate = calendar.startOfDay(for: record.updatedAt).addingTimeInterval(TimeInterval(arrivalMinutes * 60))
            let nearest = record.timeSeries.min(by: { a, b in
                abs(a.timestamp.timeIntervalSince(targetDate)) < abs(b.timestamp.timeIntervalSince(targetDate))
            })
            if let nearest = nearest {
                return (nearest.waitingMinutes, nearest.timestamp)
            }
        }

        return (record.waitingMinutes, record.updatedAt)
    }

    /// 既存ロジック互換: 待ち時間（分）のみを返す
    func waitingTime(for attraction: Attraction, arrivalMinutes: Int) -> Int {
        waitingTimeDetail(for: attraction, arrivalMinutes: arrivalMinutes).minutes
    }
}

