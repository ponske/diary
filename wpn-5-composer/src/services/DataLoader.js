import { Attraction } from '../models/Attraction';

// 遅延読み込み: require()を関数内で実行することで、Metroの監視対象から除外
// ただし、実際にはrequire()はバンドル時に解決されるため、監視は避けられない
// 代わりに、.watchmanconfigでassets/dataフォルダを監視対象から除外している

let attractionsDataCache = null;
let waitingTimesDataCache = null;

export class DataLoader {
  static async loadAttractions() {
    try {
      if (attractionsDataCache) {
        return attractionsDataCache;
      }

      // 遅延読み込み: 関数内でrequire()を実行
      // これにより、Metroが監視するタイミングを遅らせる
      const attractionsModule = require('../../assets/data/attractions.json');
      const attractionsData = Array.isArray(attractionsModule) 
        ? attractionsModule 
        : attractionsModule.default || [];
      
      attractionsDataCache = attractionsData
        .filter(attr => attr.is_active && !attr.is_invalid)
        .map(attr => new Attraction(attr));
      
      return attractionsDataCache;
    } catch (error) {
      console.error('Error loading attractions:', error);
      return [];
    }
  }

  static async loadWaitingTimes() {
    try {
      if (waitingTimesDataCache) {
        return waitingTimesDataCache;
      }

      // 遅延読み込み: 関数内でrequire()を実行
      const waitingTimesModule = require('../../assets/data/waiting_times.json');
      waitingTimesDataCache = Array.isArray(waitingTimesModule)
        ? waitingTimesModule
        : waitingTimesModule.default || [];
      
      return waitingTimesDataCache;
    } catch (error) {
      console.error('Error loading waiting times:', error);
      return [];
    }
  }
}
