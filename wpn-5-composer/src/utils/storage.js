import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  LANGUAGE: 'language',
  OPTIMIZATION_METHOD: 'optimization_method',
  DEFAULT_START_TIME: 'default_start_time',
  WALKING_SPEED: 'walking_speed',
  SELECTED_ATTRACTIONS: 'selected_attractions',
};

export const StorageService = {
  async getLanguage() {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
      return value || 'ja';
    } catch (error) {
      console.error('Error getting language:', error);
      return 'ja';
    }
  },

  async setLanguage(language) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
    } catch (error) {
      console.error('Error setting language:', error);
    }
  },

  async getOptimizationMethod() {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.OPTIMIZATION_METHOD);
      return value || 'time';
    } catch (error) {
      console.error('Error getting optimization method:', error);
      return 'time';
    }
  },

  async setOptimizationMethod(method) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.OPTIMIZATION_METHOD, method);
    } catch (error) {
      console.error('Error setting optimization method:', error);
    }
  },

  async getDefaultStartTime() {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.DEFAULT_START_TIME);
      return value || '09:00';
    } catch (error) {
      console.error('Error getting default start time:', error);
      return '09:00';
    }
  },

  async setDefaultStartTime(time) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DEFAULT_START_TIME, time);
    } catch (error) {
      console.error('Error setting default start time:', error);
    }
  },

  async getWalkingSpeed() {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.WALKING_SPEED);
      return value ? parseInt(value, 10) : 80;
    } catch (error) {
      console.error('Error getting walking speed:', error);
      return 80;
    }
  },

  async setWalkingSpeed(speed) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.WALKING_SPEED, speed.toString());
    } catch (error) {
      console.error('Error setting walking speed:', error);
    }
  },

  async getSelectedAttractions() {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_ATTRACTIONS);
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.error('Error getting selected attractions:', error);
      return [];
    }
  },

  async setSelectedAttractions(attractions) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_ATTRACTIONS, JSON.stringify(attractions));
    } catch (error) {
      console.error('Error setting selected attractions:', error);
    }
  },
};
