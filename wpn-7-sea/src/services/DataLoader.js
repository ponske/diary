import { Attraction } from '../models/Attraction';

let attractionsCache = null;
let waitingTimesCache = null;

export class DataLoader {
  static async loadAttractions() {
    try {
      if (attractionsCache) return attractionsCache;

      const module = require('../../data/attractions.json');
      const raw = Array.isArray(module) ? module : module.default || [];

      attractionsCache = raw
        .filter((a) => a && a.is_active && !a.is_invalid)
        .map((a) => new Attraction(a));

      return attractionsCache;
    } catch (e) {
      console.error('Error loading attractions:', e);
      return [];
    }
  }

  static async loadWaitingTimes() {
    try {
      if (waitingTimesCache) return waitingTimesCache;

      const module = require('../../data/waiting_times.json');
      const raw = Array.isArray(module) ? module : module.default || [];
      waitingTimesCache = raw;

      return waitingTimesCache;
    } catch (e) {
      console.error('Error loading waiting times:', e);
      return [];
    }
  }
}
