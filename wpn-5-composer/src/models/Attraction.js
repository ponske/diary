// アトラクション名からアイコンを推測
function getIconFromName(name) {
  if (name.includes('グリーティング') || name.includes('ミート')) return '👋';
  if (name.includes('シアター') || name.includes('ショー')) return '🎭';
  if (name.includes('レストラン') || name.includes('カフェ')) return '🍽️';
  if (name.includes('マウンテン') || name.includes('コースター')) return '🎢';
  if (name.includes('鉄道') || name.includes('電車')) return '🚂';
  if (name.includes('船') || name.includes('ボート')) return '⛵';
  if (name.includes('家') || name.includes('ハウス')) return '🏠';
  if (name.includes('パレード')) return '🎪';
  return '🎢';
}

export class Attraction {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.officialId = data.official_id || '';
    this.entranceLat = data.entrance_lat;
    this.entranceLng = data.entrance_lng;
    this.exitLat = data.exit_lat || data.entrance_lat;
    this.exitLng = data.exit_lng || data.entrance_lng;
    this.areaName = data.area_name || '';
    this.isActive = data.is_active !== false;
    this.isInvalid = data.is_invalid === true;
    
    // デフォルト所要時間を設定（グリーティングは短め、ショーは長め）
    let defaultDuration = 20;
    if (this.name.includes('グリーティング') || this.name.includes('ミート')) {
      defaultDuration = 15;
    } else if (this.name.includes('シアター') || this.name.includes('ショー')) {
      defaultDuration = 30;
    } else if (this.name.includes('レストラン')) {
      defaultDuration = 60;
    }
    this.durationMinutes = data.duration_minutes || defaultDuration;
    
    this.genre = data.genre || 'other';
    this.icon = data.icon || getIconFromName(this.name);
  }

  getLatitude() {
    return this.entranceLat;
  }

  getLongitude() {
    return this.entranceLng;
  }
}
