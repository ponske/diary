export class Attraction {
  constructor(raw) {
    this.id = raw.id;
    // 表示名から末尾の(ID: xxx)表記を除去（例: "オムニバス (ID: 151)"）
    const rawName = raw.name || '';
    this.name = rawName.replace(/\s*\(ID:\s*\d+\)\s*$/i, '');
    this.officialId = raw.official_id ? String(raw.official_id) : '';

    this.entranceLat = raw.entrance_lat;
    this.entranceLng = raw.entrance_lng;
    this.exitLat = raw.exit_lat;
    this.exitLng = raw.exit_lng;

    this.areaName = raw.area_name || '';

    // データに無いので、暫定で固定値（将来JSONに追加する前提）
    this.durationMinutes = typeof raw.duration_minutes === 'number' ? raw.duration_minutes : 15;
  }

  getLatitude() {
    return this.entranceLat;
  }

  getLongitude() {
    return this.entranceLng;
  }

  getExitLatitude() {
    return typeof this.exitLat === 'number' ? this.exitLat : this.getLatitude();
  }

  getExitLongitude() {
    return typeof this.exitLng === 'number' ? this.exitLng : this.getLongitude();
  }
}
