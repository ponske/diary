import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  OPTIMIZATION_METHOD: 'wpn6_optimization_method',
  DEFAULT_START_TIME: 'wpn6_default_start_time',
  WALKING_SPEED: 'wpn6_walking_speed',
  SELECTED_ATTRACTIONS: 'wpn6_selected_attractions',
  RESULT_TITLE: 'wpn6_result_title',
  TRANSITION_EFFECT: 'wpn6_transition_effect',
  MAP_SOURCE: 'wpn6_map_source', // apple | osm
};

export const StorageService = {
  async getOptimizationMethod() {
    try {
      const v = await AsyncStorage.getItem(STORAGE_KEYS.OPTIMIZATION_METHOD);
      return v || 'time';
    } catch {
      return 'time';
    }
  },

  async setOptimizationMethod(method) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.OPTIMIZATION_METHOD, method);
    } catch {
      // noop
    }
  },

  async getDefaultStartTime() {
    try {
      const v = await AsyncStorage.getItem(STORAGE_KEYS.DEFAULT_START_TIME);
      return v || '09:00';
    } catch {
      return '09:00';
    }
  },

  async setDefaultStartTime(time) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DEFAULT_START_TIME, time);
    } catch {
      // noop
    }
  },

  async getWalkingSpeed() {
    try {
      const v = await AsyncStorage.getItem(STORAGE_KEYS.WALKING_SPEED);
      return v ? parseInt(v, 10) : 80;
    } catch {
      return 80;
    }
  },

  async setWalkingSpeed(speed) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.WALKING_SPEED, String(speed));
    } catch {
      // noop
    }
  },

  async getResultTitle() {
    try {
      const v = await AsyncStorage.getItem(STORAGE_KEYS.RESULT_TITLE);
      return v || 'まわるじゅんばん';
    } catch {
      return 'まわるじゅんばん';
    }
  },

  async setResultTitle(title) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.RESULT_TITLE, title);
    } catch {
      // noop
    }
  },

  async getTransitionEffect() {
    try {
      const v = await AsyncStorage.getItem(STORAGE_KEYS.TRANSITION_EFFECT);
      return v || 'none'; // none | balloons | bubbles
    } catch {
      return 'none';
    }
  },

  async setTransitionEffect(effect) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSITION_EFFECT, effect);
    } catch {
      // noop
    }
  },

  async getMapSource() {
    try {
      const v = await AsyncStorage.getItem(STORAGE_KEYS.MAP_SOURCE);
      return v || 'apple'; // apple | osm
    } catch {
      return 'apple';
    }
  },

  async setMapSource(source) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MAP_SOURCE, source);
    } catch {
      // noop
    }
  },

  async getSelectedAttractions() {
    try {
      const v = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_ATTRACTIONS);
      return v ? JSON.parse(v) : [];
    } catch {
      return [];
    }
  },

  async setSelectedAttractions(attractions) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_ATTRACTIONS, JSON.stringify(attractions));
    } catch {
      // noop
    }
  },
};
